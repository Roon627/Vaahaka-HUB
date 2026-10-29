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
const THAANA = /[\u0780-\u07BF]/;

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
  // Thaana is taller and its vowel marks hang below the line, so it gets fewer characters and is never line-clamped (see PageBody)
  const max = THAANA.test(t) ? 130 : MAX_CHARS;
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("۔ "));
  return (stop > 70 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "…").trim();
}

function fromPost(p: Post): Note {
  const a = ATOLL_BY_CODE[p.atoll_code];
  const where = [p.island, a?.name].filter(Boolean).join(", ");
  return { id: p.id, felt: p.felt_count, eyebrow: "Found in a bottle", lines: [clip(p.body)], sign: where ? `Someone from ${where}` : "Someone, somewhere", post: p };
}

// The page wrinkles as you pull it, not after you let go: everything below is driven by how far it has been dragged
// (`amount`, 0..1), so the outline folds into a ball, creases pile up and the paper darkens a little, all at the finger's pace.
// Letting go just carries on from wherever the finger left it.
const FLAT_PTS: [number, number][] = [[0, 0], [33, 0], [66, 0], [100, 0], [100, 33], [100, 66], [100, 100], [66, 100], [33, 100], [0, 100], [0, 66], [0, 33]];
const BALL_PTS: [number, number][] = [[14, 10], [38, 0], [60, 16], [90, 6], [100, 36], [82, 58], [96, 90], [62, 100], [40, 82], [8, 94], [2, 62], [18, 34]];
const poly = (a: number) => `polygon(${FLAT_PTS.map(([x, y], i) => `${(x + (BALL_PTS[i][0] - x) * a).toFixed(1)}% ${(y + (BALL_PTS[i][1] - y) * a).toFixed(1)}%`).join(",")})`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const CREASES = [
  "linear-gradient(62deg, transparent 36%, rgba(70,45,15,.5) 37%, rgba(255,255,255,.45) 38.3%, transparent 40%), linear-gradient(8deg, transparent 22%, rgba(70,45,15,.4) 23%, transparent 25.5%)",
  "linear-gradient(118deg, transparent 50%, rgba(255,255,255,.55) 51%, rgba(70,45,15,.45) 52.4%, transparent 55%), linear-gradient(152deg, transparent 64%, rgba(70,45,15,.38) 65%, transparent 68%), radial-gradient(ellipse at 28% 32%, rgba(70,45,15,.26), transparent 55%)",
  "linear-gradient(95deg, transparent 30%, rgba(70,45,15,.34) 31%, transparent 33%), linear-gradient(35deg, transparent 44%, rgba(255,255,255,.45) 45%, rgba(70,45,15,.4) 46.4%, transparent 49%), linear-gradient(170deg, transparent 12%, rgba(70,45,15,.34) 13%, transparent 16%), radial-gradient(ellipse at 76% 72%, rgba(70,45,15,.32), transparent 50%)",
];
const page = {
  in: ({ calm }: { d: number; calm: boolean }) => (calm ? { opacity: 0 } : { opacity: 1 }), // the next page is already there, underneath
  on: { opacity: 1, y: 0 },
  out: ({ d, calm }: { d: number; calm: boolean }) =>
    calm ? { opacity: 0 } : {
      x: [null, d * 70, d * 240] as [null, number, number], y: [null, -20, 150] as [null, number, number], opacity: [null, 1, 0] as [null, number, number],
      zIndex: 20, transition: { duration: 0.6, times: [0, 0.35, 1], ease: "easeIn" as const },
    },
};

/** What is written on a page: shared by the live page and the copy waiting underneath. */
function PageBody({ note, onOpen }: { note: Note; onOpen: (p: Post) => void }) {
  const long = note.lines.join(" ").length;
  const size = long < 130 ? "text-2xl md:text-[1.7rem]" : "text-xl md:text-2xl";
  return (
    <>
    <p className="text-[10px] font-bold uppercase leading-8 tracking-[0.24em] text-inksoft">{note.eyebrow}</p>
    {note.greeting && <p className="font-hand text-3xl leading-8">{note.greeting}</p>}
    <div dir="auto" className={`font-hand leading-8 ${size} ${note.post && !THAANA.test(note.lines.join(" ")) ? "line-clamp-5" : ""}`}>
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
    </>
  );
}

/** One page of the pad. It owns its drag position, so the next page always starts centred. */
const Page = forwardRef<HTMLDivElement, { note: Note; can: boolean; calm: boolean; dir: 1 | -1; onTear: (d: 1 | -1) => void; onOpen: (p: Post) => void }>(function Page({ note, can, calm, dir, onTear, onOpen }, ref) {
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-260, -100, 0, 100, 260], [-46, -10, 0, 10, 46]);
  const amount = useTransform(x, (v) => Math.pow(clamp01(Math.abs(v) / 190), 1.35)); // how scrunched: 0 flat .. 1 a ball
  const clipPath = useTransform(amount, poly);
  const squash = useTransform(amount, [0, 1], [1, 0.46]);
  const shade = useTransform(amount, (a) => `brightness(${(1 - 0.16 * a).toFixed(3)})`);
  const c1 = useTransform(amount, (a) => clamp01((a - 0.03) / 0.22));
  const c2 = useTransform(amount, (a) => clamp01((a - 0.22) / 0.3));
  const c3 = useTransform(amount, (a) => clamp01((a - 0.48) / 0.3));
  const onEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) onTear(info.offset.x < 0 || info.velocity.x < -500 ? -1 : 1);
  };
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
      whileDrag={{ zIndex: 20 }}
      style={calm ? { x } : { x, rotate: dragTilt, clipPath, scale: squash, filter: shade }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className={`notepad relative flex h-[21.5rem] flex-col overflow-hidden ${can ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {!calm && [c1, c2, c3].map((o, k) => (
        <motion.span key={k} aria-hidden className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply" style={{ opacity: o, background: CREASES[k] }} />
      ))}
      <PageBody note={note} onOpen={onOpen} />
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
          {/* the next page, already written, so a crumpling page reveals it instead of blank paper */}
          {can && (
            <div aria-hidden {...({ inert: "" } as object)} className="notepad pointer-events-none flex h-[21.5rem] flex-col overflow-hidden" style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
              <PageBody note={notes[(i + 1) % notes.length]} onOpen={() => {}} />
            </div>
          )}
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
