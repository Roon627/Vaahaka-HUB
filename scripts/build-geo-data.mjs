// Builds the two real-data files the app uses, from open datasets (both MIT):
//   public/data/maldives-atolls.geojson  <- jawish/maldives-geo (administrative_atolls.geojson)
//   public/data/maldives-islands.json    <- naxeem/maldives-atoll-islands (atoll-islands.json)
// Run:  npm run geo:build
// The processed files are committed, so this only needs re-running to refresh them.
import { mkdirSync, writeFileSync } from "node:fs";

const ATOLLS_URL = "https://raw.githubusercontent.com/jawish/maldives-geo/master/administrative_atolls.geojson";
const ISLANDS_URL = "https://raw.githubusercontent.com/naxeem/maldives-atoll-islands/master/atoll-islands.json";
const out = (f) => new URL(`../public/data/${f}`, import.meta.url);
mkdirSync(new URL("../public/data/", import.meta.url), { recursive: true });

// Official dataset name -> our atoll code (see src/lib/constants.ts)
const CODE_BY_NAME = {
  "haa alifu": "HA", "haa dhaalu": "HDh", shaviyani: "Sh", noonu: "N", raa: "R", baa: "B",
  lhaviyani: "Lh", kaafu: "K", "alifu alifu": "AA", "alifu dhaalu": "ADh", vaavu: "V",
  meemu: "M", faafu: "F", dhaalu: "Dh", thaa: "Th", laamu: "L", "gaafu alifu": "GA",
  "gaafu dhaalu": "GDh", gnaviyani: "Gn", seenu: "S",
};

// d3-geo (used by react-simple-maps) wants CLOCKWISE exterior rings and
// counter-clockwise holes — the opposite of RFC 7946 — so normalise them.
const area = (ring) => ring.reduce((s, [x1, y1], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return s + (x1 * y2 - x2 * y1); }, 0) / 2;
function windPolygon(rings) {
  return rings.map((ring, i) => {
    const ccw = area(ring) > 0; // y-up: positive area = counter-clockwise
    const wantCw = i === 0;
    return ccw === wantCw ? [...ring].reverse() : ring;
  });
}

// ---- atolls ---------------------------------------------------------------
const gj = await (await fetch(ATOLLS_URL)).json();
const features = gj.features.map((f) => {
  const code = CODE_BY_NAME[f.properties.name.trim().toLowerCase()];
  if (!code) throw new Error(`Unmapped atoll name: ${f.properties.name}`);
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return {
    type: "Feature",
    properties: { code, name: f.properties.name.trim() },
    geometry: { type: "MultiPolygon", coordinates: polys.map(windPolygon) },
  };
});
writeFileSync(out("maldives-atolls.geojson"), JSON.stringify({ type: "FeatureCollection", features }));
console.log(`atolls: ${features.length} features`);

// ---- islands --------------------------------------------------------------
const raw = await (await fetch(ISLANDS_URL)).json(); // { CODE: [{ name, atoll, id }] }
const clean = (s) => s.replace(/\s+/g, " ").trim();
const islands = {};
const add = (code, name) => {
  name = clean(name);
  if (!name) return;
  (islands[code] ??= []);
  if (!islands[code].includes(name)) islands[code].push(name);
};

for (const [code, list] of Object.entries(raw)) {
  for (const { name } of list) {
    // "Thundudhoshufushi Nolhoo/Thundudhoshufinolhu" -> two names
    for (const part of name.split("/")) {
      // "Velavaroo (Velavaru)" -> both spellings; drop prose notes like "(capital of ...)"
      const m = part.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
      if (m) {
        add(code, m[1]);
        if (m[2].length < 25 && !/capital|province/i.test(m[2])) add(code, m[2]);
      } else add(code, part);
    }
  }
}

// Greater Malé is its own region in the app ("MLE", Malé City). The dataset files
// Malé and Hulhulé under Kaafu and lacks Hulhumalé / Vilimalé, so fix that up here.
islands.K = (islands.K ?? []).filter((n) => !["Malé", "Hulhulé"].includes(n));
islands.MLE = ["Malé", "Hulhumalé", "Hulhulé", "Vilimalé"];

for (const k of Object.keys(islands)) islands[k].sort((a, b) => a.localeCompare(b, "en"));
writeFileSync(out("maldives-islands.json"), JSON.stringify(islands));
console.log(`islands: ${Object.values(islands).reduce((n, l) => n + l.length, 0)} across ${Object.keys(islands).length} regions`);
