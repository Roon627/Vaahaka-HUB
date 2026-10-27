// A random, locally-stored token. It is NOT an account: it only lets the DB
// dedupe reactions and rate-limit posting. Clearing site data resets it.
import type { ReactionKind } from "./constants";

const TOKEN_KEY = "raalhu.device";
const MINE_KEY = "raalhu.reactions";

function safeGet(k: string) {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* private mode: degrade silently */ }
}

let memoryToken: string | null = null;

export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  let t = safeGet(TOKEN_KEY) ?? memoryToken;
  if (!t) {
    t = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
    memoryToken = t;
    safeSet(TOKEN_KEY, t);
  }
  return t;
}

/** Which reactions this browser has already given: { [postId]: ["felt", ...] } */
export function getMyReactions(): Record<string, ReactionKind[]> {
  try { return JSON.parse(safeGet(MINE_KEY) ?? "{}"); } catch { return {}; }
}

export function setMyReaction(postId: string, kind: ReactionKind, on: boolean) {
  const all = getMyReactions();
  const set = new Set(all[postId] ?? []);
  on ? set.add(kind) : set.delete(kind);
  all[postId] = [...set];
  safeSet(MINE_KEY, JSON.stringify(all));
}
