import type { CategoryId, ReactionKind } from "./constants";

/** Public shape of a post row (matches the anon SELECT column grant). */
export interface Post {
  id: string;
  created_at: string;
  body: string;
  category: CategoryId;
  trigger_warning: string | null;
  atoll_code: string;
  island: string | null;
  felt_count: number;
  heart_count: number;
  listening_count: number;
}

export type ReactionCounts = Record<ReactionKind, number>;
