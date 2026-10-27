"use client";
import { motion } from "framer-motion";
import { CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";

/** The current mood as a button: the mascot wears that mood's face and swaps with a little pop when it changes. */
export default function MoodButton({ value, onClick, count }: { value: CategoryId | null; onClick: () => void; count?: number }) {
  const cat = value ? CATEGORY_BY_ID[value] : null;
  const color = cat?.color ?? "#9fe3d0";
  return (
    <button
      onClick={onClick} aria-haspopup="dialog" aria-label={`Mood: ${cat ? cat.label : "all moods"}. Change`}
      className="flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1.5 pr-3.5 text-sm text-foam transition active:scale-95"
      style={{ borderColor: `${color}66`, background: `${color}1c` }}
    >
      <motion.img
        key={value ?? "all"} src={`/brand/stickers/${value ?? "happy"}.svg`} alt="" width={26} height={31} className="h-8 w-auto"
        initial={{ scale: 0.6, rotate: -14 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}
      />
      <span>{cat ? cat.label : "All moods"}</span>
      {count != null && <span className="text-xs tabular-nums opacity-70">{count.toLocaleString()}</span>}
      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );
}
