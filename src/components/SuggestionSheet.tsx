"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Sheet from "./Sheet";
import { getDeviceToken } from "@/lib/device";
import { looksLikeCrisis } from "./CrisisNudge";

const KINDS = [
  { id: "idea", emoji: "💡", label: "An idea", hint: "I wish Ihusaas could…" },
  { id: "bug", emoji: "🐛", label: "Something's off", hint: "I tapped… and expected… but…" },
  { id: "thanks", emoji: "💌", label: "Just thanks", hint: "Something that made your day a little softer…" },
  { id: "safety", emoji: "🛟", label: "A safety worry", hint: "Something that doesn't feel safe or kind here…" },
  { id: "other", emoji: "🌊", label: "Something else", hint: "Anything at all…" },
] as const;
const MAX = 2000;

/**
 * "Send us a note": a gentle suggestion box. Anonymous by default (a way to reply is optional). Goes to the team's
 * Fodibey dashboard. A hidden "website" field catches bots; real people never see it.
 */
export default function SuggestionSheet({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("idea");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"write" | "sending" | "done">("write");
  const [error, setError] = useState<string | null>(null);
  const hint = KINDS.find((k) => k.id === kind)!.hint;
  const ready = message.trim().length >= 5 && state !== "sending";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setState("sending"); setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, message, contact, page: window.location.pathname, device: getDeviceToken(), website: trap }),
      });
      if (res.ok) return setState("done");
      const j = await res.json().catch(() => null);
      setError(j?.error?.message ?? "Sorry, that didn't go through. Please try again.");
    } catch {
      setError("We couldn't reach the sea just now. Check your connection and try again.");
    }
    setState("write");
  }

  return (
    <Sheet title="Send us a note" onClose={onClose}>
      {state === "done" ? (
        <div className="py-4 text-center">
          <motion.img src="/brand/stickers/happy.svg" alt="" width={92} height={110} className="mx-auto" initial={{ scale: 0.7, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", damping: 12 }} />
          <h2 className="mt-4 font-display text-2xl text-foam">Thank you 🤍</h2>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-mist">Your note is floating over to the team. We read every one.</p>
          <button onClick={onClose} className="mt-6 min-h-12 rounded-full bg-gradient-to-r from-glow to-sand px-8 text-sm font-semibold text-abyss">Back to the sea</button>
        </div>
      ) : (
        <form onSubmit={send}>
          <div className="flex items-center gap-3">
            <img src="/brand/stickers/happy.svg" alt="" width={52} height={62} className="shrink-0 animate-bob" />
            <div>
              <h2 className="font-display text-xl leading-tight text-foam">Send us a note</h2>
              <p className="text-[13px] leading-snug text-mist">Ideas, wobbles, thank-yous. The team reads every one.</p>
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="sr-only">What kind of note is it?</legend>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} aria-pressed={kind === k.id}
                  className={`min-h-11 rounded-full border px-3.5 text-sm transition ${kind === k.id ? "border-glow/60 bg-glow/15 text-foam" : "border-white/10 bg-white/[0.04] text-mist hover:text-foam"}`}>
                  <span aria-hidden>{k.emoji}</span> {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label htmlFor="suggest-msg" className="sr-only">Your note</label>
          <textarea id="suggest-msg" dir="auto" value={message} onChange={(e) => { setMessage(e.target.value); setError(null); }} rows={5} maxLength={MAX} placeholder={hint}
            className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-foam placeholder:text-mist/60 focus:border-glow/50 focus:outline-none" />
          <div className="mt-1 text-right text-[11px] tabular-nums text-mist/70">{message.length}/{MAX}</div>

          {(looksLikeCrisis(message) || kind === "safety") && (
            <div role="note" className="mt-2 rounded-2xl border border-coral/25 bg-coral/[0.08] p-3.5 text-[13px] leading-snug text-foam/90">
              <strong className="font-medium text-coral">{looksLikeCrisis(message) ? "It sounds like you're carrying something heavy." : "If someone is in danger right now:"}</strong>{" "}
              Notes aren&apos;t read in real time. Call <a href="tel:1677" className="font-semibold underline">1677</a> (free, 24 hours) or <a href="tel:911" className="font-semibold underline">911</a>.{" "}
              <Link href="/help" onClick={onClose} className="underline underline-offset-2">All helplines</Link>
            </div>
          )}

          <label htmlFor="suggest-contact" className="mt-3 block text-[13px] text-mist">Want a reply? <span className="text-mist/70">(optional. Leave it empty to stay anonymous)</span></label>
          <input id="suggest-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} autoComplete="off" inputMode="email" placeholder="An email or number, only the team sees it"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-foam placeholder:text-mist/60 focus:border-glow/50 focus:outline-none" />

          {/* honeypot: hidden from people, irresistible to bots */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
          </div>

          {error && <p role="alert" className="mt-3 rounded-2xl border border-coral/30 bg-coral/[0.08] px-4 py-2.5 text-[13px] text-foam">{error}</p>}

          <button type="submit" disabled={!ready} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-glow to-sand text-sm font-semibold text-abyss transition disabled:opacity-40">
            {state === "sending" ? "Sending…" : <>Send to the team <span aria-hidden>🍾</span></>}
          </button>
          <button type="button" onClick={onClose} className="mt-2 w-full rounded-full py-2 text-xs text-mist transition hover:text-foam">Not now</button>
        </form>
      )}
    </Sheet>
  );
}
