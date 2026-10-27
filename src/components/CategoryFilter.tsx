"use client";
import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/constants";

interface Props {
  value: CategoryId | null;
  onChange: (c: CategoryId | null) => void;
  /** Unique per usage so two bars on a page don't share the sliding highlight. */
  idPrefix: string;
  allLabel?: string;
}

/** Horizontally scrollable mood chips; the active chip gets a sliding glow. */
export default function CategoryFilter({ value, onChange, idPrefix, allLabel = "All" }: Props) {
  const chips = [{ id: null, label: allLabel, emoji: "🌊", color: "#2ee6c5" }, ...CATEGORIES];
  return (
    <div
      role="tablist"
      aria-label="Filter by mood"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
    >
      {chips.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id ?? "all"}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c.id as CategoryId | null)}
            className="relative shrink-0 rounded-full border border-slate2 px-3.5 py-1.5 text-sm text-mist transition-colors hover:text-foam"
            style={active ? { color: "#e6f1f7" } : undefined}
          >
            {active && (
              <motion.span
                layoutId={`${idPrefix}-chip`}
                className="absolute inset-0 rounded-full"
                style={{ background: `${c.color}26`, boxShadow: `inset 0 0 0 1px ${c.color}99, 0 0 18px -4px ${c.color}` }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{c.emoji} {c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
