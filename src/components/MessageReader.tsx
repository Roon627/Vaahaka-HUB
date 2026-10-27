"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { Post, ReactionCounts } from "@/lib/types";
import Comments from "./Comments";
import ReactionBar from "./ReactionBar";
import ReportSheet from "./ReportSheet";
import WaxSeal from "./WaxSeal";

/** Bigger type for short letters, gently smaller for long ones, so the letter fits the first screen. */
const textSize = (n: number) => (n < 200 ? "text-[20px] leading-8" : n < 420 ? "text-[17px] leading-7" : n < 800 ? "text-[15px] leading-7" : "text-[14px] leading-6");

interface Props { post: Post; onClose: () => void; onCounts: (c: ReactionCounts) => void; onStep?: (dir: -1 | 1) => void; hasPrev?: boolean; hasNext?: boolean }

/**
 * Reading a letter: one parchment with everything on it, so there are no extra taps.
 * The letter, reactions, previous/next, notes and report/help all live on the same page.
 * Opens instantly (a quick unfold, no cork animation to wait through). Stories with a content note stay sealed
 * until the reader chooses to break the seal. On phones it's a bottom sheet: drag the handle down to close.
 */
export default function MessageReader({ post, onClose, onCounts, onStep, hasPrev, hasNext }: Props) {
  const cat = CATEGORY_BY_ID[post.category];
  const atoll = ATOLL_BY_CODE[post.atoll_code];
  const reduce = useReducedMotion();
  const drag = useDragControls();
  const [sealed, setSealed] = useState(!!post.trigger_warning);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  // Stepping to another letter reuses this reader: reset per-letter state.
  useEffect(() => { setSealed(!!post.trigger_warning); setReported(false); }, [post.id, post.trigger_warning]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reporting) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) onStep?.(1);
      if (e.key === "ArrowLeft" && hasPrev) onStep?.(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, reporting, onStep, hasPrev, hasNext]);

  return (
    <motion.div
      role="dialog" aria-modal="true" aria-label="A letter from the sea"
      className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/75 backdrop-blur-md sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl"
        drag="y" dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 700) onClose(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.article
          key={post.id}
          className="paper sheet sheet-pad max-h-[calc(100dvh-env(safe-area-inset-top)-0.5rem)] w-full overflow-y-auto overscroll-contain p-5 pt-1 sm:max-h-[90dvh] sm:p-11"
          initial={reduce ? false : { clipPath: "inset(-20% -20% 100% -20%)", y: -12 }}
          animate={{ clipPath: "inset(-20% -20% -20% -20%)", y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="-mx-5 flex touch-none justify-center py-2.5 sm:hidden" onPointerDown={(e) => drag.start(e)}>
            <span aria-hidden className="h-1.5 w-12 rounded-full bg-ink/25" />
          </div>
          <button onClick={onClose} aria-label="Close" className="absolute right-2 top-2 z-10 rounded-full p-3 text-inksoft transition hover:bg-ink/10 hover:text-ink sm:right-4 sm:top-4">✕</button>

          <div className="flex items-center gap-3">
            <WaxSeal color={cat.color} emoji={cat.emoji} size={38} />
            <div className="text-xs text-inksoft">
              <div className="font-medium uppercase tracking-widest">{cat.label}</div>
              <div>{post.island ? `${post.island}, ` : ""}{atoll?.name ?? post.atoll_code} · {timeAgo(post.created_at)}</div>
            </div>
          </div>

          <p className="mt-3 font-hand text-4xl text-ink sm:mt-6">Dear sea,</p>

          {sealed ? (
            <div className="py-10 text-center">
              <WaxSeal color="#b4563f" emoji="🤍" size={84} className="mx-auto" />
              <p className="mt-5 font-display text-lg italic text-ink">This letter is sealed.</p>
              <p className="mt-1 text-sm text-inksoft">The writer left a note: <strong className="font-semibold">{post.trigger_warning}</strong>. Only open it if you feel up to it.</p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setSealed(false)}
                className="mt-6 min-h-12 rounded-full border border-ink/30 px-7 font-hand text-2xl text-ink transition hover:bg-ink/10">
                Break the seal
              </motion.button>
            </div>
          ) : (
            <motion.div key={`b-${post.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <p className={`mt-2 whitespace-pre-wrap break-words font-display text-ink ${textSize(post.body.length)}`}>{post.body}</p>
              <p className="mt-3 text-right font-hand text-2xl text-inksoft">— someone in {atoll?.name ?? post.atoll_code}</p>
            </motion.div>
          )}

          <div className="mt-4 border-t border-ink/15 pt-3">
            <ReactionBar post={post} tone="paper" onCounts={onCounts} compact />
          </div>

          {onStep && (hasPrev || hasNext) && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <button onClick={() => onStep(-1)} disabled={!hasPrev} className="min-h-12 flex-1 rounded-full border border-ink/20 text-sm text-ink transition hover:bg-ink/10 disabled:opacity-30">← Previous</button>
              <button onClick={() => onStep(1)} disabled={!hasNext} className="min-h-12 flex-1 rounded-full bg-ink text-sm font-medium text-[#fbf3de] transition disabled:opacity-30">Next letter →</button>
            </div>
          )}

          {!sealed && <Comments postId={post.id} />}

          <div className="mt-6 flex items-center justify-between border-t border-ink/15 pt-3 text-xs text-inksoft">
            <button onClick={() => setReporting(true)} disabled={reported} className="-ml-2 flex min-h-11 items-center gap-1.5 rounded-full px-3 transition hover:bg-ink/10 hover:text-wax disabled:opacity-60">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>
              {reported ? "Reported. Thank you" : "Report this letter"}
            </button>
            <Link href="/help" onClick={onClose} className="-mr-2 flex min-h-11 items-center rounded-full px-3 transition hover:bg-ink/10 hover:text-ink">Need someone to talk to?</Link>
          </div>
        </motion.article>
      </motion.div>

      <AnimatePresence>
        {reporting && <ReportSheet target={{ type: "post", id: post.id }} onClose={() => setReporting(false)} onReported={() => setReported(true)} />}
      </AnimatePresence>
    </motion.div>
  );
}
