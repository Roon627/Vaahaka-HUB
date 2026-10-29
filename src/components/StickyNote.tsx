"use client";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLL_BY_CODE } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { useSea } from "./SeaProvider";
import { playTear } from "@/lib/sound";
import { looksLikeCrisis } from "./CrisisNudge";

/** The notepad shows the most felt letters; swipe a page away to tear it off and read the next. */
const MAX_CHARS = 150;

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

// The torn page is scrunched up as it leaves: its outline folds into an irregular ball while creases fade in over it.
const FLAT = "polygon(0% 0%, 33% 0%, 66% 0%, 100% 0%, 100% 33%, 100% 66%, 100% 100%, 66% 100%, 33% 100%, 0% 100%, 0% 66%, 0% 33%)";
const BALL = "polygon(14% 10%, 38% 0%, 60% 16%, 90% 6%, 100% 36%, 82% 58%, 96% 90%, 62% 100%, 40% 82%, 8% 94%, 2% 62%, 18% 34%)";
const page = {
  in: ({ calm }: { d: number; calm: boolean }) => (calm ? { opacity: 0 } : { opacity: 1, clipPath: FLAT }), // the next page is already there, underneath
  on: { opacity: 1, y: 0, scale: 1, clipPath: FLAT },
  out: ({ d, calm }: { d: number; calm: boolean }) =>
    calm ? { opacity: 0 } : {
      x: [null, d * 40, d * 150] as [null, number, number], y: [null, -26, 150] as [null, number, number], rotate: [null, d * 14, d * 48] as [null, number, number], scale: [null, 0.78, 0.34] as [null, number, number], opacity: [null, 1, 0] as [null, number, number], clipPath: [FLAT, FLAT, BALL],
      zIndex: 20, transition: { duration: 0.62, times: [0, 0.35, 1], ease: "easeIn" as const },
    },
};
const creases = {
  in: { opacity: 0 }, on: { opacity: 0 },
  out: { opacity: [0, 0, 1], transition: { duration: 0.62, times: [0, 0.3, 0.6] } },
};

/** One page of the pad. It owns its drag position, so the next page always starts centred. */
const Page = forwardRef<HTMLDivElement, { note: Note; can: boolean; calm: boolean; dir: 1 | -1; onTear: (d: 1 | -1) => void; onOpen: (p: Post) => void }>(function Page({ note, can, calm, dir, onTear, onOpen }, ref) {
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const onEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) onTear(info.offset.x < 0 || info.velocity.x < -500 ? -1 : 1);
  };
  const long = note.lines.join(" ").length;
  const size = long < 130 ? "text-2xl md:text-[1.7rem]" : "text-xl md:text-2xl";
  return (
    <motion.div
      ref={ref}
      custom={{ d: dir, calm }}
      variants={page}
      initial="in" animate="on" exit="out"
      drag={can ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={onEnd}
      whileDrag={{ scale: 1.02, zIndex: 20 }}
      style={{ x, rotate: calm ? 0 : dragTilt }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className={`notepad relative flex h-[21.5rem] flex-col overflow-hidden ${can ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <motion.span aria-hidden variants={creases} className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
        style={{ background: "linear-gradient(62deg, transparent 36%, rgba(70,45,15,.5) 37%, rgba(255,255,255,.4) 38.2%, transparent 40%), linear-gradient(118deg, transparent 50%, rgba(255,255,255,.55) 51%, rgba(70,45,15,.45) 52.4%, transparent 55%), linear-gradient(8deg, transparent 22%, rgba(70,45,15,.4) 23%, transparent 25.5%), linear-gradient(152deg, transparent 64%, rgba(70,45,15,.38) 65%, transparent 68%), linear-gradient(95deg, transparent 30%, rgba(70,45,15,.3) 31%, transparent 33%), radial-gradient(ellipse at 28% 32%, rgba(70,45,15,.28), transparent 55%), radial-gradient(ellipse at 76% 72%, rgba(70,45,15,.3), transparent 50%)" }} />
      <p className="text-[10px] font-bold uppercase leading-8 tracking-[0.24em] text-inksoft">{note.eyebrow}</p>
      {note.greeting && <p className="font-hand text-3xl leading-8">{note.greeting}</p>}
      <div dir="auto" className={`font-hand leading-8 ${size} ${note.post ? "line-clamp-5" : ""}`}>
        {note.lines.map((l, k) => <p key={k}>{l}</p>)}
      </div>
      {/* the sign-off and the button sit at the foot of the page, wherever the letter ends */}
      <div className={note.post ? "mt-auto" : "mt-2"}>
        <p className="font-hand text-xl leading-8 text-inksoft">{note.sign}</p>
        {note.post && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <button onClick={() => onOpen(note.post!)} onPointerDownCapture={(e) => e.stopPropagation()} className="notepad-btn">Read the whole letter →</button>
            {!!note.felt && <span className="text-xs text-inksoft">{note.felt} felt this</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
});

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
  const can = notes.length > 1;
  const tear = useCallback((d: 1 | -1) => { if (notes.length > 1) { playTear(); setDir(d); setI((n) => n + 1); } }, [notes.length]);

  return (
    <div className="relative mx-auto w-[min(88vw,22rem)] pt-3 lg:absolute lg:left-[2%] lg:top-[50px] lg:mx-0 lg:w-[21.5rem]">
      <div className="notepad-pad">
        <div aria-hidden className="notepad-base" />
        <div className="relative">
          <AnimatePresence mode="popLayout" custom={{ d: dir, calm }} initial={false}>
            <Page key={note.id} note={note} can={can} calm={calm} dir={dir} onTear={tear} onOpen={openPost} />
          </AnimatePresence>
        </div>
        <div aria-hidden className="notepad-bind" />
      </div>
      {can && (
        <div className="mt-7 flex items-center justify-center gap-3 text-[11px] tracking-wide text-mist lg:justify-start lg:pl-3">
          <span aria-hidden>👈 Swipe to tear off the page</span>
          <button onClick={() => tear(1)} className="min-h-9 rounded-full border border-white/15 px-3 text-xs text-foam transition hover:bg-white/10 active:scale-95">Next page</button>
        </div>
      )}
    </div>
  );
}
