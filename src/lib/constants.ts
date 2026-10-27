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
  { id: "horror", label: "Horror", emoji: "👻", color: "#ff6b6b" },
  { id: "sad", label: "Sad", emoji: "🌧️", color: "#6ea8ff" },
  { id: "vent", label: "Vent", emoji: "🔥", color: "#ff9f5a" },
  { id: "secrets", label: "Secrets", emoji: "🤫", color: "#b38cff" },
  { id: "nostalgia", label: "Nostalgia", emoji: "🐚", color: "#f3d36b" },
  { id: "work", label: "Work", emoji: "💼", color: "#7fd1ff" },
  { id: "relationships", label: "Relationships", emoji: "💔", color: "#ff7ab8" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

/** Heatmap colour when no category is selected. */
export const DEFAULT_HEAT_COLOR = "#2ee6c5";

// Supportive reactions only — deliberately no downvote and no comments.
export type ReactionKind = "felt" | "heart" | "listening";

export const REACTIONS: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: "felt", emoji: "🫂", label: "Felt" },
  { kind: "heart", emoji: "🫀", label: "Heart" },
  { kind: "listening", emoji: "🕯️", label: "Listening" },
];

export interface Atoll {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export const ATOLLS: Atoll[] = [
  { code: "HA", name: "Haa Alif", lat: 6.95, lng: 73.2 },
  { code: "HDh", name: "Haa Dhaalu", lat: 6.55, lng: 73.05 },
  { code: "Sh", name: "Shaviyani", lat: 6.2, lng: 73.2 },
  { code: "N", name: "Noonu", lat: 5.8, lng: 73.4 },
  { code: "R", name: "Raa", lat: 5.5, lng: 72.95 },
  { code: "B", name: "Baa", lat: 5.1, lng: 72.95 },
  { code: "Lh", name: "Lhaviyani", lat: 5.4, lng: 73.55 },
  { code: "K", name: "Kaafu", lat: 4.3, lng: 73.5 },
  { code: "MLE", name: "Malé City", lat: 4.175, lng: 73.51 },
  { code: "AA", name: "Alif Alif", lat: 4.05, lng: 72.85 },
  { code: "ADh", name: "Alif Dhaal", lat: 3.65, lng: 72.85 },
  { code: "V", name: "Vaavu", lat: 3.5, lng: 73.5 },
  { code: "M", name: "Meemu", lat: 3.0, lng: 73.55 },
  { code: "F", name: "Faafu", lat: 3.2, lng: 72.95 },
  { code: "Dh", name: "Dhaalu", lat: 2.85, lng: 72.95 },
  { code: "Th", name: "Thaa", lat: 2.2, lng: 73.1 },
  { code: "L", name: "Laamu", lat: 1.95, lng: 73.4 },
  { code: "GA", name: "Gaafu Alif", lat: 0.65, lng: 73.3 },
  { code: "GDh", name: "Gaafu Dhaalu", lat: 0.3, lng: 73.25 },
  { code: "Gn", name: "Gnaviyani", lat: -0.3, lng: 73.43 },
  { code: "S", name: "Addu", lat: -0.65, lng: 73.15 },
];

export const ATOLL_BY_CODE = Object.fromEntries(ATOLLS.map((a) => [a.code, a])) as Record<string, Atoll>;

export const ATOLL_GEOJSON_URL =
  process.env.NEXT_PUBLIC_ATOLL_GEOJSON_URL || "/data/maldives-atolls.geojson";

export const BODY_MIN = 10;
export const BODY_MAX = 5000;
export const PAGE_SIZE = 12;
