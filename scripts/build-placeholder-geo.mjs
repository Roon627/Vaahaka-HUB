// Generates a SCHEMATIC placeholder GeoJSON (one blob per administrative atoll)
// so the app runs before you drop in real boundaries. Replace
// public/data/maldives-atolls.geojson with the jawish/maldives-geo data.
import { writeFileSync } from "node:fs";

// [code, name, lat, lng, half-height (deg)]
const A = [
  ["HA", "Haa Alif", 6.95, 73.2, 0.45], ["HDh", "Haa Dhaalu", 6.55, 73.05, 0.4],
  ["Sh", "Shaviyani", 6.2, 73.2, 0.3], ["N", "Noonu", 5.8, 73.4, 0.35],
  ["R", "Raa", 5.5, 72.95, 0.35], ["B", "Baa", 5.1, 72.95, 0.3],
  ["Lh", "Lhaviyani", 5.4, 73.55, 0.25], ["K", "Kaafu", 4.3, 73.5, 0.55],
  ["AA", "Alif Alif", 4.05, 72.85, 0.25], ["ADh", "Alif Dhaal", 3.65, 72.85, 0.3],
  ["V", "Vaavu", 3.5, 73.5, 0.3], ["M", "Meemu", 3.0, 73.55, 0.2],
  ["F", "Faafu", 3.2, 72.95, 0.15], ["Dh", "Dhaalu", 2.85, 72.95, 0.25],
  ["Th", "Thaa", 2.2, 73.1, 0.4], ["L", "Laamu", 1.95, 73.4, 0.3],
  ["GA", "Gaafu Alif", 0.65, 73.3, 0.3], ["GDh", "Gaafu Dhaalu", 0.3, 73.25, 0.4],
  ["Gn", "Gnaviyani", -0.3, 73.43, 0.08], ["S", "Addu", -0.65, 73.15, 0.1],
];

// Deterministic wobbly ellipse so blobs don't look like perfect ovals.
function blob(lat, lng, hh, seed) {
  const hw = Math.max(0.1, hh * 0.45);
  const ring = [];
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const j = 1 + 0.12 * Math.sin(t * 3 + seed);
    ring.push([+(lng + Math.cos(t) * hw * j).toFixed(4), +(lat + Math.sin(t) * hh * j).toFixed(4)]);
  }
  ring.push(ring[0]);
  // d3-geo (used by react-simple-maps) wants CLOCKWISE exterior rings, i.e. the
  // opposite of RFC 7946. Real datasets may need the same fix (see README).
  return [ring.reverse()];
}

const features = A.map(([code, name, lat, lng, hh], i) => ({
  type: "Feature",
  properties: { code, name, placeholder: true },
  geometry: { type: "Polygon", coordinates: blob(lat, lng, hh, i) },
}));
// Malé city gets its own small region (administratively separate from Kaafu).
features.push({
  type: "Feature",
  properties: { code: "MLE", name: "Malé City", placeholder: true },
  geometry: { type: "Polygon", coordinates: blob(4.175, 73.51, 0.07, 99) },
});

writeFileSync(
  new URL("../public/data/maldives-atolls.geojson", import.meta.url),
  JSON.stringify({ type: "FeatureCollection", features })
);
console.log(`Wrote ${features.length} placeholder features`);
