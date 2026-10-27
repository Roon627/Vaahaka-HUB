"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import WhereSheet from "./WhereSheet";

interface Props {
  category: CategoryId | null;
  atoll: string | null;
  onCategory: (c: CategoryId | null) => void;
  onAtoll: (code: string | null) => void;
}

/**
 * A quiet line above the shelf saying what you're looking at: "Sad · anywhere". The mood itself is chosen from
 * the bottom menu; "anywhere" opens the atoll search. Not sticky, nothing to scroll.
 */
export default function FeedBar({ category, atoll, onCategory, onAtoll }: Props) {
  const [where, setWhere] = useState(false);
  const label = category ? CATEGORY_BY_ID[category].label : "Every mood";
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 px-4 pt-3 text-sm">
      <AnimatePresence mode="wait">
        <motion.span key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="font-hand text-2xl text-sand">{label}</motion.span>
      </AnimatePresence>
      {category && <button onClick={() => onCategory(null)} aria-label="Show every mood" className="min-h-11 px-1 text-mist hover:text-foam">✕</button>}
      <span className="text-mist">·</span>
      <button onClick={() => setWhere(true)} className="min-h-11 text-mist underline decoration-white/20 underline-offset-4 transition hover:text-foam">
        {atoll ? ATOLL_BY_CODE[atoll].name : "anywhere"}
      </button>
      {atoll && <button onClick={() => onAtoll(null)} aria-label="Clear atoll" className="min-h-11 px-1 text-mist hover:text-foam">✕</button>}
      <AnimatePresence>{where && <WhereSheet atoll={atoll} onAtoll={onAtoll} onClose={() => setWhere(false)} />}</AnimatePresence>
    </div>
  );
}
