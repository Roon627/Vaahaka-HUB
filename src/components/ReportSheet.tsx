"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getDeviceToken } from "@/lib/device";
import { byId } from "@/lib/helplines";
import HelplineCard from "./HelplineCard";

export type ReportTarget = { type: "post" | "comment"; id: string };

const REASONS = [
  { id: "rude", label: "Rude, harsh or mocking", hint: "Insults, bullying, putting someone down" },
  { id: "hate", label: "Hateful or discriminatory", hint: "Slurs, targeting a group or a person" },
  { id: "self_harm", label: "Someone may be in danger", hint: "We won't hide it. We'll flag it so support can step in" },
  { id: "privacy", label: "Shares private details", hint: "Names, places or anything that could identify someone" },
  { id: "spam", label: "Spam or links", hint: "Ads, links, phone numbers" },
  { id: "other", label: "Something else", hint: "" },
] as const;

/**
 * Report a letter or a note. Three people reporting hides it for review.
 * "Someone may be in danger" never hides anything: it flags the person for follow-up and shows the helplines.
 */
export default function ReportSheet({ target, onClose, onReported }: { target: ReportTarget; onClose: () => void; onReported: () => void }) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"] | null>(null);
  const [state, setState] = useState<"pick" | "sending" | "done" | "error">("pick");

  async function send() {
    if (!reason) return;
    setState("sending");
    const fn = target.type === "post" ? "report_post" : "report_comment";
    const arg = target.type === "post" ? { p_post_id: target.id } : { p_comment_id: target.id };
    const { error } = await supabase.rpc(fn, { ...arg, p_device: getDeviceToken(), p_reason: reason });
    if (error) return setState("error");
    setState("done");
    if (reason !== "self_harm") onReported();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-abyss/70 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label="Report"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-gradient-to-b from-tide to-deep p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-soft sm:rounded-3xl"
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

        {state === "done" ? (
          <div className="text-center">
            <img src="/brand/stickers/happy.svg" alt="" width={64} height={77} className="mx-auto" />
            <h2 className="mt-3 font-display text-xl text-foam">Thank you for looking out</h2>
            <p className="mt-1 text-sm text-mist">
              {reason === "self_harm" ? "A moderator will be alerted. If they may be in danger right now, these lines can help:" : "We'll take a look. If a few people report the same thing, it's hidden automatically while we review."}
            </p>
            {reason === "self_harm" && (
              <div className="mt-4 space-y-3 text-left"><HelplineCard h={byId("mental-health")} compact /><HelplineCard h={byId("emergency")} compact /></div>
            )}
            <button onClick={onClose} className="mt-5 min-h-12 w-full rounded-full bg-gradient-to-r from-glow to-sand text-sm font-semibold text-abyss">Done</button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl text-foam">Report this {target.type === "post" ? "letter" : "note"}</h2>
            <p className="mt-1 text-sm text-mist">Reports are anonymous. What's the problem?</p>
            <div role="radiogroup" aria-label="Reason" className="mt-4 space-y-2">
              {REASONS.map((r) => {
                const on = reason === r.id;
                return (
                  <button key={r.id} role="radio" aria-checked={on} onClick={() => setReason(r.id)}
                    className={`w-full min-h-14 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-glow/60 bg-glow/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
                    <span className="block text-[15px] text-foam">{r.label}</span>
                    {r.hint && <span className="mt-0.5 block text-xs text-mist">{r.hint}</span>}
                  </button>
                );
              })}
            </div>
            {state === "error" && <p role="alert" className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">Couldn't send that. Check your connection and try again.</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="min-h-12 flex-1 rounded-full border border-white/15 text-sm text-foam transition hover:bg-white/10">Cancel</button>
              <button onClick={send} disabled={!reason || state === "sending"} className="min-h-12 flex-1 rounded-full bg-gradient-to-r from-glow to-sand text-sm font-semibold text-abyss disabled:opacity-40">{state === "sending" ? "Sending…" : "Send report"}</button>
            </div>
            <p className="mt-3 text-center text-[11px] text-mist">Need support yourself? <Link href="/help" onClick={onClose} className="underline underline-offset-2 hover:text-foam">See helplines</Link></p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
