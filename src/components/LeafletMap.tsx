"use client";
import "leaflet/dist/leaflet.css";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
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

function Controller({ handle, interactive, bounds }: { handle: React.Ref<MapHandle>; interactive: boolean; bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useImperativeHandle(handle, () => ({
    zoomIn: () => map.zoomIn(0.75),
    zoomOut: () => map.zoomOut(0.75),
    reset: () => map.fitBounds(HOME, { padding: [10, 10], animate: true }),
  }), [map]);
  useEffect(() => {
    const m = map as L.Map;
    for (const h of [m.dragging, m.touchZoom, m.doubleClickZoom, m.boxZoom, m.keyboard]) interactive ? h.enable() : h.disable();
  }, [map, interactive]);
  useEffect(() => { if (bounds) map.flyToBounds(bounds, { maxZoom: 9, padding: [60, 60], duration: 0.8 }); }, [map, bounds]);
  useEffect(() => { map.fitBounds(HOME, { padding: [10, 10], animate: false }); }, [map]);
  return null;
}

/**
 * A region's marker as an SVG donut: the ring is split by mood (or one solid ring when a mood is chosen), the centre
 * shows the count, and the whole thing is sized by how many stories the region holds.
 */
function pinHtml(size: number, n: number, parts: { id: CategoryId; n: number }[], category: CategoryId | null, on: boolean) {
  const c = size / 2, w = Math.max(4, size * 0.2), r = c - w / 2 - 2, C = 2 * Math.PI * r;
  let ring = "";
  if (n === 0) ring = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#9db9b8" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 4"/>`;
  else if (category) ring = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${CATEGORY_BY_ID[category].color}" stroke-width="${w}"/>`;
  else {
    const live = parts.filter((x) => x.n > 0), total = live.reduce((a, x) => a + x.n, 0) || 1;
    const gap = live.length > 1 ? 1.6 : 0;
    let off = 0;
    for (const p of live) {
      const len = (p.n / total) * C, dash = Math.max(len - gap, 0.1);
      ring += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${CATEGORY_BY_ID[p.id].color}" stroke-width="${w}" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-off}" transform="rotate(-90 ${c} ${c})"/>`;
      off += len;
    }
  }
  const text = n > 0 ? `<text x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central" fill="#f5efe4" font-weight="700" font-size="${Math.max(10, size * 0.3)}" font-family="ui-sans-serif,system-ui,sans-serif">${n}</text>` : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;display:block">
    <circle cx="${c}" cy="${c}" r="${c - 1}" fill="rgba(8,26,38,.9)" stroke="${on ? "#f5efe4" : "rgba(255,255,255,.85)"}" stroke-width="${on ? 2.5 : 1.5}"/>${ring}${text}</svg>`;
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

/**
 * The map: the real OpenStreetMap, restyled by the real sun over Malé (dark teal chart after dark, natural colours by day),
 * with one donut per region (ring = mood mix, centre = count), ripples where letters landed in the last 24 hours,
 * and a splash when someone sends a bottle while you watch.
 */
const LeafletMap = forwardRef<MapHandle, Props>(function LeafletMap(p, ref) {
  const [selBounds, setSelBounds] = useState<L.LatLngBounds | null>(null);
  const [splash, setSplash] = useState<Props["arrival"]>(null);

  // Geometry is used only to know where to fly when a region is chosen; nothing is drawn from it.
  const geo = useMemo(() => (p.fc?.features ?? []).map((f) => ({
    code: resolveAtollCode(f.properties) ?? f.properties.code,
    bounds: L.latLngBounds(f.geometry.coordinates.flat(2).map(([lng, lat]) => [lat, lng] as L.LatLngTuple)),
  })), [p.fc]);
  useEffect(() => { setSelBounds(geo.find((x) => x.code === p.selected)?.bounds ?? null); }, [p.selected, geo]);

  // A new arrival: drop a bottle + splash into its region for a few seconds
  useEffect(() => {
    if (!p.arrival) return;
    setSplash(p.arrival);
    const t = setTimeout(() => setSplash(null), 4500);
    return () => clearTimeout(t);
  }, [p.arrival]);

  const night = p.daylight < 0.35;
  const sizeFor = (n: number) => (n === 0 ? 18 : 26 + 20 * Math.sqrt(n / Math.max(p.max, 1)));
  const at = (code: string): L.LatLngTuple => [p.where[code][1], p.where[code][0]];

  return (
    <div className={`h-full w-full ${night ? "map-night" : "map-day"}`}>
      <MapContainer
        bounds={HOME} boundsOptions={{ padding: [10, 10] }} zoomSnap={0.25} zoomDelta={0.75} minZoom={5} maxZoom={19}
        maxBounds={[[-5, 69], [11, 78]]} maxBoundsViscosity={0.9}
        scrollWheelZoom={false} zoomControl={false} attributionControl className="h-full w-full"
        style={{ background: night ? "#0a1c26" : "#d4dadc" }}
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} detectRetina />
        <Controller handle={ref} interactive={p.interactive} bounds={selBounds} />

        {/* ripples: letters that landed here in the last 24h */}
        {ATOLLS.filter((a) => (p.recent[a.code] ?? 0) > 0 && p.where[a.code]).map((a) => (
          <Marker key={`rip-${a.code}`} position={at(a.code)} interactive={false} keyboard={false}
            icon={ripples(sizeFor(p.counts[a.code] ?? 0) + 8, p.category ? CATEGORY_BY_ID[p.category].color : "#9fe3d0")} />
        ))}

        {/* the donuts */}
        {ATOLLS.map((a) => {
          if (!p.where[a.code]) return null;
          const n = p.counts[a.code] ?? 0, on = a.code === p.selected || a.code === p.hovered, size = sizeFor(n);
          const icon = L.divIcon({ className: `pin ${on ? "pin-on" : ""}`, iconSize: [size, size], iconAnchor: [size / 2, size / 2], html: pinHtml(size, n, p.breakdown(a.code), p.category, on) });
          return (
            <Marker key={a.code} position={at(a.code)} icon={icon} zIndexOffset={on ? 1000 : n}
              eventHandlers={{ click: () => p.onSelect(a.code), mouseover: () => p.onHover(a.code), mouseout: () => p.onHover(null) }}>
              <Tooltip direction="top" offset={[0, -size / 2]} className="atoll-tip">{p.tip(a.code)}</Tooltip>
              {n > 0 && (on || n >= p.max * 0.5) && <Tooltip permanent direction="bottom" offset={[0, size / 2]} className="atoll-label">{p.names[a.code]}</Tooltip>}
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
    </div>
  );
});

export default LeafletMap;
