"use client";
import "leaflet/dist/leaflet.css";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import IllustratedCoast from "./IllustratedCoast";
import { ATOLLS, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import { resolveAtollCode, type AtollCollection } from "@/lib/geo";

export interface MapHandle { zoomIn: () => void; zoomOut: () => void; reset: () => void }

interface Props {
  fc: AtollCollection | null;
  /** stories per region for the current mood filter */
  counts: Record<string, number>;
  max: number;
  /** the selected mood (null = all): decides whether a marker is a mood donut or one solid ring */
  category: CategoryId | null;
  /** per-region mood split, for the donuts */
  breakdown: (code: string) => { id: CategoryId; n: number }[];
  /** letters sent in the last 24h per region: those regions send out ripples */
  recent: Record<string, number>;
  /** a bottle someone else just sent (splashes into its region) */
  arrival: { id: number; category: CategoryId; atoll: string } | null;
  /** 0 = night … 1 = day, from the real sun over Malé */
  daylight: number;
  /** [lng, lat] of each region's marker */
  where: Record<string, [number, number]>;
  selected: string | null;
  hovered: string | null;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
  /** false = a swipe over the map scrolls the page instead of panning it (phones) */
  interactive: boolean;
  names: Record<string, string>;
  tip: (code: string) => string;
}

// The archipelago, pole to pole: Haa Alifu in the north to Addu in the south.
const HOME = L.latLngBounds([-1.1, 72.5], [7.5, 74.0]);
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"; // free, no key
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function Controller({ handle, interactive, bounds, onZoom }: { handle: React.Ref<MapHandle>; interactive: boolean; bounds: L.LatLngBounds | null; onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  useImperativeHandle(handle, () => ({
    zoomIn: () => map.zoomIn(0.75),
    zoomOut: () => map.zoomOut(0.75),
    reset: () => map.fitBounds(HOME, { padding: [10, 10], animate: true }),
  }), [map]);
  useEffect(() => {
    const m = map as L.Map;
    for (const h of [m.dragging, m.touchZoom, m.doubleClickZoom, m.boxZoom, m.keyboard]) interactive ? h.enable() : h.disable();
  }, [map, interactive]);
  useEffect(() => { if (bounds) map.flyToBounds(bounds, { maxZoom: 9, padding: [60, 60], duration: 0.8, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches }); }, [map, bounds]);
  useEffect(() => { map.fitBounds(HOME, { padding: [10, 10], animate: false }); }, [map]);
  return null;
}

/** Illustrated bottle marker: colour = leading mood, paper label = story count. */
function pinHtml(size: number, n: number, parts: { id: CategoryId; n: number }[], category: CategoryId | null, on: boolean) {
  const dominant = [...parts].sort((a, b) => b.n - a.n)[0];
  const color = category ? CATEGORY_BY_ID[category].color : dominant?.n ? CATEGORY_BY_ID[dominant.id].color : "#b6d9c9";
  return `<svg width="${size}" height="${size + 12}" viewBox="0 0 44 56" style="overflow:visible;display:block">
    <ellipse cx="22" cy="48" rx="16" ry="4" fill="#164e63" opacity=".2"/>
    <path d="M17 10h10v11c0 5 10 7 10 16v7c0 5-5 8-15 8S7 49 7 44v-7c0-9 10-11 10-16z" fill="${color}" stroke="${on ? "#fff9dc" : "#25596a"}" stroke-width="${on ? 3 : 1.5}"/>
    <path d="M12 36v7" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
    <rect x="16" y="4" width="12" height="9" rx="2" fill="#c3955c" stroke="#805f3d" stroke-width="1"/>
    <rect x="16" y="26" width="15" height="20" rx="2" fill="#fff2cd" transform="rotate(8 23 36)"/>
    <text x="23" y="39" text-anchor="middle" fill="#315763" font-weight="700" font-size="12" font-family="ui-sans-serif,system-ui">${n}</text>
  </svg>`;
}

const ripples = (size: number, color: string, fast = false) => {
  const style = `--c:${color};${fast ? "animation-duration:1.4s" : ""}`;
  return L.divIcon({
    className: "ripple-wrap", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    html: `<span class="ripple" style="${style}"></span><span class="ripple r2" style="${style}"></span>${fast ? `<span class="ripple r3" style="${style}"></span>` : ""}`,
  });
};

const bottleDrop = (color: string) =>
  L.divIcon({
    className: "bottle-drop", iconSize: [34, 70], iconAnchor: [17, 58],
    html: `<svg width="34" height="70" viewBox="0 0 60 124" style="overflow:visible;filter:drop-shadow(0 0 10px ${color})"><path d="M24 20 H36 V34 C36 44 52 50 52 68 V104 C52 113 46 118 38 118 H22 C14 118 8 113 8 104 V68 C8 50 24 44 24 34 Z" fill="${color}" fill-opacity=".55" stroke="#fff" stroke-width="3"/><rect x="23.5" y="6" width="13" height="16" rx="3" fill="#c79b62"/><rect x="21" y="60" width="18" height="40" rx="3" fill="#f3e5c5" transform="rotate(-9 30 86)"/></svg>`,
  });

/** Georeferenced illustrated islands, with optional OpenStreetMap detail. */
const LeafletMap = forwardRef<MapHandle, Props>(function LeafletMap(p, ref) {
  const [zoom, setZoom] = useState(6);
  const [illustrated, setIllustrated] = useState(true);
  const coastFailed = useCallback(() => setIllustrated(false), []);
  const [selBounds, setSelBounds] = useState<L.LatLngBounds | null>(null);
  const [splash, setSplash] = useState<Props["arrival"]>(null);

  // Geometry is used only to know where to fly when a region is chosen; nothing is drawn from it.
  const geo = useMemo(() => (p.fc?.features ?? []).map((f) => ({
    code: resolveAtollCode(f.properties) ?? f.properties.code,
    bounds: L.latLngBounds(f.geometry.coordinates.flat(2).map(([lng, lat]) => [lat, lng] as L.LatLngTuple)),
  })), [p.fc]);
  useEffect(() => { const point = p.selected ? p.where[p.selected] : null;
    setSelBounds(geo.find((x) => x.code === p.selected)?.bounds ?? (point ? L.latLngBounds([point[1] - .06, point[0] - .06], [point[1] + .06, point[0] + .06]) : null)); }, [p.selected, geo, p.where]);

  // A new arrival: drop a bottle + splash into its region for a few seconds
  useEffect(() => {
    if (!p.arrival) return;
    setSplash(p.arrival);
    const t = setTimeout(() => setSplash(null), 4500);
    return () => clearTimeout(t);
  }, [p.arrival]);

  const night = p.daylight < 0.35;
  const sizeFor = (n: number) => (n === 0 ? 17 : 24 + 10 * Math.sqrt(n / Math.max(p.max, 1)));
  const at = (code: string): L.LatLngTuple => [p.where[code][1], p.where[code][0]];

  return (
    <div className={`relative h-full w-full ${illustrated ? "map-illustrated" : night ? "map-night" : "map-day"}`}>
      <MapContainer
        bounds={HOME} boundsOptions={{ padding: [10, 10] }} zoomSnap={0.25} zoomDelta={0.75} minZoom={5} maxZoom={illustrated ? 15 : 19}
        maxBounds={[[-5, 69], [11, 78]]} maxBoundsViscosity={0.9}
        scrollWheelZoom={false} zoomControl={false} attributionControl className="h-full w-full"
        style={{ background: illustrated ? "#3199ac" : night ? "#0a1c26" : "#d4dadc" }}
      >
        {illustrated ? <IllustratedCoast onFailure={coastFailed} /> : <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} detectRetina />}
        <Controller handle={ref} interactive={p.interactive} bounds={selBounds} onZoom={setZoom} />

        {/* ripples: letters that landed here in the last 24h */}
        {ATOLLS.filter((a) => (p.recent[a.code] ?? 0) > 0 && p.where[a.code]).map((a) => (
          <Marker key={`rip-${a.code}`} position={at(a.code)} interactive={false} keyboard={false}
            icon={ripples(sizeFor(p.counts[a.code] ?? 0) + 8, p.category ? CATEGORY_BY_ID[p.category].color : "#9fe3d0")} />
        ))}

        {/* the donuts */}
        {ATOLLS.map((a) => {
          if (!p.where[a.code]) return null;
          const n = p.counts[a.code] ?? 0, on = a.code === p.selected || a.code === p.hovered;
          if (!n && !on && zoom < 8) return null;
          const size = zoom < 7.5 && !on ? 18 : sizeFor(n);
          const icon = L.divIcon({ className: `pin ${on ? "pin-on" : ""}`, iconSize: [size, size + 12], iconAnchor: [size / 2, size / 2 + 6], html: pinHtml(size, n, p.breakdown(a.code), p.category, on) });
          return (
            <Marker key={a.code} title={p.tip(a.code)} alt={p.tip(a.code)} position={at(a.code)} icon={icon} zIndexOffset={on ? 1000 : n}
              eventHandlers={{ click: () => p.onSelect(a.code), mouseover: () => p.onHover(a.code), mouseout: () => p.onHover(null) }}>
              <Tooltip direction="top" offset={[0, -size / 2]} className="atoll-tip">{p.tip(a.code)}</Tooltip>
              {n > 0 && (on || (zoom >= 8 && n >= p.max * 0.5)) && <Tooltip permanent direction="bottom" offset={[0, size / 2]} className="atoll-label">{p.names[a.code]}</Tooltip>}
            </Marker>
          );
        })}

        {/* a live arrival: ripples + a bottle that drops in */}
        {splash && p.where[splash.atoll] && (
          <>
            <Marker position={at(splash.atoll)} interactive={false} keyboard={false} zIndexOffset={2000} icon={ripples(110, CATEGORY_BY_ID[splash.category].color, true)} />
            <Marker position={at(splash.atoll)} interactive={false} keyboard={false} zIndexOffset={2001} icon={bottleDrop(CATEGORY_BY_ID[splash.category].color)} />
          </>
        )}
      </MapContainer>
      <div className="absolute left-3 top-14 z-[1000] flex rounded-full border border-white/25 bg-abyss/85 p-1 text-[10px] text-foam shadow-soft" aria-label="Map style">
        <button aria-pressed={illustrated} onClick={() => setIllustrated(true)} className={`rounded-full px-3 py-2 ${illustrated ? "bg-glow/20 text-glow" : ""}`}>Illustrated</button>
        <button aria-pressed={!illustrated} onClick={() => setIllustrated(false)} className={`rounded-full px-3 py-2 ${!illustrated ? "bg-glow/20 text-glow" : ""}`}>Street</button>
      </div>
      {illustrated && <div aria-hidden className="pointer-events-none absolute bottom-24 left-4 z-[500] text-center text-[#e1f6e6] opacity-75"><span className="text-[9px] font-bold tracking-[.2em]">N</span><div className="text-3xl">✧</div></div>}
    </div>
  );
});

export default LeafletMap;
