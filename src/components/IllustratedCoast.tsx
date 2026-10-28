"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import { GeoJSON, useMap } from "react-leaflet";
import type { FeatureCollection } from "geojson";

/** Source-derived island polygons; the outer strokes are decorative surf, not bathymetry. */
export default function IllustratedCoast({ onFailure }: { onFailure: () => void }) {
  const map = useMap();
  const [land, setLand] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/maldives-coastlines.geojson", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Coastlines unavailable"); return r.json(); })
      .then(setLand).catch((e) => { if (e.name !== "AbortError") onFailure(); });
    return () => controller.abort();
  }, [onFailure]);
  useEffect(() => {
    const credit = '<a href="https://www.geoboundaries.org/">geoBoundaries</a> · 2021 · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
    map.attributionControl.addAttribution(credit);
    const scale = L.control.scale({ imperial: false, position: "bottomleft", maxWidth: 70 }).addTo(map);
    return () => { map.attributionControl.removeAttribution(credit); scale.remove(); };
  }, [map]);
  if (!land) return null;
  return <>
    <GeoJSON data={land} interactive={false} style={{ color: "#72dfd4", weight: 13, opacity: .23, fill: false }} />
    <GeoJSON data={land} interactive={false} style={{ color: "#b7efe1", weight: 7, opacity: .6, fill: false }} />
    <GeoJSON data={land} interactive={false} style={{ color: "#f4e5b6", weight: 2.5, opacity: 1, fillColor: "#78b77f", fillOpacity: 1, lineJoin: "round" }} />
  </>;
}
