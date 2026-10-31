// Single source of truth for categories, reactions and atolls.
// Keep in sync with the CHECK constraints / seed rows in supabase/schema.sql.

export type CategoryId =
  | "horror" | "sad" | "vent" | "secrets" | "nostalgia" | "work" | "relationships";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  /** Accent used for chips, card glow and the map heat ramp. */
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "horror", label: "Horror", emoji: "👻", color: "#e88b8b" },
  { id: "sad", label: "Sad", emoji: "🌧️", color: "#8fb6e8" },
  { id: "vent", label: "Vent", emoji: "🔥", color: "#f0a870" },
  { id: "secrets", label: "Secrets", emoji: "🤫", color: "#b9a2e8" },
  { id: "nostalgia", label: "Nostalgia", emoji: "🐚", color: "#f1d58a" },
  { id: "work", label: "Work", emoji: "💼", color: "#86cfd8" },
  { id: "relationships", label: "Relationships", emoji: "💔", color: "#eba0c4" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

/** Heatmap colour when no category is selected. */
export const DEFAULT_HEAT_COLOR = "#9fe3d0";

// Supportive reactions only — deliberately no downvote and no comments.
export type ReactionKind = "felt" | "heart" | "listening";

export const REACTIONS: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: "felt", emoji: "🫂", label: "Felt" },
  { kind: "heart", emoji: "❤️", label: "Heart" },
  { kind: "listening", emoji: "🕯️", label: "Listening" },
];

export interface Atoll {
  code: string;
  /** Official administrative name (matches the GeoJSON). */
  name: string;
  /** Other names people know it by — searchable in the pickers. */
  aka: string[];
  /** Fallback marker position; the map prefers the polygon centroid. */
  lat: number;
  lng: number;
}

export const ATOLLS: Atoll[] = [
  { code: "HA", name: "Haa Alifu", aka: ["Haa Alif", "Ihavandhippolhu", "Thiladhunmathi"], lat: 6.95, lng: 73.2 },
  { code: "HDh", name: "Haa Dhaalu", aka: ["Haa Dhaal", "Thiladhunmathi Dhekunu", "South Thiladhunmathi"], lat: 6.55, lng: 73.05 },
  { code: "Sh", name: "Shaviyani", aka: ["Miladhunmadulu Uthuru", "North Miladhunmadulu"], lat: 6.2, lng: 73.2 },
  { code: "N", name: "Noonu", aka: ["Miladhunmadulu Dhekunu", "South Miladhunmadulu"], lat: 5.8, lng: 73.4 },
  { code: "R", name: "Raa", aka: ["Maalhosmadulu Uthuru", "North Maalhosmadulu"], lat: 5.5, lng: 72.95 },
  { code: "B", name: "Baa", aka: ["Maalhosmadulu Dhekunu", "South Maalhosmadulu"], lat: 5.1, lng: 72.95 },
  { code: "Lh", name: "Lhaviyani", aka: ["Faadhippolhu"], lat: 5.4, lng: 73.55 },
  { code: "K", name: "Kaafu", aka: ["Kaaf", "North Malé Atoll", "South Malé Atoll", "Malé Atoll"], lat: 4.3, lng: 73.5 },
  { code: "MLE", name: "Malé City", aka: ["Malé", "Greater Malé", "Hulhumalé"], lat: 4.175, lng: 73.51 },
  { code: "AA", name: "Alifu Alifu", aka: ["Alif Alif", "North Ari Atoll", "Ari"], lat: 4.05, lng: 72.85 },
  { code: "ADh", name: "Alifu Dhaalu", aka: ["Alif Dhaal", "South Ari Atoll", "Ari"], lat: 3.65, lng: 72.85 },
  { code: "V", name: "Vaavu", aka: ["Felidhu", "Felidhe"], lat: 3.5, lng: 73.5 },
  { code: "M", name: "Meemu", aka: ["Mulaku"], lat: 3.0, lng: 73.55 },
  { code: "F", name: "Faafu", aka: ["North Nilandhe"], lat: 3.2, lng: 72.95 },
  { code: "Dh", name: "Dhaalu", aka: ["South Nilandhe"], lat: 2.85, lng: 72.95 },
  { code: "Th", name: "Thaa", aka: ["Kolhumadulu"], lat: 2.2, lng: 73.1 },
  { code: "L", name: "Laamu", aka: ["Hadhdhunmathi"], lat: 1.95, lng: 73.4 },
  { code: "GA", name: "Gaafu Alifu", aka: ["Gaafu Alif", "North Huvadhu"], lat: 0.65, lng: 73.3 },
  { code: "GDh", name: "Gaafu Dhaalu", aka: ["Gaafu Dhaal", "South Huvadhu"], lat: 0.3, lng: 73.25 },
  { code: "Gn", name: "Gnaviyani", aka: ["Fuvahmulah", "Fuvahmulaku"], lat: -0.3, lng: 73.43 },
  { code: "S", name: "Seenu", aka: ["Addu", "Addu City", "Addu Atoll"], lat: -0.65, lng: 73.15 },
];

