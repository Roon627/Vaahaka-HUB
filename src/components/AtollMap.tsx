"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from "react-simple-maps";
import { interpolateRgb } from "d3-interpolate";
import { useAtollStats } from "@/hooks/useAtollStats";
import { centroidOf, resolveAtollCode, type AtollCollection } from "@/lib/geo";
import {
  ATOLLS, ATOLL_BY_CODE, ATOLL_GEOJSON_URL, CATEGORIES, CATEGORY_BY_ID, DEFAULT_HEAT_COLOR, type CategoryId,
} from "@/lib/constants";
import { useSea } from "./SeaProvider";
import MoodButton from "./MoodButton";
import MoodSheet from "./MoodSheet";

const HOME: [number, number] = [73.2, 3.2];
const BINS = 5;
const QUIET = "#0f2a35"; // atolls with no stories
const EDGE = "rgba(190,230,225,0.28)";
const nonScaling = { vectorEffect: "non-scaling-stroke" } as React.CSSProperties; // keep outlines crisp when zoomed

/** Grid lines as [from, to] in [lng, lat]: parallels every 1° and meridians every 1° across the archipelago. */
const GRID: [[number, number], [number, number]][] = [
  ...Array.from({ length: 11 }, (_, i) => [[71.6, i - 2], [74.8, i - 2]] as [[number, number], [number, number]]),
  ...[72, 73, 74].map((x) => [[x, -2], [x, 8.5]] as [[number, number], [number, number]]),
];

interface Tip { code: string; x: number; y: number }

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
 *  - Choropleth in 5 steps (easier to read than a smooth ramp) tinted by the chosen mood.
 *  - Proportional markers + labels; click an atoll to inspect it in the side panel,
 *    where its mood breakdown and shortcuts to read / write live.
 *  - One RPC per mood is fetched up front, so mood switching is instant.
 */
