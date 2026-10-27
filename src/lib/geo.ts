// Helpers for the atoll GeoJSON (public/data/maldives-atolls.geojson, built by scripts/build-geo-data.mjs).
import { ATOLLS } from "./constants";
import { norm } from "./search";

export interface AtollFeature {
  type: "Feature";
  properties: { code: string; name: string };
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}
export interface AtollCollection { type: "FeatureCollection"; features: AtollFeature[] }

const LOOKUP = new Map<string, string>();
for (const a of ATOLLS) for (const n of [a.code, a.name, ...a.aka]) LOOKUP.set(norm(n), a.code);

/**
 * Maps a GeoJSON feature to one of our atoll codes. Our own file carries `code`;
 * any other dataset is matched by name against the official names / aliases.
 */
export function resolveAtollCode(props: Record<string, unknown> | null | undefined): string | null {
  if (!props) return null;
  for (const k of ["code", "name", "NAME", "atoll", "Atoll"]) {
    const v = props[k];
    if (typeof v === "string" && LOOKUP.has(norm(v))) return LOOKUP.get(norm(v))!;
  }
  return null;
}

/** Area-weighted centroid of all exterior rings (plain lng/lat plane: plenty accurate at atoll scale). */
export function centroidOf(g: AtollFeature["geometry"]): [number, number] {
  let A = 0, X = 0, Y = 0;
  for (const poly of g.coordinates) {
    const ring = poly[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      const f = x1 * y2 - x2 * y1;
      a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
    }
    a /= 2;
    if (!a) continue;
    const w = Math.abs(a);
    X += (cx / (6 * a)) * w; Y += (cy / (6 * a)) * w; A += w;
  }
  return A ? [X / A, Y / A] : [73.4, 3.2];
}
