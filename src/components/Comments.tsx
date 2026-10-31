"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useComments } from "@/hooks/useComments";
import { timeAgo } from "@/lib/time";
import ReportSheet, { type ReportTarget } from "./ReportSheet";

// One tap, always kind. These also nudge the whole space toward support instead of advice or debate.
const QUICK = ["You're not alone 🫂", "Sending you strength 🕯️", "Thank you for sharing this 🤍", "I felt this too", "You matter 🫶", "Be gentle with yourself 🌊"];
const MAX = 500;

/**
 * Anonymous notes under a letter, on parchment.
 * Moderation is layered: the database filters rude/harsh wording (English + Dhivehi), links and phone
 * numbers; people can report any note; a few reports hide it. Rate limits stop floods.
 */
export default function Comments({ postId }: { postId: string }) {
  const { comments, loading, add, hide, hearts, heartCounts, toggleHeart } = useComments(postId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);

  async function send(body: string) {
    if (sending || body.trim().length < 2) return;
    setSending(true);
    setError(null);
    const err = await add(body.trim());
    setSending(false);
    if (err) setError(err);
    else setText("");
  }

  return (
    <section aria-label="Notes from the sea" className="mt-8 border-t border-ink/15 pt-5">
      <h3 className="font-hand text-3xl text-ink">Notes from the sea <span className="text-xl text-inksoft">{comments.length > 0 && `(${comments.length})`}</span></h3>

      <ul className="mt-3 space-y-2.5">
        <AnimatePresence initial={false}>
          {comments.map((c) => {
            const isHearted = hearts.has(c.id);
            const count = heartCounts[c.id] ?? (isHearted ? 1 : 0);
            return (
              <motion.li key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-ink/10 bg-ink/[0.05] px-4 py-3">
                <p dir="auto" className="whitespace-pre-wrap break-words font-display text-[15px] leading-relaxed text-ink">{c.body}</p>
                <div className="mt-2 flex items-center justify-between border-t border-ink/[0.06] pt-1.5 text-xs text-inksoft">
                  <div className="flex items-center gap-2.5">
                    <span>someone · {timeAgo(c.created_at)}</span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.82 }}
                      onClick={() => toggleHeart(c.id)}
                      aria-label={isHearted ? "Unheart note" : "Heart note"}
                      className={`group flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                        isHearted
                          ? "bg-coral/15 text-[#b83b3b] font-semibold"
                          : "text-inksoft hover:bg-ink/[0.08] hover:text-[#b83b3b]"
                      }`}
                    >
                      <motion.span
                        animate={isHearted ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className="inline-block text-sm"
                      >
                        {isHearted ? "❤️" : "🤍"}
                      </motion.span>
                      <span className="tabular-nums">
                        {count > 0 ? count : (isHearted ? 1 : "")}
                      </span>
                    </motion.button>
                  </div>
                  <button onClick={() => setReport({ type: "comment", id: c.id })} aria-label="Report this note" className="-mr-1 flex min-h-7 items-center gap-1 rounded-full px-2 text-[11px] text-inksoft/70 transition hover:bg-ink/10 hover:text-wax">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>report
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {!loading && comments.length === 0 && <li className="rounded-2xl border border-dashed border-ink/20 px-4 py-4 text-center text-sm text-inksoft">No notes yet. Be the first to say something kind.</li>}
      </ul>

      {/* one-tap kind notes */}
      <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {QUICK.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={sending} className="min-h-11 shrink-0 rounded-full border border-ink/20 bg-ink/[0.04] px-4 text-sm text-ink transition hover:bg-ink/10 disabled:opacity-50">{q}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-3">
        <label htmlFor={`note-${postId}`} className="sr-only">Leave an anonymous note</label>
        <textarea
          dir="auto"
          id={`note-${postId}`} value={text} onChange={(e) => { setText(e.target.value); setError(null); }}
          rows={2} maxLength={MAX} placeholder="Leave a kind, anonymous note…"
          className="w-full resize-none rounded-2xl border border-ink/20 bg-ink/[0.04] px-4 py-3 font-display text-base leading-relaxed text-ink placeholder:text-inksoft/60 focus:border-ink/50 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-snug text-inksoft">Kind words only. Rude or harsh wording (Dhivehi or English), links and phone numbers are blocked.</p>
          <button type="submit" disabled={sending || text.trim().length < 2} className="min-h-11 shrink-0 rounded-full bg-ink px-6 text-sm font-medium text-[#fbf3de] transition disabled:opacity-30">{sending ? "Sending…" : "Send"}</button>
        </div>
        {error && <p role="alert" className="mt-2 rounded-xl bg-wax/10 px-3 py-2 text-sm text-wax">{error}</p>}
      </form>

      <AnimatePresence>
        {report && <ReportSheet target={report} onClose={() => setReport(null)} onReported={() => { if (report.type === "comment") hide(report.id); }} />}
      </AnimatePresence>
    </section>
  );
}