export const ATOLL_BY_CODE = Object.fromEntries(ATOLLS.map((a) => [a.code, a])) as Record<string, Atoll>;

/** Authentic administrative Thaana codes and traditional names for each atoll */
export const ATOLL_THAANA: Record<string, { dv: string; atollName: string }> = {
  HA: { dv: "ހއ.", atollName: "ތިލަދުންމަތީ އުތުރުބުރި" },
  HDh: { dv: "ހދ.", atollName: "ތިލަދުންމަތީ ދެކުނުބުރި" },
  Sh: { dv: "ށ.", atollName: "މިލަދުންމަޑުލު އުތުރުބުރި" },
  N: { dv: "ނ.", atollName: "މިލަދުންމަޑުލު ދެކުނުބުރި" },
  R: { dv: "ރ.", atollName: "މާޅޮސްމަޑުލު އުތުރުބުރި" },
  B: { dv: "ބ.", atollName: "މާޅޮސްމަޑުލު ދެކުނުބުރި" },
  Lh: { dv: "ޅ.", atollName: "ފާދިއްޕޮޅު" },
  K: { dv: "ކ.", atollName: "މާލެ އަތޮޅު" },
  MLE: { dv: "މާލެ", atollName: "މާލެ ސިޓީ" },
  AA: { dv: "އއ.", atollName: "އަރިއަތޮޅު އުތުރުބުރި" },
  ADh: { dv: "އދ.", atollName: "އަރިއަތޮޅު ދެކުނުބުރި" },
  V: { dv: "ވ.", atollName: "ފެލިދެ އަތޮޅު" },
  M: { dv: "މ.", atollName: "މުލަކު އަތޮޅު" },
  F: { dv: "ފ.", atollName: "ނިލަންދެއަތޮޅު އުތުރުބުރި" },
  Dh: { dv: "ދ.", atollName: "ނިލަންދެއަތޮޅު ދެކުނުބުރި" },
  Th: { dv: "ތ.", atollName: "ކޮޅުމަޑުލު" },
  L: { dv: "ލ.", atollName: "ހައްދުންމަތި" },
  GA: { dv: "ގއ.", atollName: "ހުވަދުއަތޮޅު އުތުރުބުރި" },
  GDh: { dv: "ގދ.", atollName: "ހުވަދުއަތޮޅު ދެކުނުބުރި" },
  Gn: { dv: "ޏ.", atollName: "ފުވައްމުލައް" },
  S: { dv: "ސ.", atollName: "އައްޑޫ ސިޓީ" },
};

export const ATOLL_GEOJSON_URL =
  process.env.NEXT_PUBLIC_ATOLL_GEOJSON_URL || "/data/maldives-atolls.geojson";

export const BODY_MIN = 10;
export const BODY_MAX = 5000;
export const PAGE_SIZE = 60; // divides evenly into 2, 3, 4, 5 and 6 columns, so the last row is never ragged
