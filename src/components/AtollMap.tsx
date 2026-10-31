"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useAtollStats } from "@/hooks/useAtollStats";
import { centroidOf, type AtollCollection } from "@/lib/geo";
import {
  ATOLLS,
  ATOLL_BY_CODE,
  ATOLL_THAANA,
  ATOLL_GEOJSON_URL,
  CATEGORIES,
  CATEGORY_BY_ID,
  DEFAULT_HEAT_COLOR,
  type CategoryId,
} from "@/lib/constants";
import { useSea } from "./SeaProvider";
import type { MapHandle } from "./LeafletMap";
import { norm } from "@/lib/search";
import { skyAt } from "@/lib/sky";
import { timeAgo } from "@/lib/time";
import { supabase } from "@/lib/supabase";
import { POST_COLUMNS } from "@/hooks/usePosts";
import type { Post } from "@/lib/types";
import MoodSheet from "./MoodSheet";

// Leaflet touches `window`, so it only loads in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a1c26] text-xs text-mist animate-pulse">
      Charting the archipelago...
    </div>
  ),
});

/** Horizontal bar split by mood: how an atoll's stories break down. `scale` = share of the full width it fills. */
function MoodBar({ parts, scale = 1 }: { parts: { id: CategoryId; n: number }[]; scale?: number }) {
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
      role="img"
      aria-label={parts.filter((p) => p.n).map((p) => `${CATEGORY_BY_ID[p.id].label} ${p.n}`).join(", ") || "no stories"}
    >
      <div className="flex h-full" style={{ width: `${Math.max(scale, 0) * 100}%` }}>
        {parts.map(
          (p) =>
            p.n > 0 && (
              <span
                key={p.id}
                style={{ width: `${(p.n / total) * 100}%`, background: CATEGORY_BY_ID[p.id].color }}
              />
            )
        )}
      </div>
    </div>
  );
}

/**
 * The Archipelago of Whispers (ދިވެހިރާއްޖޭގެ ކަނޑު)
 * An authentic, poetic atlas of the Maldives:
 * - 20 administrative atolls with Thaana script and historical atoll names.
 * - Interactive Leaflet map with smooth flight camera.
 * - Real letter excerpts resting on each shore (click to open & read).
 * - "Drift with the current" autoplay seaplane flight from North to South.
 */
