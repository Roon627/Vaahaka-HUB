import { HELPLINES_CHECKED, type Helpline } from "@/lib/helplines";

const TONE: Record<Helpline["kind"], string> = {
  emergency: "border-coral/40 bg-coral/[0.09]",
  "mental-health": "border-glow/35 bg-glow/[0.08]",
  child: "border-white/15 bg-white/[0.05]",
  family: "border-white/15 bg-white/[0.05]",
  youth: "border-white/15 bg-white/[0.05]",
};

/** One helpline: the number is a big tap-to-call button, with hours and where we verified it. */
export default function HelplineCard({ h, compact = false }: { h: Helpline; compact?: boolean }) {
  return (
    <article className={`rounded-3xl border p-5 ${TONE[h.kind]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug text-foam">{h.name}</h3>
          <p className="mt-0.5 text-xs text-mist">{h.hours}</p>
        </div>
        <a
          href={`tel:${h.tel}`}
          aria-label={`Call ${h.name} on ${h.number}`}
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-glow to-sand px-5 text-base font-semibold tabular-nums text-abyss shadow-glow"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
          {h.number}
        </a>
      </div>
      {!compact && (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-foam/80">{h.blurb}</p>
          <p className="mt-3 text-[11px] text-mist">
            Checked {HELPLINES_CHECKED} · <a href={h.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foam">{h.source.label}</a>
          </p>
        </>
      )}
    </article>
  );
}