export default function AtollMap() {
  const router = useRouter();
  const { openWriter } = useSea();
  const { stats, loading } = useAtollStats();

  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>(HOME);
  const wrapRef = useRef<HTMLDivElement>(null);
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

  // Up to 5 steps on a sqrt scale (so one huge atoll doesn't wash out the rest). Upper bounds are
  // de-duplicated: with few stories (say max 6) several steps would otherwise collapse onto one number.
  const steps = useMemo(() => Array.from(new Set(Array.from({ length: BINS }, (_, i) => Math.ceil(max * ((i + 1) / BINS) ** 2)))), [max]);
  const bin = (n: number) => (n === 0 ? 0 : steps.findIndex((t) => n <= t) + 1); // 0 = quiet, 1..steps.length
  const ramp = useMemo(() => interpolateRgb("#1f5967", heat), [heat]);
  const fillFor = (code: string | null) => { const b = bin(code ? counts[code] ?? 0 : 0); return b === 0 ? QUIET : ramp(0.2 + 0.8 * (b / steps.length)); };
  const legend = steps.map((hi, i) => ({ color: ramp(0.2 + 0.8 * ((i + 1) / steps.length)), hi }));

  // Totals per mood for the sheet (all + one per mood)
  const moodTotals = useMemo(() => Object.fromEntries(["all", ...CATEGORIES.map((c) => c.id)].map((k) => [k, Object.values(stats[k] ?? {}).reduce((a, b) => a + b, 0)])), [stats]);

  const ranked = useMemo(
    () => ATOLLS.map((a) => ({ ...a, n: counts[a.code] ?? 0 })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    [counts]
  );
  const breakdown = (code: string) => CATEGORIES.map((c) => ({ id: c.id, n: stats[c.id]?.[code] ?? 0 }));
  const sel = selected ? ATOLL_BY_CODE[selected] : null;

  const goRead = (code: string) => {
    const q = new URLSearchParams({ atoll: code });
    if (category) q.set("cat", category);
    router.push(`/?${q.toString()}`);
  };

  const track = (code: string) => (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHovered(code);
    setTip({ code, x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const clear = () => { setHovered(null); setTip(null); };
  const zoomTo = (z: number) => setZoom(Math.min(8, Math.max(1, z)));

  // Names on the map: always the focused atoll; plus the busiest few when zoomed out, or every active one when zoomed in.
  const topFew = new Set(ranked.slice(0, 4).filter((a) => a.n > 0).map((a) => a.code));
  const labelled = (code: string) => code === selected || code === hovered || (zoom >= 2.5 ? (counts[code] ?? 0) > 0 : topFew.has(code));

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16">
      <header className="pb-5 pt-2 sm:pb-6 sm:pt-4">
        <h1 className="font-display text-3xl font-light text-foam sm:text-5xl">
          Where the stories <em className="font-normal transition-colors duration-700" style={{ color: heat }}>come from</em>
        </h1>
        <p className="mt-2 text-sm text-mist">
          {loading ? "Loading the tallies…" : `${total.toLocaleString()} ${category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""}${total === 1 ? "story" : "stories"} across ${active} of ${ATOLLS.length} regions. Anonymous and aggregated.`}
        </p>
      </header>

      {/* Mood: one button (the mascot wearing the current mood) opens a sheet of moods with their totals */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <MoodButton value={category} count={total} onClick={() => setMoodOpen(true)} />
        <span className="text-xs text-mist">Tap to switch the map's mood</span>
      </div>
      <AnimatePresence>
        {moodOpen && <MoodSheet value={category} onChange={setCategory} onClose={() => setMoodOpen(false)} counts={moodTotals} />}
      </AnimatePresence>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,540px)_1fr]">
        {/* -------------------------------------------------------------- map */}
        <div ref={wrapRef} onMouseLeave={clear} className={`relative h-[62dvh] min-h-[420px] overflow-hidden sm:h-[min(74vh,720px)] sm:min-h-[460px] ${interactive ? "" : "map-locked"} rounded-2xl border border-white/10 bg-[#081822]/90 shadow-soft`}>
          {geoFailed ? (
            <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-mist">Couldn't load the atoll boundaries. Check public/data/maldives-atolls.geojson.</p>
          ) : (
            <ComposableMap projection="geoMercator" projectionConfig={{ center: HOME, scale: 3700 }} width={400} height={640} style={{ width: "100%", height: "100%" }}>
              <ZoomableGroup
                center={center} zoom={zoom} minZoom={1} maxZoom={8}
                onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates as [number, number]); setZoom(z); }}
                // The wheel stays free for page scrolling; zoom with the buttons or by pinching.
                // react-simple-maps passes the d3 *event* here (its typings say SVGElement), and
                // replacing the default filter means re-stating its ctrl/right-click checks.
                filterZoomEvent={((e: MouseEvent) => e.type !== "wheel" && !e.ctrlKey && !e.button) as unknown as (el: SVGElement) => boolean}
              >
                {/* faint 1° grid, drawn only over the Maldives (react-simple-maps' <Graticule> covers the whole globe: ~1.5MB of SVG) */}
                {GRID.map(([a, b], i) => <Line key={i} from={a} to={b} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} style={nonScaling} />)}

                {fc && (
                  <Geographies geography={fc}>
                    {({ geographies }) => geographies.map((geo) => {
                      const code = resolveAtollCode(geo.properties);
                      const on = code !== null && (code === selected || code === hovered);
                      return (
                        <Geography
                          key={geo.rsmKey} geography={geo}
                          onMouseMove={code ? track(code) : undefined} onMouseLeave={clear}
                          onClick={() => code && setSelected((s) => (s === code ? null : code))}
                          style={{
                            default: { ...nonScaling, fill: fillFor(code), stroke: on ? "#f5efe4" : EDGE, strokeWidth: on ? 1.6 : 0.8, outline: "none", transition: "fill .5s" },
                            hover: { ...nonScaling, fill: fillFor(code), stroke: "#f5efe4", strokeWidth: 1.6, outline: "none", cursor: "pointer" },
                            pressed: { ...nonScaling, fill: fillFor(code), outline: "none" },
                          }}
                        />
                      );
                    })}
                  </Geographies>
                )}

                {/* Proportional markers + labels (sized in screen pixels, so they don't balloon when zoomed) */}
                {ATOLLS.map((a) => {
                  const n = counts[a.code] ?? 0;
                  const r = (n === 0 ? 2.5 : 4 + 9 * Math.sqrt(n / max)) / Math.sqrt(zoom);
                  const focus = a.code === selected || a.code === hovered;
                  return (
                    <Marker key={a.code} coordinates={where[a.code]} onMouseMove={track(a.code)} onMouseLeave={clear} onClick={() => setSelected((s) => (s === a.code ? null : a.code))}>
                      <g style={{ cursor: "pointer" }}>
                        <circle r={Math.max(r + 5, 12) / Math.sqrt(zoom)} fill="transparent" />
                        <circle r={r} fill={n ? heat : "#7fb6b0"} fillOpacity={n ? 0.4 : 0.35} stroke={focus ? "#f5efe4" : n ? heat : "none"} strokeWidth={(focus ? 1.8 : 1.1) / zoom} />
                        {labelled(a.code) && (
                          <text x={r + 4 / zoom} y={3.2 / zoom} fontSize={10 / zoom} fill="#f5efe4" stroke="#081822" strokeWidth={3 / zoom} paintOrder="stroke" style={{ pointerEvents: "none", fontWeight: 500 }}>
                            {a.code === "MLE" ? "Malé" : a.name}
                          </text>
                        )}
                      </g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          )}

          {/* zoom controls */}
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-abyss/70 text-foam backdrop-blur-md">
            {[["+", "Zoom in", () => zoomTo(zoom * 1.6)], ["−", "Zoom out", () => zoomTo(zoom / 1.6)], ["⌂", "Reset view", () => { setZoom(1); setCenter(HOME); }]].map(([g, l, f]) => (
              <button key={l as string} aria-label={l as string} title={l as string} onClick={f as () => void} className="h-11 w-11 text-lg transition hover:bg-white/10 active:bg-white/15 sm:h-10 sm:w-10">{g as string}</button>
            ))}
            {coarse && (
              <button aria-pressed={interactive} aria-label={interactive ? "Lock map so swiping scrolls the page" : "Unlock map to drag and pinch"} onClick={() => setInteractive((v) => !v)}
                className={`h-11 w-11 border-t border-white/10 text-base transition ${interactive ? "bg-glow/20 text-glow" : "hover:bg-white/10"}`}>{interactive ? "✋" : "🔒"}</button>
            )}
          </div>

          {sel && (
            <div className="absolute inset-x-3 bottom-[4.25rem] z-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-abyss/90 p-3 backdrop-blur-md lg:hidden">
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg leading-tight text-foam">{sel.name}</div>
                <div className="text-xs text-mist"><span className="tabular-nums text-foam">{(all[sel.code] ?? 0).toLocaleString()}</span> stories</div>
              </div>
              <button onClick={() => goRead(sel.code)} className="shrink-0 rounded-full bg-gradient-to-r from-glow to-sand px-4 py-2 text-xs font-semibold text-abyss">Read →</button>
              <button onClick={() => setSelected(null)} aria-label="Deselect" className="shrink-0 rounded-full p-2 text-mist">✕</button>
            </div>
          )}

          {/* legend: 5 steps, labelled with their upper bound */}
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-abyss/70 px-3 py-2 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-mist">
              <span className="mr-1">stories</span>
              <span className="h-2.5 w-4 rounded-sm" style={{ background: QUIET, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)" }} /><span>0</span>
              {legend.map((l, i) => (<span key={i} className="flex items-center gap-1"><span className="ml-1 h-2.5 w-4 rounded-sm" style={{ background: l.color }} /><span className="tabular-nums">{i === legend.length - 1 ? `≤${l.hi}` : l.hi}</span></span>))}
            </div>
          </div>

          <AnimatePresence>
            {tip && (
              <motion.div key="tip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-white/15 bg-abyss/90 px-3.5 py-2 text-xs shadow-soft backdrop-blur-md"
                style={{ left: Math.min(Math.max(tip.x, 70), (wrapRef.current?.clientWidth ?? 400) - 70), top: tip.y - 12 }}>
                <div className="font-medium text-foam">{ATOLL_BY_CODE[tip.code]?.name}</div>
                <div className="tabular-nums" style={{ color: heat }}>{(counts[tip.code] ?? 0).toLocaleString()} {category ? CATEGORY_BY_ID[category].label.toLowerCase() : ""} {(counts[tip.code] ?? 0) === 1 ? "story" : "stories"}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------------------------------------------------- insights */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Stories", total.toLocaleString()],
              ["Regions", `${active} / ${ATOLLS.length}`],
              ["Busiest", ranked[0]?.n ? ranked[0].name : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4">
                <div className="truncate text-[10px] uppercase tracking-widest text-mist sm:text-[11px]">{k}</div>
                <div className="mt-1 truncate font-display text-xl text-foam tabular-nums sm:text-2xl">{v}</div>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-mist">{sel.code} · {sel.aka[0] ?? "Atoll"}</div>
                    <h2 className="font-display text-2xl text-foam">{sel.name}</h2>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Deselect" className="rounded-full p-1.5 text-mist transition hover:bg-white/10 hover:text-foam">✕</button>
                </div>
                <p className="mt-1 text-sm text-mist"><span className="font-display text-xl tabular-nums text-foam">{(all[sel.code] ?? 0).toLocaleString()}</span> stories in total</p>
                <div className="mt-4"><MoodBar parts={breakdown(sel.code)} /></div>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {breakdown(sel.code).sort((a, b) => b.n - a.n).map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-mist"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_BY_ID[p.id].color }} />{CATEGORY_BY_ID[p.id].label}</span><span className="tabular-nums text-foam">{p.n}</span></li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => goRead(sel.code)} className="rounded-full bg-gradient-to-r from-glow to-sand px-5 py-2 text-sm font-semibold text-abyss">Read these bottles →</button>
                  <button onClick={() => openWriter({ atoll: sel.code, category })} className="rounded-full border border-white/20 px-5 py-2 text-sm text-foam transition hover:bg-white/10">Write from {sel.name}</button>
                </div>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-white/15 px-5 py-6 text-sm text-mist">
                Click an atoll, on the map or in the list, to see how its stories break down by mood. Drag to pan; use + / − to zoom.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-medium uppercase tracking-widest text-mist">By region</h2><span className="text-[11px] text-mist">{category ? CATEGORY_BY_ID[category].label : "all moods"}</span></div>
            <ol className="space-y-0.5">
              {ranked.map((a, i) => (
                <li key={a.code}>
                  <button onMouseEnter={() => setHovered(a.code)} onMouseLeave={() => setHovered(null)} onClick={() => setSelected((s) => (s === a.code ? null : a.code))}
                    className={`grid w-full grid-cols-[1.25rem_6.5rem_1fr_2rem] items-center gap-2 sm:grid-cols-[1.5rem_8.5rem_1fr_2.5rem] sm:gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${hovered === a.code || selected === a.code ? "bg-white/10 text-foam" : "text-mist hover:bg-white/5"}`}>
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
