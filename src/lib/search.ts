// Accent- and punctuation-insensitive search, so "hulhumale" finds "Hulhumalé".

/** Lowercase, strip diacritics, collapse anything non-alphanumeric to single spaces. */
export const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const isSubsequence = (needle: string, hay: string) => {
  let i = 0;
  for (const c of hay) if (c === needle[i] && ++i === needle.length) return true;
  return needle.length === 0;
};

/** 0 = no match; higher = better. `hay` and `q` must already be norm()-ed. */
export function score(hay: string, q: string): number {
  if (!q) return 1;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  if (hay.split(" ").some((w) => w.startsWith(q))) return 60;
  if (hay.includes(q)) return 40;
  // Forgiving fallback for typos / skipped letters ("hulumale" -> "hulhumale"), 3+ chars only.
  const compact = q.replace(/ /g, "");
  return compact.length >= 3 && isSubsequence(compact, hay.replace(/ /g, "")) ? 10 : 0;
}

/** Splits `text` into [before, match, after] for highlighting, folding accents the same way as norm(). */
export function splitMatch(text: string, q: string): [string, string, string] | null {
  const needle = norm(q);
  if (!needle) return null;
  const folded = [...text].map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()).join("");
  const at = folded.indexOf(needle);
  if (at < 0) return null;
  const chars = [...text];
  return [chars.slice(0, at).join(""), chars.slice(at, at + needle.length).join(""), chars.slice(at + needle.length).join("")];
}
