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

/** crypto.randomUUID() is missing before iOS 15.4 and on plain-http pages; calling it there crashes the whole app (blank screen). */
export function uuid(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  let t = safeGet(TOKEN_KEY) ?? memoryToken;
  if (!t) {
    t = uuid() + uuid().slice(0, 8);
    memoryToken = t;
    safeSet(TOKEN_KEY, t);
  }
  return t;
}

/** Which reactions this browser has already given: { [postId]: ["felt", ...] } */
export function getMyReactions(): Record<string, ReactionKind[]> {
  try {
    const value = JSON.parse(safeGet(MINE_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, ReactionKind[]] => Array.isArray(entry[1]) && entry[1].every((k) => ["felt", "heart", "listening"].includes(k))));
  } catch { return {}; }
}

export function setMyReaction(postId: string, kind: ReactionKind, on: boolean) {
  const all = getMyReactions();
  const set = new Set(all[postId] ?? []);
  on ? set.add(kind) : set.delete(kind);
  all[postId] = [...set];
  safeSet(MINE_KEY, JSON.stringify(all));
}

// ---- bottles this browser has already opened (they show as "opened" in the sea) ----
const OPENED_KEY = "raalhu.opened";

export function getOpened(): string[] {
  try { const value = JSON.parse(safeGet(OPENED_KEY) ?? "[]"); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(-500) : []; } catch { return []; }
}

export function markOpened(postId: string) {
  const ids = getOpened().filter((x) => x !== postId);
  ids.push(postId);
  safeSet(OPENED_KEY, JSON.stringify(ids.slice(-500))); // cap so it never grows unbounded
}
