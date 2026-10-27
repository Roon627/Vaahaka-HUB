"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

// English only for now; Dhivehi phrases should be added with a native speaker. Nothing is stored or sent:
// this runs in the browser on what's typed, purely to offer help. It never blocks a letter.
const CRISIS = /\b(kill(ing)? myself|end(ing)? my (own )?life|suicid\w*|want(ed)? to die|wanna die|don'?t want to (be here|live|exist)|hurt(ing)? myself|self[- ]?harm\w*|cut(ting)? myself|no reason to live|better off dead|take my own life)\b/i;
export const looksLikeCrisis = (text: string) => CRISIS.test(text);

/** A gentle, dismissible offer of help under the writing box. */
export default function CrisisNudge({ text }: { text: string }) {
  const show = looksLikeCrisis(text);
  return (
    <AnimatePresence>
      {show && (
        <motion.div role="note" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mt-3 rounded-2xl border border-wax/30 bg-wax/[0.08] p-4 text-[14px] leading-relaxed text-ink">
            <p className="font-medium">It sounds like you're carrying something really heavy.</p>
            <p className="mt-1 text-inksoft">You can still send your letter. And if you'd like to talk to someone right now, it's free and confidential:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="tel:1677" className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-[#fbf3de]">Call 1677 · 24 hours</a>
              <a href="tel:911" className="inline-flex min-h-11 items-center rounded-full border border-ink/30 px-5 text-sm text-ink">Emergency 911</a>
              <Link href="/help" className="inline-flex min-h-11 items-center px-2 text-sm text-inksoft underline underline-offset-2">All helplines</Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
