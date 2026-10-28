"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import WhereSheet from "./WhereSheet";
import MoodSheet from "./MoodSheet";

interface Props {
  category: CategoryId | null;
  atoll: string | null;
  onCategory: (c: CategoryId | null) => void;
  onAtoll: (code: string | null) => void;
}

export default function FeedBar({ category, atoll, onCategory, onAtoll }: Props) {
  const [sheet, setSheet] = useState<"mood" | "place" | null>(null);
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button onClick={() => setSheet("mood")} aria-haspopup="dialog" className="shore-filter">
        {category ? CATEGORY_BY_ID[category].label : "All feelings"}<span aria-hidden>⌄</span>
      </button>
      <button onClick={() => setSheet("place")} aria-haspopup="dialog" className="shore-filter">
        <span className="truncate">{atoll ? ATOLL_BY_CODE[atoll].name : "All islands"}</span><span aria-hidden>⌄</span>
      </button>
      <AnimatePresence>
        {sheet === "mood" && <MoodSheet value={category} onChange={onCategory} onClose={() => setSheet(null)} />}
        {sheet === "place" && <WhereSheet atoll={atoll} onAtoll={onAtoll} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  );
}
