"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { interpolateRgb } from "d3-interpolate";
import { useAtollCounts } from "@/hooks/useAtollCounts";
import { resolveAtollCode } from "@/lib/geo";
import {
  ATOLLS, ATOLL_BY_CODE, ATOLL_GEOJSON_URL, CATEGORY_BY_ID, DEFAULT_HEAT_COLOR, type CategoryId,
} from "@/lib/constants";
import CategoryFilter from "./CategoryFilter";

const QUIET = "#1a3247"; // fill for atolls with no stories (still visible against the abyss)

interface TooltipState { code: string; x: number; y: number }

/**
 * Interactive Maldives heatmap.
 *  - Polygons come from a GeoJSON file (jawish/maldives-geo or the placeholder);
 *    each feature is mapped to an atoll code by `resolveAtollCode`, so island-level
 *    datasets work too (all islands of an atoll light up together).
 *  - Fill intensity = sqrt(count / max), tinted by the selected category's colour.
 *  - Because atolls are thin slivers at country scale, each also gets a glowing
 *    bubble marker (sized by count) that shares the same hover/click behaviour.
 */
export default function AtollMap() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const { counts, loading } = useAtollCounts(category);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const heat = category ? CATEGORY_BY_ID[category].color : DEFAULT_HEAT_COLOR;
  const max = useMemo(() => Math.max(1, ...Object.values(counts)), [counts]);
  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  // 0 stories -> QUIET; otherwise ramp from a dim tint of the heat colour to full glow.
  const ramp = useMemo(() => interpolateRgb("#16384a", heat), [heat]);
  const fillFor = (code: string | null) => {
    const n = code ? counts[code] ?? 0 : 0;
    return n === 0 ? QUIET : ramp(0.2 + 0.8 * Math.sqrt(n / max));
  };

  const ranked = useMemo(
    () => ATOLLS.map((a) => ({ ...a, n: counts[a.code] ?? 0 })).sort((a, b) => b.n - a.n),
    [counts]
  );

  const goToFeed = (code: string) => {
    const q = new URLSearchParams({ atoll: code });
    if (category) q.set("cat", category);
    router.push(`/?${q.toString()}`);
  };

  // Position the tooltip relative to the map wrapper so it never leaves the card.
  const track = (code: string) => (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHovered(code);
    setTip({ code, x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const clear = () => { setTip(null); setHovered(null); };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24">
      <div className="py-8 text-center">
        <h1 className="font-display text-3xl text-foam sm:text-4xl">Where the stories <span style={{ color: heat }}>wash up</span></h1>
        <p className="mt-2 text-sm text-mist">
          {loading ? "Reading the tides…" : `${total.toLocaleString()} ${category ? CATEGORY_BY_ID[category].label.toLowerCase() : ""} stories across the atolls`}
        </p>
      </div>

      <CategoryFilter idPrefix="map" value={category} onChange={setCategory} allLabel="All moods" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ------------------------------------------------------------ map */}
        <div
          ref={wrapRef}
          className="relative mx-auto aspect-[1/1.6] w-full max-w-md overflow-hidden rounded-3xl border border-slate2 bg-gradient-to-b from-deep to-abyss"
          onMouseLeave={clear}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [73.2, 3.3], scale: 4200 }}
            width={400}
            height={640}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={ATOLL_GEOJSON_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const code = resolveAtollCode(geo.properties);
                  const isHover = code !== null && hovered === code;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseMove={code ? track(code) : undefined}
                      onMouseLeave={clear}
                      onClick={() => code && goToFeed(code)}
                      style={{
                        // isHover also fires when the matching bubble/list row is hovered
                        default: { fill: fillFor(code), stroke: isHover ? heat : "#3a5a78", strokeWidth: isHover ? 1.4 : 0.6, outline: "none", transition: "fill .5s" },
                        hover: { fill: fillFor(code), stroke: heat, strokeWidth: 1.4, outline: "none", cursor: code ? "pointer" : "default" },
                        pressed: { fill: fillFor(code), outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Bubbles make tiny atolls hoverable and show density at a glance. */}
            {ATOLLS.map((a) => {
              const n = counts[a.code] ?? 0;
              const r = n === 0 ? 3 : 5 + 13 * Math.sqrt(n / max);
              const active = hovered === a.code;
              return (
                <Marker
                  key={a.code}
                  coordinates={[a.lng, a.lat]}
                  onMouseMove={track(a.code)}
                  onMouseLeave={clear}
                  onClick={() => goToFeed(a.code)}
                >
                  <circle
                    r={active ? r + 3 : r}
                    fill={n === 0 ? "#2a4560" : heat}
                    fillOpacity={n === 0 ? 0.6 : 0.28}
                    stroke={n === 0 ? "none" : heat}
                    strokeWidth={active ? 2 : 1}
                    style={{ cursor: "pointer", transition: "r .2s", filter: n ? `drop-shadow(0 0 6px ${heat})` : undefined }}
                  />
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Tooltip */}
          <AnimatePresence>
            {tip && (
              <motion.div
                key="tip"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-slate2 bg-deep/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
                style={{ left: Math.min(Math.max(tip.x, 70), (wrapRef.current?.clientWidth ?? 400) - 70), top: tip.y - 12 }}
              >
                <div className="font-medium text-foam">{ATOLL_BY_CODE[tip.code]?.name}</div>
                <div style={{ color: heat }}>
                  {(counts[tip.code] ?? 0).toLocaleString()} {category ? CATEGORY_BY_ID[category].label.toLowerCase() : ""} {(counts[tip.code] ?? 0) === 1 ? "story" : "stories"}
                </div>
                <div className="mt-0.5 text-[10px] text-mist">click to read</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-[10px] text-mist">
            <span>quiet</span>
            <span className="h-1.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${QUIET}, ${ramp(0.2)}, ${ramp(1)})` }} />
            <span>{max.toLocaleString()}</span>
          </div>
        </div>

        {/* ------------------------------------------------------- ranking */}
        <aside className="rounded-3xl border border-slate2 bg-deep/60 p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-mist">Busiest shores</h2>
          <ol className="space-y-1">
            {ranked.map((a) => (
              <li key={a.code}>
                <button
                  onMouseEnter={() => setHovered(a.code)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => goToFeed(a.code)}
                  className={`relative flex w-full items-center justify-between overflow-hidden rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${hovered === a.code ? "bg-tide text-foam" : "text-mist"}`}
                >
                  {/* proportional bar behind the row */}
                  <motion.span
                    aria-hidden className="absolute inset-y-0 left-0 opacity-20"
                    style={{ background: heat }}
                    animate={{ width: `${(a.n / max) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                  <span className="relative">{a.name}</span>
                  <span className="relative tabular-nums">{a.n}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
