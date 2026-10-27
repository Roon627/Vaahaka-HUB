"use client";
import "leaflet/dist/leaflet.css";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ATOLLS } from "@/lib/constants";
import { resolveAtollCode, type AtollCollection } from "@/lib/geo";

export interface MapHandle { zoomIn: () => void; zoomOut: () => void; reset: () => void }
export type BaseLayer = "map" | "dark";

interface Props {
  fc: AtollCollection | null;
  counts: Record<string, number>;
  max: number;
  heat: string;
  /** colour of an atoll's polygon (the choropleth) */
  fillFor: (code: string) => string;
  /** [lng, lat] of each region's marker */
  where: Record<string, [number, number]>;
  selected: string | null;
  hovered: string | null;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
  /** false = a swipe over the map scrolls the page instead of panning it (phones) */
  interactive: boolean;
  base: BaseLayer;
  labelled: (code: string) => boolean;
  tip: (code: string) => string;
  names: Record<string, string>;
}

// The archipelago, pole to pole: Haa Alifu in the north to Addu in the south.
const HOME = L.latLngBounds([-1.1, 72.5], [7.5, 74.0]);

// Two free basemaps. OpenStreetMap is the default: the real map, used as it is (islands, labels, reefs). CARTO dark is the night option.
const TILES = {
  map: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
} as const;

/** Exposes zoom / reset to the parent, keeps drag + pinch in step with `interactive`, and flies to the selected atoll. */
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

const toLatLng = (ring: number[][]): L.LatLngTuple[] => ring.map(([lng, lat]) => [lat, lng]);

/**
 * The map: the real OpenStreetMap (or a dark version of it), untouched, with one marker per region sized and coloured by how
 * many stories it holds. Hover / tap to inspect. All state lives in AtollMap; this only draws and reports events.
 */
const LeafletMap = forwardRef<MapHandle, Props>(function LeafletMap(p, ref) {
  const [selBounds, setSelBounds] = useState<L.LatLngBounds | null>(null);

  const polys = useMemo(() => (p.fc?.features ?? []).map((f) => ({
    code: resolveAtollCode(f.properties) ?? f.properties.code,
    positions: f.geometry.coordinates.map((poly) => poly.map(toLatLng)),
  })), [p.fc]);

  // Fly to the chosen atoll (once per selection)
  useEffect(() => {
    const hit = polys.find((x) => x.code === p.selected);
    setSelBounds(hit ? L.latLngBounds(hit.positions.flat(2) as L.LatLngTuple[]) : null);
  }, [p.selected, polys]);

  const tile = TILES[p.base];
  return (
    <MapContainer
      bounds={HOME} boundsOptions={{ padding: [10, 10] }} zoomSnap={0.25} zoomDelta={0.75} minZoom={5} maxZoom={tile.maxZoom}
      maxBounds={[[-5, 69], [11, 78]]} maxBoundsViscosity={0.9}
      scrollWheelZoom={false} zoomControl={false} attributionControl
      className={`h-full w-full ${p.base === "dark" ? "map-dark" : "map-light"}`} style={{ background: p.base === "dark" ? "#0a1c26" : "#d4dadc" }}
    >
      <TileLayer key={p.base} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} detectRetina />
      <Controller handle={ref} interactive={p.interactive} bounds={selBounds} />

      {ATOLLS.map((a) => {
        const n = p.counts[a.code] ?? 0, pos = p.where[a.code], on = a.code === p.selected || a.code === p.hovered;
        if (!pos) return null;
        const r = n === 0 ? 6 : 8 + 10 * Math.sqrt(n / Math.max(p.max, 1));
        return (
          <CircleMarker
            key={a.code} center={[pos[1], pos[0]]} radius={on ? r + 2 : r}
            pathOptions={{ color: on ? "#0a1c26" : "#ffffff", weight: on ? 3 : 2, fillColor: n ? p.fillFor(a.code) : "#7f98a0", fillOpacity: n ? 0.88 : 0.55 }}
            eventHandlers={{ click: () => p.onSelect(a.code), mouseover: () => p.onHover(a.code), mouseout: () => p.onHover(null) }}
          >
            <Tooltip direction="top" offset={[0, -r]} sticky={false} className="atoll-tip">{p.tip(a.code)}</Tooltip>
            {p.labelled(a.code) && <Tooltip permanent direction="right" offset={[r + 2, 0]} className={p.base === "dark" ? "atoll-label" : "atoll-label atoll-label-light"}>{p.names[a.code]}</Tooltip>}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
});

export default LeafletMap;
