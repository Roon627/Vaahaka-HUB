"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/constants";
import Sheet from "./Sheet";

interface Props {
  value: CategoryId | null;
  onChange: (c: CategoryId | null) => void;
  onClose: () => void;
  /** Optional per-mood totals (the map shows them): keys are mood ids plus "all". */
  counts?: Record<string, number>;
}

const MOOD_INFO: Record<string, { dv: string; vibe: string; bgTint: string }> = {
  all: { dv: "ހުރިހާ", vibe: "The open sea", bgTint: "rgba(159, 227, 208, 0.12)" },
  nostalgia: { dv: "ހަނދާން", vibe: "Old memories", bgTint: "rgba(241, 213, 138, 0.15)" },
  sad: { dv: "ހިތާމަ", vibe: "Heavy clouds", bgTint: "rgba(143, 182, 232, 0.15)" },
  vent: { dv: "ރުޅި", vibe: "Steam it off", bgTint: "rgba(240, 168, 112, 0.15)" },
  secrets: { dv: "ސިއްރު", vibe: "Whispered", bgTint: "rgba(185, 162, 232, 0.15)" },
  relationships: { dv: "ލޯބި", vibe: "Heartstrings", bgTint: "rgba(235, 160, 196, 0.15)" },
  work: { dv: "ވަޒީފާ", vibe: "Long days", bgTint: "rgba(134, 207, 216, 0.15)" },
  horror: { dv: "ބިރު", vibe: "Dark chills", bgTint: "rgba(232, 139, 139, 0.15)" },
};

/**
 * "How does it feel?": Animated cutesy mood collection.
 * Every mood is an expressive sea spirit wearing that mood's sticker.
 * Hand-crafted with organic playful bobbing, Thaana mood names, and joyful spring physics.
 */
export default function MoodSheet({ value, onChange, onClose, counts }: Props) {
  const [poppedId, setPoppedId] = useState<string | null>(null);

  const tiles = [
    { id: null as CategoryId | null, label: "All feelings", sticker: "happy", color: "#9fe3d0", key: "all" },
    ...CATEGORIES.map((c) => ({ id: c.id as CategoryId | null, label: c.label, sticker: c.id, color: c.color, key: c.id as string })),
  ];

  const handleSelect = (id: CategoryId | null, key: string) => {
    navigator.vibrate?.([8, 25, 8]);
    setPoppedId(key);
    setTimeout(() => {
      onChange(id);
      onClose();
    }, 280);
  };

  return (
    <Sheet title="How does it feel?" onClose={onClose}>
      <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-foam">How does it feel?</h2>
            <span className="text-lg">🫧</span>
          </div>
          <p className="font-serif text-sm italic text-sand/80">
            Pick a mood and the sea brings matching letters ashore.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t, idx) => {
          const on = value === t.id;
          const isPopped = poppedId === t.key;
          const info = MOOD_INFO[t.key] ?? { dv: "އިޙްސާސް", vibe: "", bgTint: "rgba(255,255,255,0.06)" };

          return (
            <motion.button
              key={t.key}
              aria-pressed={on}
              onClick={() => handleSelect(t.id, t.key)}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.93 }}
              className={`group relative flex min-h-[7.25rem] flex-col items-center justify-between rounded-2xl p-3 text-center transition-all ${
                on
                  ? "ring-2 shadow-lg"
                  : "hover:border-white/20"
              }`}
              style={{
                borderColor: on ? t.color : "rgba(255,255,255,0.1)",
                borderWidth: on ? "2px" : "1px",
                backgroundColor: on ? info.bgTint : "rgba(10, 30, 42, 0.6)",
                boxShadow: on ? `0 8px 24px -4px ${t.color}35` : "none",
              }}
            >
              {/* Active cute sparkler tag */}
              {on && (
                <span className="absolute -top-2 -right-1.5 flex h-5 items-center rounded-full bg-sand px-1.5 text-[10px] font-bold text-abyss shadow-sm">
                  ✨ here
                </span>
              )}

              {/* Animated Cutesy Floating Mascot */}
              <div className="relative flex h-14 w-14 items-center justify-center">
                <motion.img
                  src={`/brand/stickers/${t.sticker}.svg`}
                  alt=""
                  width={46}
                  height={54}
                  className="h-12 w-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] filter"
                  animate={
                    isPopped
                      ? { scale: [1, 1.35, 1.1], rotate: [0, -12, 12, 0] }
                      : on
                      ? { y: [0, -3, 0], rotate: [-2, 2, -2] }
                      : { y: [0, -2, 0] }
                  }
                  transition={{
                    duration: on ? 2.2 : 3 + (idx % 3) * 0.4,
                    repeat: isPopped ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Micro bubble burst on selection */}
                <AnimatePresence>
                  {isPopped && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="pointer-events-none absolute inset-0 rounded-full border-2 border-sand"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Thaana Script & English Mood Lockup */}
              <div className="mt-1 flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-serif text-xs font-semibold"
                    style={{ color: on ? t.color : "#e2ded4" }}
                  >
                    {t.label}
                  </span>
                  <span className="font-serif text-[11px] text-sand/70">
                    {info.dv}
                  </span>
                </div>
                <span className="text-[10px] text-mist/75">
                  {info.vibe}
                </span>
              </div>

              {/* Count badge if provided */}
              {counts && counts[t.key] !== undefined && (
                <span className="mt-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums text-mist">
                  {counts[t.key].toLocaleString()}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </Sheet>
  );
}
