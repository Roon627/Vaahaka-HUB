"use client";
import { openSuggest } from "@/lib/suggest";

/** A small "Send us a note" button for static pages (opens the sheet hosted by the Nav). */
export default function SuggestLink({ className = "" }: { className?: string }) {
  return (
    <button onClick={openSuggest} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 text-sm text-foam transition hover:bg-white/10 ${className}`}>
      <span aria-hidden>💌</span> Send us a note
    </button>
  );
}