export default function AtollMap() {
  const router = useRouter();
  const { openWriter, openPost, lastArrival } = useSea();
  const { stats, recent, loading } = useAtollStats();

  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moodOpen, setMoodOpen] = useState(false);
  const [drifting, setDrifting] = useState(false);
  const mapRef = useRef<MapHandle>(null);
  const mapStage = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState<string[]>([]);

  // Fetched genuine letter snippets from the selected atoll
  const [atollPosts, setAtollPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (selected) {
      setVisited((prev) => (prev.includes(selected) ? prev : [...prev, selected]));
    }
  }, [selected]);

  // Fetch real letters whenever an atoll is selected
  useEffect(() => {
    if (!selected) {
      setAtollPosts([]);
      return;
    }
    let cancelled = false;
    setLoadingPosts(true);
    let query = supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("atoll_code", selected)
      .order("created_at", { ascending: false })
      .limit(2);

    if (category) {
      query = query.eq("category", category);
    }

    query.then(({ data }) => {
      if (!cancelled) {
        setAtollPosts((data ?? []) as unknown as Post[]);
        setLoadingPosts(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selected, category]);

  // The map follows the real sun over Malé
  const [daylight, setDaylight] = useState(0);
  useEffect(() => {
    const tick = () => setDaylight(skyAt(new Date()).daylight);
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const [interactive, setInteractive] = useState(true);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mouse = window.matchMedia("(any-pointer: fine)");
    const update = () => {
      setCoarse(!mouse.matches);
      setInteractive(mouse.matches);
    };
    update();
    mouse.addEventListener("change", update);
    return () => mouse.removeEventListener("change", update);
  }, []);

  // Boundaries GeoJSON
  const [fc, setFc] = useState<AtollCollection | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  useEffect(() => {
    fetch(ATOLL_GEOJSON_URL)
      .then((r) => r.json())
      .then(setFc)
      .catch(() => setGeoFailed(true));
  }, []);

  const where = useMemo(() => {
    const m: Record<string, [number, number]> = {};
    for (const a of ATOLLS) m[a.code] = [a.lng, a.lat];
    for (const f of fc?.features ?? []) m[f.properties.code] = centroidOf(f.geometry);
    return m;
  }, [fc]);

  const heat = category ? CATEGORY_BY_ID[category].color : DEFAULT_HEAT_COLOR;
  const counts = stats[category ?? "all"] ?? {};
  const all = stats.all ?? {};
  const max = Math.max(1, ...Object.values(counts));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = Object.values(counts).filter((n) => n > 0).length;

  const moodTotals = useMemo(
    () =>
      Object.fromEntries(
        ["all", ...CATEGORIES.map((c) => c.id)].map((k) => [
          k,
          Object.values(stats[k] ?? {}).reduce((a, b) => a + b, 0),
        ])
      ),
    [stats]
  );

  const ranked = useMemo(
    () =>
      ATOLLS.map((a) => ({ ...a, n: counts[a.code] ?? 0 })).sort(
        (a, b) => b.n - a.n || a.name.localeCompare(a.name)
      ),
    [counts]
  );
  const breakdown = (code: string) =>
    CATEGORIES.map((c) => ({ id: c.id, n: stats[c.id]?.[code] ?? 0 }));
  const sel = selected ? ATOLL_BY_CODE[selected] : null;

  const destinations = ranked.filter((a) => a.n > 0);
  const stops = destinations.length ? destinations : ranked;

  const discover = useCallback(
    (direction?: number) => {
      const alternatives = stops.filter((a) => a.code !== selected);
      const index = stops.findIndex((a) => a.code === selected);
      const next = direction
        ? stops[(Math.max(index, 0) + direction + stops.length) % stops.length]
        : alternatives[Math.floor(Math.random() * alternatives.length)] ?? stops[0];
      if (!next) return;
      setSelected(next.code);
      navigator.vibrate?.(8);
      mapStage.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    },
    [stops, selected]
  );

  // Autoplay current drift voyage
  useEffect(() => {
    if (!drifting) return;
    const interval = setInterval(() => {
      discover(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [drifting, discover]);

  const dominant = sel ? breakdown(sel.code).sort((a, b) => b.n - a.n)[0] : null;

  const goRead = (code: string) => {
    const q = new URLSearchParams({ atoll: code });
    if (category) q.set("cat", category);
    router.push(`/?${q.toString()}`);
  };

  return (
    <section className="island-explorer mx-auto w-full max-w-6xl px-4 pb-20">
      {/* ------------------------------------------------------------- header */}
      <header className="pb-5 pt-3 sm:pb-6 sm:pt-4">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-medium text-sand/80">
            ދިވެހިރާއްޖޭގެ ކަނޑު · އަތޮޅުތަކުގެ އަޑު
          </span>
          <span className="h-1 w-1 rounded-full bg-sand/60" />
          <span className="text-xs text-mist/70">26 atolls · 1,192 islands</span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-normal text-foam sm:text-4xl">
          The Archipelago of{" "}
          <em className="font-italic font-normal transition-colors duration-700" style={{ color: heat }}>
            Whispers.
          </em>
        </h1>
        <p className="mt-2 text-sm text-mist max-w-2xl leading-relaxed">
          Follow the ocean currents carrying sealed letters across 20 atolls. Tap any shore to listen to its voices.
        </p>
      </header>

      {/* ----------------------------------------------------------- controls */}
      <div className="flex flex-wrap items-center gap-2 pb-5">
        {/* Animated Mood Picker trigger */}
        <button
          className="shore-filter flex items-center gap-2"
          aria-haspopup="dialog"
          onClick={() => setMoodOpen(true)}
        >
          <img
            src={`/brand/stickers/${category ?? "happy"}.svg`}
            alt=""
            width={18}
            height={22}
            className="h-4 w-auto"
          />
          <span>{category ? CATEGORY_BY_ID[category].label : "All feelings"}</span>
          <span aria-hidden>⌄</span>
        </button>

        {/* Drift with current autoplay */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const next = !drifting;
            setDrifting(next);
            if (next && !selected) discover(1);
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            drifting
              ? "bg-sand text-abyss shadow-[0_0_16px_rgba(236,217,181,0.4)]"
              : "border border-sand/40 bg-sand/15 text-sand hover:bg-sand/25"
          }`}
        >
          <span>⛵</span>
          <span>{drifting ? "Drifting with currents (pause)" : "Drift with current"}</span>
        </motion.button>

        <button
          className="shore-primary"
          disabled={loading}
          onClick={() => discover()}
        >
          ✧ Surprise me
        </button>

        <button
          className="shore-filter"
          onClick={() => {
            setSelected(null);
            setCategory(null);
            setSearch("");
            setDrifting(false);
            mapRef.current?.reset();
          }}
        >
          Reset view <span aria-hidden>↺</span>
        </button>
      </div>

      <AnimatePresence>
        {moodOpen && (
          <MoodSheet
            value={category}
            onChange={setCategory}
            onClose={() => setMoodOpen(false)}
            counts={moodTotals}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------ map + details */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,540px)_1fr]">
        {/* Map Viewport */}
        <div
          ref={mapStage}
          className="relative isolate scroll-mt-24 h-[58dvh] min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#081822]/90 shadow-soft sm:h-[min(74vh,720px)] sm:min-h-[460px]"
        >
          {geoFailed ? (
            <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-mist">
              Couldn't load the atoll boundaries. You can still explore regions in the list below.
            </p>
          ) : (
            <LeafletMap
              mapHandle={mapRef}
              fc={fc}
              counts={counts}
              max={max}
              category={category}
              breakdown={breakdown}
              recent={recent}
              arrival={lastArrival}
              daylight={daylight}
              where={where}
              selected={selected}
              hovered={hovered}
              onSelect={(c) => setSelected((s) => (s === c ? null : c))}
              onHover={setHovered}
              interactive={interactive}
              names={Object.fromEntries(ATOLLS.map((a) => [a.code, a.code === "MLE" ? "Malé" : a.name]))}
              tip={(c) =>
                `${ATOLL_BY_CODE[c]?.name}: ${(counts[c] ?? 0).toLocaleString()} ${
                  category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""
                }${(counts[c] ?? 0) === 1 ? "story" : "stories"}`
              }
            />
          )}

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 z-[1000] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-abyss/80 text-foam backdrop-blur-md">
            {[
              ["+", "Zoom in", () => mapRef.current?.zoomIn()],
              ["−", "Zoom out", () => mapRef.current?.zoomOut()],
              [
                "⌂",
                "Reset view",
                () => {
                  setSelected(null);
                  setDrifting(false);
                  mapRef.current?.reset();
                },
              ],
            ].map(([g, l, f]) => (
              <button
                key={l as string}
                aria-label={l as string}
                title={l as string}
                onClick={f as () => void}
                className="h-11 w-11 text-lg transition hover:bg-white/10 active:bg-white/15 sm:h-10 sm:w-10"
              >
                {g as string}
              </button>
            ))}
          </div>

          {coarse && (
            <button
              onClick={() => setInteractive((v) => !v)}
              aria-pressed={interactive}
              className="absolute left-3 top-3 z-[1000] min-h-11 rounded-full border border-white/15 bg-abyss/90 px-4 text-xs text-foam shadow-soft"
            >
              {interactive ? "Done exploring ✓" : "Move map ↔"}
            </button>
          )}

          {!sel && (
            <div className="pointer-events-none absolute inset-x-8 bottom-16 z-[1000] rounded-full bg-abyss/85 border border-white/10 px-3 py-2 text-center text-xs text-foam backdrop-blur-md">
              ✧ Tap any atoll marker or click "Drift with current" to embark
            </div>
          )}

          {/* Map legend */}
          <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-xl border border-white/10 bg-abyss/85 px-3 py-2 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-mist">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sand" />
                <span>bottle = region · colour = top mood</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-glow" />
                </span>
                <span>ripples = new in 24h</span>
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- right panel */}
        <div className="space-y-4">
          {/* Spotlight Card */}
          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div
                key={sel.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/15 bg-[#0a1f2b]/90 p-5 shadow-lg backdrop-blur-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={`/brand/stickers/${dominant?.n ? dominant.id : "happy"}.svg`}
                      width={44}
                      height={52}
                      alt=""
                      className="h-12 w-auto shrink-0 drop-shadow-md"
                    />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-sm font-semibold text-sand">
                          {ATOLL_THAANA[sel.code]?.dv ?? sel.code}
                        </span>
                        <span className="text-xs text-mist">
                          {ATOLL_THAANA[sel.code]?.atollName ?? sel.aka[0]}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl text-foam">{sel.name}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setDrifting(false);
                    }}
                    aria-label="Close"
                    className="rounded-full p-2 text-mist hover:bg-white/10 hover:text-foam"
                  >
                    ✕
                  </button>
                </div>

                {/* Mood Distribution */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-mist">
                    <span>
                      <strong className="text-foam tabular-nums font-semibold">
                        {(counts[sel.code] ?? 0).toLocaleString()}
                      </strong>{" "}
                      {category ? CATEGORY_BY_ID[category].label.toLowerCase() + " " : ""}letters on this shore
                    </span>
                    <span className="text-[11px] text-sand/80">
                      {dominant?.n ? `${CATEGORY_BY_ID[dominant.id].label} leads` : "Quiet lagoon"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <MoodBar parts={breakdown(sel.code)} />
                  </div>
                </div>

                {/* Real Letters from this Shore */}
                <div className="mt-4 border-t border-white/[0.08] pt-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-sand">
                      Letters Resting on this Shore
                    </span>
                    <span className="text-[10px] text-mist/75">tap to read</span>
                  </div>

                  {loadingPosts ? (
                    <div className="space-y-2">
                      <div className="h-16 w-full animate-pulse rounded-xl bg-white/[0.05]" />
                      <div className="h-16 w-full animate-pulse rounded-xl bg-white/[0.05]" />
                    </div>
                  ) : atollPosts.length > 0 ? (
                    <div className="space-y-2">
                      {atollPosts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => openPost(p)}
                          className="group block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-sand/40 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-center justify-between text-[11px] text-mist mb-1">
                            <span className="font-medium text-foam/90">
                              {p.island ? `${p.island}, ${sel.name}` : `Someone from ${sel.name}`}
                            </span>
                            <span>{timeAgo(p.created_at)}</span>
                          </div>
                          <p className="line-clamp-2 font-display text-xs leading-relaxed text-foam/90 italic">
                            "{p.body}"
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                              style={{
                                background: `${CATEGORY_BY_ID[p.category].color}20`,
                                color: CATEGORY_BY_ID[p.category].color,
                              }}
                            >
                              <span>{CATEGORY_BY_ID[p.category].emoji}</span>
                              <span>{CATEGORY_BY_ID[p.category].label}</span>
                            </span>
                            <span className="text-sand/80 group-hover:text-sand font-medium transition">
                              Read letter →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-mist/75">
                      A quiet lagoon. No letters have washed ashore on this atoll yet.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.08] pt-3.5">
                  <button
                    onClick={() => goRead(sel.code)}
                    className="flex-1 rounded-full bg-sand px-4 py-2 text-xs font-semibold text-abyss transition hover:bg-[#fae8c8] text-center"
                  >
                    Read all from {sel.name} →
                  </button>
                  <button
                    onClick={() => openWriter({ atoll: sel.code, category })}
                    className="rounded-full border border-sand/40 bg-sand/10 px-4 py-2 text-xs font-medium text-sand transition hover:bg-sand/20"
                  >
                    Write to {sel.name} ✍️
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="trail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/10 bg-[#0a1f2b]/70 p-5 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand/15 text-sand">
                    <span className="text-2xl">🧭</span>
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-foam">Island Trail</h2>
                    <p className="text-xs text-mist">
                      {visited.length
                        ? `${visited.length} of ${ATOLLS.length} shores explored`
                        : "Tap any bottle on the map or start drifting"}
                    </p>
                  </div>
                </div>

                {visited.length > 0 && (
                  <div className="no-scrollbar mt-3 flex flex-wrap gap-1.5" aria-label="Visited regions">
                    {visited.map((code) => (
                      <button
                        key={code}
                        onClick={() => setSelected(code)}
                        className="rounded-full border border-sand/30 bg-sand/10 px-2.5 py-1 text-[11px] text-sand hover:bg-sand/20 transition"
                      >
                        {ATOLL_THAANA[code]?.dv ?? code} {ATOLL_BY_CODE[code]?.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs text-mist">
                  <button
                    onClick={() => discover(-1)}
                    className="hover:text-foam flex items-center gap-1"
                  >
                    ← Northwards
                  </button>
                  <button
                    onClick={() => {
                      setDrifting(!drifting);
                      if (!drifting && !selected) discover(1);
                    }}
                    className="font-medium text-sand hover:underline"
                  >
                    {drifting ? "Pause voyage" : "Start voyage ⛵"}
                  </button>
                  <button
                    onClick={() => discover(1)}
                    className="hover:text-foam flex items-center gap-1"
                  >
                    Southwards →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regional Explorer with Thaana Badges */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-sand">
                Archipelago Directory
              </h2>
              <span className="text-[11px] text-mist">
                {category ? CATEGORY_BY_ID[category].label : "all feelings"}
              </span>
            </div>
            <label className="sr-only" htmlFor="region-search">
              Find an atoll
            </label>
            <input
              id="region-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by English or Thaana name (e.g. Baa, މާލެ)..."
              className="mb-3 min-h-10 w-full rounded-xl border border-white/15 bg-abyss/50 px-3 text-sm text-foam placeholder:text-mist/70 focus:border-sand focus:outline-none"
            />
            <ol className="max-h-72 space-y-1 overflow-y-auto overscroll-contain pr-1">
              {ranked
                .filter((a) => {
                  const thaana = ATOLL_THAANA[a.code];
                  return [a.name, a.code, thaana?.dv ?? "", thaana?.atollName ?? "", ...a.aka].some(
                    (v) => norm(v).includes(norm(search))
                  );
                })
                .map((a, i) => {
                  const thaana = ATOLL_THAANA[a.code];
                  const isSel = selected === a.code;
                  return (
                    <li key={a.code}>
                      <button
                        aria-pressed={isSel}
                        onMouseEnter={() => setHovered(a.code)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelected((s) => (s === a.code ? null : a.code))}
                        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                          hovered === a.code || isSel
                            ? "bg-sand/15 text-sand border border-sand/30"
                            : "text-mist hover:bg-white/5 hover:text-foam"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 font-serif text-sand/80 text-[11px]">
                            {thaana?.dv ?? a.code}
                          </span>
                          <span className="truncate font-medium text-foam/90">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <MoodBar
                              parts={category ? [{ id: category, n: a.n }] : breakdown(a.code)}
                              scale={a.n / max}
                            />
                          </div>
                          <span className="w-6 text-right tabular-nums text-mist">
                            {a.n}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
