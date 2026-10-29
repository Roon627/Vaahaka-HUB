"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLL_BY_CODE } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { useSea } from "./SeaProvider";
import { looksLikeCrisis } from "./CrisisNudge";

/** The notepad shows the most felt letters; swipe a page away to tear it off and read the next. */
const MAX_CHARS = 170;

interface Note { id: string; felt?: number; eyebrow: string; greeting?: string; lines: string[]; sign: string; post?: Post }

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
  return { id: p.id, felt: p.felt_count, eyebrow: "Found in a bottle", lines: [clip(p.body)], sign: where ? `Someone from ${where}` : "Someone, somewhere", post: p };
}

const TILTS = [-3, 2, -2, 3, -1.5, 2.5];

const page = {
  in: (calm: boolean) => (calm ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }),
  on: { opacity: 1, y: 0, scale: 1 },
  out: ({ d, calm }: { d: number; calm: boolean }) =>
    calm ? { opacity: 0 } : { x: d * 420, y: 60, rotate: d * 22, opacity: 0, transition: { duration: 0.42, ease: "easeIn" as const } },
};

/** One page of the pad. It owns its drag position, so the next page always starts centred. */
function Page({ note, can, calm, dir, onTear, onOpen }: { note: Note; can: boolean; calm: boolean; dir: 1 | -1; onTear: (d: 1 | -1) => void; onOpen: (p: Post) => void }) {
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const onEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) onTear(info.offset.x < 0 || info.velocity.x < -500 ? -1 : 1);
  };
  const long = note.lines.join(" ").length;
  const size = long < 130 ? "text-2xl md:text-[1.7rem]" : "text-xl md:text-2xl";
  return (
    <motion.div
      custom={{ d: dir, calm }}
      variants={page}
      initial="in" animate="on" exit="out"
      drag={can ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={onEnd}
      whileDrag={{ scale: 1.02 }}
      style={{ x, rotate: calm ? 0 : dragTilt }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className={`notepad relative ${can ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <p className="text-[10px] font-bold uppercase leading-8 tracking-[0.24em] text-inksoft">{note.eyebrow}</p>
      {note.greeting && <p className="font-hand text-3xl leading-8">{note.greeting}</p>}
      <div dir="auto" className={`font-hand leading-8 ${size} ${note.post ? "line-clamp-6 md:line-clamp-7" : ""}`}>
        {note.lines.map((l, k) => <p key={k}>{l}</p>)}
      </div>
      <p className="mt-2 font-hand text-xl leading-8 text-inksoft">{note.sign}</p>
      {note.post && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={() => onOpen(note.post!)} onPointerDownCapture={(e) => e.stopPropagation()} className="notepad-btn">Read the whole letter →</button>
          {!!note.felt && <span className="text-xs text-inksoft">{note.felt} felt this</span>}
        </div>
      )}
    </motion.div>
  );
}

export default function StickyNote() {
  const { openPost } = useSea();
  const calm = !!useReducedMotion();
  const [letters, setLetters] = useState<Note[]>([]);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  // the most felt letters first
  useEffect(() => {
    let live = true;
    supabase.from("posts").select(POST_COLUMNS).order("felt_count", { ascending: false }).order("created_at", { ascending: false }).limit(40).then(({ data }) => {
      if (!live || !data) return;
      setLetters((data as unknown as Post[]).filter(eligible).slice(0, 20).map(fromPost));
    });
    return () => { live = false; };
  }, []);

  const notes = useMemo(() => [WELCOME, ...letters], [letters]);
  const note = notes[i % notes.length];
  const tilt = TILTS[i % TILTS.length];
  const can = notes.length > 1;
  const tear = useCallback((d: 1 | -1) => { if (notes.length > 1) { setDir(d); setI((n) => n + 1); } }, [notes.length]);

  return (
    <div className="relative mx-auto w-[min(88vw,22rem)] pt-3 md:absolute md:left-[2%] md:top-[50px] md:mx-0 md:w-[21.5rem]">
      <div className="relative" style={{ transform: `rotate(${tilt}deg)` }}>
        {/* the next page, waiting underneath */}
        {can && <div aria-hidden className="notepad absolute inset-0 opacity-80" style={{ transform: `translateY(8px) rotate(${-tilt * 0.6}deg)` }} />}
        <AnimatePresence mode="popLayout" custom={{ d: dir, calm }} initial={false}>
          <Page key={note.id} note={note} can={can} calm={calm} dir={dir} onTear={tear} onOpen={openPost} />
        </AnimatePresence>
      </div>
      {can && (
        <div className="mt-5 flex items-center justify-center gap-3 text-[11px] tracking-wide text-mist md:justify-start md:pl-3">
          <span aria-hidden>👈 Swipe to tear off the page</span>
          <button onClick={() => tear(1)} className="min-h-9 rounded-full border border-white/15 px-3 text-xs text-foam transition hover:bg-white/10 active:scale-95">Next page</button>
        </div>
      )}
    </div>
  );
}
