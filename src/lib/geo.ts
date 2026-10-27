// Turns an arbitrary atoll GeoJSON feature into one of our atoll codes.
// Different datasets name their properties differently; we try the common
// keys and match against either the code or the name. If your dataset uses
// other property names, add them to KEYS below.
import { ATOLLS } from "./constants";

const KEYS = ["code", "atoll", "atoll_code", "Atoll", "ATOLL", "name", "NAME", "name_en", "atollName"];
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");

const LOOKUP = new Map<string, string>();
for (const a of ATOLLS) {
  LOOKUP.set(norm(a.code), a.code);
  LOOKUP.set(norm(a.name), a.code);
}
// Common alternate spellings / admin names seen in open datasets.
const ALIASES: Record<string, string> = {
  hanimaadhoo: "HDh", male: "MLE", malecity: "MLE", maale: "MLE",
  seenu: "S", addu: "S", southmaalhosmadulu: "B", northmaalhosmadulu: "R",
};
for (const [k, v] of Object.entries(ALIASES)) LOOKUP.set(k, v);

export function resolveAtollCode(props: Record<string, unknown> | null | undefined): string | null {
  if (!props) return null;
  for (const k of KEYS) {
    const hit = LOOKUP.get(norm(props[k]));
    if (hit) return hit;
  }
  return null;
}
