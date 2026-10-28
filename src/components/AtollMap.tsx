"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useAtollStats } from "@/hooks/useAtollStats";
import { centroidOf, type AtollCollection } from "@/lib/geo";
import {
  ATOLLS, ATOLL_BY_CODE, ATOLL_GEOJSON_URL, CATEGORIES, CATEGORY_BY_ID, DEFAULT_HEAT_COLOR, type CategoryId,
} from "@/lib/constants";
import { useSea } from "./SeaProvider";
import type { MapHandle } from "./LeafletMap";
import { norm } from "@/lib/search";
import { skyAt } from "@/lib/sky";
import MoodSheet from "./MoodSheet";

// Leaflet touches `window`, so it only loads in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#0a1c26]" /> });


/** Horizontal bar split by mood: how an atoll's stories break down. `scale` = share of the full width it fills. */
function MoodBar({ parts, scale = 1 }: { parts: { id: CategoryId; n: number }[]; scale?: number }) {
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={parts.filter((p) => p.n).map((p) => `${CATEGORY_BY_ID[p.id].label} ${p.n}`).join(", ") || "no stories"}>
      <div className="flex h-full" style={{ width: `${Math.max(scale, 0) * 100}%` }}>
        {parts.map((p) => p.n > 0 && <span key={p.id} style={{ width: `${(p.n / total) * 100}%`, background: CATEGORY_BY_ID[p.id].color }} />)}
      </div>
    </div>
  );
}

/**
 * Heatmap of where stories come from.
 *  - Real atoll boundaries (jawish/maldives-geo) with drag-to-pan and +/- zoom.
 *  - One donut per region: ring = mood mix, centre = count, size = volume; ripples where letters landed in the last 24h.
 *  - Proportional markers + labels; click an atoll to inspect it in the side panel,
 *    where its mood breakdown and shortcuts to read / write live.
 *  - One RPC per mood is fetched up front, so mood switching is instant.
 */
