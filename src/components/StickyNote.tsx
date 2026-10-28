"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLL_BY_CODE } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { useSea } from "./SeaProvider";
import { looksLikeCrisis } from "./CrisisNudge";

/** A real sticky note gets replaced now and then: this one every 10 minutes, for everybody at the same time. */
const SLOT_MS = 10 * 60 * 1000;
const MAX_CHARS = 170;

interface Note { id: string; eyebrow: string; greeting?: string; lines: string[]; sign: string; post?: Post }

const WELCOME: Note = {
  id: "welcome",
  eyebrow: "A place for your words",
  greeting: "Dear sea,",
  lines: ["I don’t need all the answers.", "Just somewhere to begin."],
  sign: "With love, someone.",
};

/** Short, gentle, public letters only: no content-warning letters, nothing that reads like a crisis. */
function eligible(p: Post) {
  const t = p.body.trim();
  return !p.trigger_warning && t.length >= 20 && !looksLikeCrisis(t);
}

function clip(body: string) {
  const t = body.replace(/\s+/g, " ").trim();
  if (t.length <= MAX_CHARS) return t;
  const cut = t.slice(0, MAX_CHARS);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("۔ "));
  return (stop > 70 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "…").trim();
}

function fromPost(p: Post): Note {
  const a = ATOLL_BY_CODE[p.atoll_code];
  const where = [p.island, a?.name].filter(Boolean).join(", ");
  return { id: p.id, eyebrow: "Found in a bottle", lines: [clip(p.body)], sign: where ? `Someone from ${where}` : "Someone, somewhere", post: p };
}

/** Small seeded generator: the same slot gives the same note on every phone. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(slot: number, notes: Note[]): Note {
  const choose = (s: number) => {
    const r = rng(s * 2654435761);
    if (notes.length === 1 || r() < 0.25) return WELCOME;
    const real = notes.filter((n) => n.post);
    return real[Math.floor(r() * real.length)];
  };
  const cur = choose(slot);
  return cur.id === choose(slot - 1).id && notes.length > 2 ? choose(slot + 7919) : cur;
}

export default function StickyNote() {
  const { openPost, openWriter } = useSea();
  const calm = useReducedMotion();
  const [letters, setLetters] = useState<Note[]>([]);
  const [slot, setSlot] = useState<number | null>(null);
  const [left, setLeft] = useState(10);

  // a few recent letters to draw from
  useEffect(() => {
    let live = true;
    supabase.from("posts").select(POST_COLUMNS).order("created_at", { ascending: false }).limit(60).then(({ data }) => {
      if (!live || !data) return;
      setLetters((data as unknown as Post[]).filter(eligible).map(fromPost));
    });
    return () => { live = false; };
  }, []);

  // peel the note off when the ten minutes are up
  useEffect(() => {
    const tick = () => { const now = Date.now(); setSlot(Math.floor(now / SLOT_MS)); setLeft(Math.max(1, Math.ceil((SLOT_MS - (now % SLOT_MS)) / 60000))); };
    tick();
    const t = setInterval(tick, 15000);
    const vis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);

  const notes = useMemo(() => [WELCOME, ...letters], [letters]);
  const note = slot === null ? WELCOME : pick(slot, notes);
  // each new note sits at a slightly different angle, like it was pressed on by hand
  const tilt = slot === null ? -3 : [-4, -2.5, -1.5, 2, 3, -3.5][slot % 6];
  const long = note.lines.join(" ").length;
  const size = long < 70 ? "text-[1.7rem] md:text-3xl" : long < 130 ? "text-2xl md:text-[1.7rem]" : "text-xl md:text-2xl";

  return (
    <div className="relative mx-auto w-[min(88vw,22rem)] pt-3 md:absolute md:left-[2%] md:top-[50px] md:mx-0 md:w-[21.5rem]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={note.id}
          initial={calm ? { opacity: 0 } : { opacity: 0, y: -36, rotate: tilt - 9, scale: 1.04 }}
          animate={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
          exit={calm ? { opacity: 0 } : { opacity: 0, y: 70, rotate: tilt + 14, transition: { duration: 0.45, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 160, damping: 15 }}
          className="sticky-note"
        >
          <span className="sticky-tape" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a7a3a]">{note.eyebrow}</p>
          {note.greeting && <p className="mt-3 font-hand text-4xl leading-none">{note.greeting}</p>}
          <div dir="auto" className={`mt-3 font-hand leading-snug ${size} ${note.post ? "line-clamp-6 md:line-clamp-7" : ""}`}>
            {note.lines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <p className="mt-4 font-hand text-xl text-[#7a6a35]">{note.sign}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {note.post ? (
              <button onClick={() => openPost(note.post!)} className="sticky-btn">Read the whole letter →</button>
            ) : (
              <button onClick={() => openWriter()} className="sticky-btn">Write yours ↗</button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="mt-3 text-center text-[11px] tracking-wide text-mist md:text-left md:pl-3">
        A new note in about {left} {left === 1 ? "minute" : "minutes"}
      </p>
    </div>
  );
}
