"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { norm, score, splitMatch } from "@/lib/search";

export interface Opt {
  key: string;
  label: string;
  /** Small secondary text on the right (e.g. an alternative name). */
  hint?: string;
  /** Pill shown before the hint (e.g. the atoll code). */
  badge?: string;
  /** Extra strings to match against besides the label. */
  also?: string[];
}

interface Props {
  label: React.ReactNode;
  placeholder: string;
  options: Opt[];
  /** Text shown in the box (the committed value). */
  value: string;
  /** Called when an option is picked, or null when the box is cleared. */
  onSelect: (opt: Opt | null) => void;
  /** If set, free text is allowed: called on every keystroke (e.g. an island that isn't in the list). */
  onText?: (text: string) => void;
  emptyHint?: string;
  maxResults?: number;
  invalid?: boolean;
  /** "paper" (default) for parchment, "sea" for dark sheets. */
  tone?: "paper" | "sea";
}

/**
 * Searchable select, built to the ARIA combobox pattern:
 * type to filter (accent-insensitive, matches aliases too), ↑/↓ to move,
 * Enter to pick, Esc to close. With `onText` it also accepts free text.
 */
const TONES = {
  paper: { label: "text-ink", input: "border-ink/30 text-ink placeholder:text-inksoft/60 focus:border-ink", icon: "text-inksoft hover:bg-ink/10 hover:text-ink", pop: "border-ink/15 bg-[#fbf3de] shadow-[0_18px_40px_-12px_rgba(60,40,10,0.45)]", row: "text-ink", active: "bg-ink/10", meta: "text-inksoft", badge: "bg-ink/10 text-ink/80", mark: "bg-lantern/60 text-ink", foot: "border-ink/10 text-ink" },
  sea: { label: "text-sand", input: "border-white/25 text-foam placeholder:text-mist/60 focus:border-glow/70", icon: "text-mist hover:bg-white/10 hover:text-foam", pop: "border-white/10 bg-[#0d2230] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]", row: "text-foam", active: "bg-white/10", meta: "text-mist", badge: "bg-white/10 text-foam/80", mark: "bg-glow/30 text-foam", foot: "border-white/10 text-foam" },
} as const;

export default function Combobox({ label, placeholder, options, value, onSelect, onText, emptyHint, maxResults = 40, invalid, tone = "paper" }: Props) {
  const T = TONES[tone];
  const uid = useId().replace(/:/g, "");
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // True once the user has typed since opening; until then show the whole list, like a <select>.
  const [dirty, setDirty] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const free = !!onText;

  // Reflect committed value changes made elsewhere (e.g. picking an island fills the atoll).
  useEffect(() => { setText(value); }, [value]);

  const indexed = useMemo(() => options.map((o) => ({ o, hay: [o.label, ...(o.also ?? [])].map(norm) })), [options]);
  const q = norm(text);
  const browsing = !q || !dirty;
  const results = useMemo(() => {
    if (browsing) return indexed.slice(0, maxResults).map((x) => x.o);
    return indexed
      .map((x) => ({ o: x.o, s: Math.max(...x.hay.map((h) => score(h, q))) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.o.label.localeCompare(b.o.label))
      .slice(0, maxResults)
      .map((x) => x.o);
  }, [indexed, q, browsing, maxResults]);

  const showCustom = free && !browsing && !results.some((r) => norm(r.label) === q);
  const rows = results.length + (showCustom ? 1 : 0);

  useEffect(() => { setActive(0); }, [q, open]);
  useEffect(() => { listRef.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [active]);

  function pick(i: number) {
    if (i < results.length) { onSelect(results[i]); setText(results[i].label); }
    else if (showCustom) { onText?.(text.trim()); }
    setDirty(false);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, rows - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && rows) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); }
  }

  function onBlur() {
    setOpen(false);
    setDirty(false);
    // Typed text exactly matches an option -> commit it. Otherwise restore (strict) or keep (free).
    const exact = options.find((o) => norm(o.label) === q);
    if (exact && exact.label !== value) onSelect(exact);
    else if (!free) setText(value);
  }

  return (
    <div className="relative">
      <label htmlFor={uid} className={`block font-hand text-2xl ${T.label}`}>{label}</label>
      <div className="relative">
        <input
          id={uid}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && rows ? `${uid}-o${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onFocus={(e) => { const el = e.currentTarget; setOpen(true); setDirty(false); el.select(); setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300); }}
          onBlur={onBlur}
          onKeyDown={onKey}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
            setOpen(true);
            if (free) onText?.(e.target.value);
            else if (!e.target.value) onSelect(null);
          }}
          className={`w-full border-b bg-transparent py-2.5 pl-1 pr-10 font-sans text-base transition focus:outline-none ${invalid ? "border-wax" : T.input}`}
        />
        {text ? (
          <button type="button" aria-label="Clear" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setText(""); setDirty(false); onSelect(null); onText?.(""); setOpen(true); }}
            className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-2 transition ${T.icon}`}>✕</button>
        ) : (
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${T.meta}`}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        )}
      </div>

      {open && (
        <ul
          ref={listRef} id={`${uid}-list`} role="listbox"
          className={`absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border py-1 ${T.pop}`}
          // keep focus in the input while clicking options
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((o, i) => {
            const m = splitMatch(o.label, text);
            return (
              <li
                key={o.key} id={`${uid}-o${i}`} role="option" aria-selected={i === active}
                onMouseEnter={() => setActive(i)} onClick={() => pick(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[15px] ${i === active ? T.active : ""}`}
              >
                <span className={`min-w-0 truncate ${T.row}`}>
                  {m && !browsing ? <>{m[0]}<mark className={`rounded-sm px-0 ${T.mark}`}>{m[1]}</mark>{m[2]}</> : o.label}
                </span>
                <span className={`flex shrink-0 items-center gap-2 text-xs ${T.meta}`}>
                  {o.hint && <span className="hidden sm:inline">{o.hint}</span>}
                  {o.badge && <span className={`rounded-full px-2 py-0.5 font-medium ${T.badge}`}>{o.badge}</span>}
                </span>
              </li>
            );
          })}
          {showCustom && (
            <li id={`${uid}-o${results.length}`} role="option" aria-selected={active === results.length}
              onMouseEnter={() => setActive(results.length)} onClick={() => pick(results.length)}
              className={`cursor-pointer border-t px-3 py-2 text-sm ${T.foot} ${active === results.length ? T.active : ""}`}>
              Use “{text.trim()}”
            </li>
          )}
          {rows === 0 && <li className={`px-3 py-3 text-sm ${T.meta}`}>No match. {emptyHint}</li>}
        </ul>
      )}
    </div>
  );
}