export default function AtollMap() {
  const router = useRouter();
  const { openWriter } = useSea();
  const { stats, recent, loading } = useAtollStats();
  const { lastArrival } = useSea();

  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moodOpen, setMoodOpen] = useState(false);
  const mapRef = useRef<MapHandle>(null);
  const mapStage = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState<string[]>([]);
  useEffect(() => {
    if (selected) setVisited((previous) => previous.includes(selected) ? previous : [...previous, selected]);
  }, [selected]);
  // The map's look follows the real sun over Malé (set after mount so server and client markup agree).
  const [daylight, setDaylight] = useState(0);
  useEffect(() => { const tick = () => setDaylight(skyAt(new Date()).daylight); tick(); const t = setInterval(tick, 60_000); return () => clearInterval(t); }, []);
  const [interactive, setInteractive] = useState(true);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => { const c = !window.matchMedia("(pointer: fine)").matches; setCoarse(c); setInteractive(!c); }, []);

  // Boundaries: fetched here (not by <Geographies url>) so we can derive centroids for markers/labels.
  const [fc, setFc] = useState<AtollCollection | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  useEffect(() => { fetch(ATOLL_GEOJSON_URL).then((r) => r.json()).then(setFc).catch(() => setGeoFailed(true)); }, []);
  const where = useMemo(() => {
    const m: Record<string, [number, number]> = {};
    for (const a of ATOLLS) m[a.code] = [a.lng, a.lat]; // fallback (and the only position for Malé City, which has no polygon)
    for (const f of fc?.features ?? []) m[f.properties.code] = centroidOf(f.geometry);
    return m;
  }, [fc]);

  const heat = category ? CATEGORY_BY_ID[category].color : DEFAULT_HEAT_COLOR;
  const counts = stats[category ?? "all"] ?? {};
  const all = stats.all ?? {};
  const max = Math.max(1, ...Object.values(counts));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = Object.values(counts).filter((n) => n > 0).length;

  // Totals per mood for the sheet (all + one per mood)
  const moodTotals = useMemo(() => Object.fromEntries(["all", ...CATEGORIES.map((c) => c.id)].map((k) => [k, Object.values(stats[k] ?? {}).reduce((a, b) => a + b, 0)])), [stats]);

  const ranked = useMemo(
    () => ATOLLS.map((a) => ({ ...a, n: counts[a.code] ?? 0 })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    [counts]
  );
  const breakdown = (code: string) => CATEGORIES.map((c) => ({ id: c.id, n: stats[c.id]?.[code] ?? 0 }));
  const sel = selected ? ATOLL_BY_CODE[selected] : null;

  const destinations = ranked.filter((a) => a.n > 0);
  const stops = destinations.length ? destinations : ranked;
  const discover = (direction?: number) => {
    const alternatives = stops.filter((a) => a.code !== selected);
    const index = stops.findIndex((a) => a.code === selected);
    const next = direction
      ? stops[(Math.max(index, 0) + direction + stops.length) % stops.length]
      : alternatives[Math.floor(Math.random() * alternatives.length)] ?? stops[0];
    if (!next) return;
    setSelected(next.code);
    navigator.vibrate?.(8);
    mapStage.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };
  const dominant = sel ? breakdown(sel.code).sort((a, b) => b.n - a.n)[0] : null;

  const goRead = (code: string) => {
    const q = new URLSearchParams({ atoll: code });
    if (category) q.set("cat", category);
    router.push(`/?${q.toString()}`);
  };


  return (
    <section className="island-explorer mx-auto w-full max-w-6xl px-4 pb-16">
      <header className="pb-5 pt-2 sm:pb-6 sm:pt-4">
        <h1 className="font-display text-3xl font-light text-foam sm:text-4xl">
          Follow the <em className="font-normal transition-colors duration-700" style={{ color: heat }}>tide.</em>
        </h1>
        <p className="mt-2 text-sm text-mist">Hop between islands. Find a feeling that finds you.</p>
        <p className="sr-only">
          {loading ? "Loading the tallies…" : `${total.toLocaleString()} ${category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""}${total === 1 ? "story" : "stories"} across ${active} of ${ATOLLS.length} regions. Anonymous and aggregated.`}
        </p>
      </header>

      {/* Mood: one button (the mascot wearing the current mood) opens a sheet of moods with their totals */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <button className="shore-filter" aria-haspopup="dialog" onClick={() => setMoodOpen(true)}>{category ? CATEGORY_BY_ID[category].label : "All feelings"}<span aria-hidden>⌄</span></button>
        <button className="shore-primary" disabled={loading} onClick={() => discover()}>✧ Surprise me</button>
        <button className="shore-filter" onClick={() => { setSelected(null); setCategory(null); setSearch(""); mapRef.current?.reset(); }}>Reset view <span aria-hidden>↺</span></button>
      </div>
      <AnimatePresence>
        {moodOpen && <MoodSheet value={category} onChange={setCategory} onClose={() => setMoodOpen(false)} counts={moodTotals} />}
      </AnimatePresence>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,540px)_1fr]">
        {/* -------------------------------------------------------------- map */}
        <div ref={mapStage} className="relative isolate scroll-mt-24 h-[58dvh] min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#081822]/90 shadow-soft sm:h-[min(74vh,720px)] sm:min-h-[460px]">
          {geoFailed ? (
            <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-mist">Couldn't load the atoll boundaries. You can still explore regions in the list below.</p>
          ) : (
            <LeafletMap
              ref={mapRef} fc={fc} counts={counts} max={max} category={category} breakdown={breakdown} recent={recent} arrival={lastArrival} daylight={daylight} where={where}
              selected={selected} hovered={hovered}
              onSelect={(c) => setSelected((s) => (s === c ? null : c))} onHover={setHovered}
              interactive={interactive}
              names={Object.fromEntries(ATOLLS.map((a) => [a.code, a.code === "MLE" ? "Malé" : a.name]))}
              tip={(c) => `${ATOLL_BY_CODE[c]?.name}: ${(counts[c] ?? 0).toLocaleString()} ${category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""}${(counts[c] ?? 0) === 1 ? "story" : "stories"}`}
            />
          )}

          {/* zoom controls */}
          <div className="absolute right-3 top-3 z-[1000] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-abyss/70 text-foam backdrop-blur-md">
            {[["+", "Zoom in", () => mapRef.current?.zoomIn()], ["−", "Zoom out", () => mapRef.current?.zoomOut()], ["⌂", "Reset view", () => { setSelected(null); mapRef.current?.reset(); }]].map(([g, l, f]) => (
              <button key={l as string} aria-label={l as string} title={l as string} onClick={f as () => void} className="h-11 w-11 text-lg transition hover:bg-white/10 active:bg-white/15 sm:h-10 sm:w-10">{g as string}</button>
            ))}
          </div>

          {coarse && <button onClick={() => setInteractive((v) => !v)} aria-pressed={interactive} className="absolute left-3 top-3 z-[1000] min-h-11 rounded-full border border-white/15 bg-abyss/90 px-4 text-xs text-foam shadow-soft">{interactive ? "Done exploring ✓" : "Move map ↔"}</button>}
          {!sel && <div className="pointer-events-none absolute inset-x-10 bottom-20 z-[1000] rounded-full bg-abyss/80 px-3 py-2 text-center text-xs text-foam backdrop-blur-md">✧ Tap a bottle. Discover a shore.</div>}
          {sel && (
            <div className="absolute inset-x-3 bottom-[4.25rem] z-[1000] flex items-center gap-3 rounded-2xl border border-white/15 bg-abyss/90 p-3 backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg leading-tight text-foam">{sel.name}</div>
                <div className="text-xs text-mist"><span className="tabular-nums text-foam">{(counts[sel.code] ?? 0).toLocaleString()}</span> {category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""}bottles</div>
              </div>
              <button aria-label="Next island" onClick={() => discover(1)} className="h-9 w-9 shrink-0 rounded-full border border-white/15 text-glow">↝</button>
              <button onClick={() => goRead(sel.code)} className="shrink-0 rounded-full bg-gradient-to-r from-glow to-sand min-h-11 px-4 py-2 text-xs font-semibold text-abyss">Read →</button>
              <button onClick={() => setSelected(null)} aria-label="Deselect" className="h-11 w-11 shrink-0 rounded-full text-mist">✕</button>
            </div>
          )}

          {/* how to read the markers */}
          <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-xl border border-white/10 bg-abyss/75 px-3 py-2 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-mist">
              <span>{category ? `${CATEGORY_BY_ID[category].label}: bottles carry stories` : "bottle = region · colour = top feeling"}</span>
              {!category && <span className="flex items-center gap-1">{CATEGORIES.map((c) => <span key={c.id} title={c.label} className="h-2 w-2 rounded-full" style={{ background: c.color }} />)}</span>}
              <span className="flex items-center gap-1"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-glow" /></span>new in 24h</span>
            </div>
          </div>

        </div>

        {/* ---------------------------------------------------------- insights */}
        <div className="space-y-4">
          <div className="voyage-card">
            <div className="flex items-center gap-4">
              <img src={`/brand/stickers/${dominant?.n ? dominant.id : "happy"}.svg`} width={48} height={58} alt="" className="h-14 w-auto shrink-0" />
              <div className="min-w-0 flex-1" aria-live="polite">
                <p className="text-[10px] uppercase tracking-[.2em] text-glow">{sel ? "You’ve drifted to" : "Your island trail"}</p>
                <h2 className="mt-1 font-display text-2xl text-foam">{sel ? sel.name : "A little serendipity"}</h2>
                <p className="mt-1 text-xs text-mist">{sel ? (dominant?.n ? `${CATEGORY_BY_ID[dominant.id].label} is the most shared feeling here.` : "A quiet shore. Leave its first letter.") : "Every shore has a story. Choose your first stop."}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
              <button className="shore-filter" aria-label="Previous island" onClick={() => discover(-1)}>← Back</button>
              <span className="text-xs text-mist">{visited.length ? `${visited.length} shores explored` : "Let curiosity lead"}</span>
              <button className="shore-filter" aria-label="Next island" onClick={() => discover(1)}>Next ↝</button>
            </div>
            {visited.length > 0 && <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Visited regions">{visited.map((code) => <button key={code} aria-pressed={selected === code} onClick={() => setSelected(code)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${selected === code ? "border-glow/40 bg-glow/10 text-glow" : "border-white/10 text-mist"}`}>{ATOLL_BY_CODE[code].name}</button>)}</div>}
          </div>

          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-mist">{sel.code} · {sel.aka[0] ?? "Atoll"}</div>
                    <h2 className="font-display text-2xl text-foam">{sel.name}</h2>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Deselect" className="h-11 w-11 rounded-full text-mist transition hover:bg-white/10 hover:text-foam">✕</button>
                </div>
                <p className="mt-1 text-sm text-mist"><span className="font-display text-xl tabular-nums text-foam">{(all[sel.code] ?? 0).toLocaleString()}</span> {(all[sel.code] ?? 0) === 1 ? "story" : "stories"} in total</p>
                <details className="mt-4"><summary className="cursor-pointer py-2 text-xs text-glow">Explore the feelings here</summary><MoodBar parts={breakdown(sel.code)} />
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {breakdown(sel.code).sort((a, b) => b.n - a.n).map((p) => (
                    <li key={p.id}><button aria-pressed={category === p.id} onClick={() => setCategory(category === p.id ? null : p.id)} className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-mist transition hover:bg-white/10 ${category === p.id ? "bg-white/10 text-foam" : ""}`}><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_BY_ID[p.id].color }} />{CATEGORY_BY_ID[p.id].label}</span><span className="tabular-nums text-foam">{p.n}</span></button></li>
                  ))}
                </ul></details>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => goRead(sel.code)} className="min-h-11 rounded-full bg-gradient-to-r from-glow to-sand px-5 py-2 text-sm font-semibold text-abyss">Read these bottles →</button>
                  <button onClick={() => openWriter({ atoll: sel.code, category })} className="min-h-11 rounded-full border border-white/20 px-5 py-2 text-sm text-foam transition hover:bg-white/10">Write from {sel.name}</button>
                </div>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden rounded-2xl border border-dashed border-white/15 px-5 py-6 text-sm text-mist lg:block">
                Choose a region to discover its feelings. Tap a mood below to filter its stories.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-medium uppercase tracking-widest text-mist">By region</h2><span className="text-[11px] text-mist">{category ? CATEGORY_BY_ID[category].label : "all moods"}</span></div>
            <label className="sr-only" htmlFor="region-search">Find a region</label>
            <input id="region-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find an atoll or region…" className="mb-3 min-h-11 w-full rounded-xl border border-white/15 bg-abyss/50 px-3 text-base text-foam placeholder:text-mist/70 focus:border-glow focus:outline-none" />
            {!ranked.some((a) => [a.name, a.code, ...a.aka].some((v) => norm(v).includes(norm(search)))) && <p role="status" className="py-4 text-sm text-mist">No matching regions. Try another name.</p>}
            <ol className="max-h-80 space-y-0.5 overflow-y-auto overscroll-contain">

              {ranked.filter((a) => [a.name, a.code, ...a.aka].some((v) => norm(v).includes(norm(search)))).map((a, i) => (
                <li key={a.code}>
                  <button aria-pressed={selected === a.code} onFocus={() => setHovered(a.code)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(a.code)} onMouseLeave={() => setHovered(null)} onClick={() => setSelected((s) => (s === a.code ? null : a.code))}
                    className={`grid min-h-11 w-full grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2 sm:grid-cols-[1.5rem_8.5rem_1fr_2.5rem] sm:gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${hovered === a.code || selected === a.code ? "bg-white/10 text-foam" : "text-mist hover:bg-white/5"}`}>
                    <span className="text-[11px] tabular-nums opacity-60">{i + 1}</span>
                    <span className="truncate">{a.name}</span>
                    <MoodBar parts={category ? [{ id: category, n: a.n }] : breakdown(a.code)} scale={a.n / max} />
                    <span className="text-right tabular-nums">{a.n}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
