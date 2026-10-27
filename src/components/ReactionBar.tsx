"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getDeviceToken, getMyReactions, setMyReaction } from "@/lib/device";
import { REACTIONS, type ReactionKind } from "@/lib/constants";
import type { Post, ReactionCounts } from "@/lib/types";

interface Burst { id: number; kind: ReactionKind; emoji: string; drifts: number[] }
let burstId = 0;

interface Props {
  post: Post;
  /** "sea" for dark water, "paper" for use on parchment. */
  tone?: "sea" | "paper";
  /** Reports fresh counters so the list behind the reader stays in sync. */
  onCounts?: (c: ReactionCounts) => void;
  /** Icons + counts only (labels kept for screen readers): fits a single row on a phone. */
  compact?: boolean;
}

/**
 * Supportive-only reactions. Tapping toggles; the server dedupes per device
 * token and returns authoritative counters. Optimistic UI with rollback.
 * Giving a reaction releases a little shower of emoji that float up and fade.
 */
export default function ReactionBar({ post, tone = "sea", onCounts, compact = false }: Props) {
  const [counts, setCounts] = useState<ReactionCounts>({
    felt: post.felt_count, heart: post.heart_count, listening: post.listening_count,
  });
  const [mine, setMine] = useState<Set<ReactionKind>>(new Set());
  const [busy, setBusy] = useState<ReactionKind | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const onCountsRef = useRef(onCounts);
  onCountsRef.current = onCounts;

  // localStorage is client-only; hydrate after mount to avoid SSR mismatch.
  useEffect(() => { setMine(new Set(getMyReactions()[post.id] ?? [])); }, [post.id]);
  useEffect(() => { onCountsRef.current?.(counts); }, [counts]);

  function celebrate(kind: ReactionKind, emoji: string) {
    const b: Burst = { id: ++burstId, kind, emoji, drifts: Array.from({ length: 5 }, () => (Math.random() - 0.5) * 70) };
    setBursts((x) => [...x, b]);
    setTimeout(() => setBursts((x) => x.filter((y) => y.id !== b.id)), 1600);
  }

  async function toggle(kind: ReactionKind, emoji: string) {
    if (busy) return;
    setBusy(kind);
    const wasOn = mine.has(kind);
    const delta = wasOn ? -1 : 1;
    if (!wasOn) { celebrate(kind, emoji); navigator.vibrate?.(12); }
    // Optimistic update
    setCounts((c) => ({ ...c, [kind]: Math.max(0, c[kind] + delta) }));
    setMine((m) => { const n = new Set(m); wasOn ? n.delete(kind) : n.add(kind); return n; });

    const { data, error } = await supabase.rpc("react_to_post", {
      p_post_id: post.id, p_kind: kind, p_device: getDeviceToken(),
    });
    setBusy(null);

    if (error || !data?.[0]) {
      // Roll back
      setCounts((c) => ({ ...c, [kind]: Math.max(0, c[kind] - delta) }));
      setMine((m) => { const n = new Set(m); wasOn ? n.add(kind) : n.delete(kind); return n; });
      return;
    }
    const r = data[0] as { felt: number; heart: number; listening: number; active: boolean };
    setCounts({ felt: r.felt, heart: r.heart, listening: r.listening });
    setMyReaction(post.id, kind, r.active);
    setMine((m) => { const n = new Set(m); r.active ? n.add(kind) : n.delete(kind); return n; });
  }

  const paper = tone === "paper";
  const offCls = paper
    ? "border-ink/20 bg-ink/[0.05] text-inksoft hover:border-ink/40 hover:text-ink"
    : "border-white/10 bg-white/[0.04] text-mist hover:border-white/25 hover:text-foam";
  const onCls = paper
    ? "border-wax/50 bg-wax/15 text-wax"
    : "border-glow/40 bg-glow/15 text-foam shadow-glow";

  return (
    <div className={`flex gap-2 ${compact ? "" : "flex-wrap"}`}>
      {REACTIONS.map(({ kind, emoji, label }) => {
        const on = mine.has(kind);
        return (
          <div key={kind} className="relative">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(kind, emoji)}
              aria-pressed={on}
              aria-label={`${label} (${counts[kind]})`}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border ${compact ? "px-3" : "px-4"} py-2 text-sm transition-colors ${on ? onCls : offCls}`}
            >
              <motion.span
                key={String(on)}
                initial={{ scale: on ? 1.6 : 1, rotate: on ? -12 : 0 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
              >
                {emoji}
              </motion.span>
              <span className={compact ? "sr-only" : ""}>{label}</span>
              <span className="tabular-nums text-xs opacity-70">{counts[kind]}</span>
            </motion.button>

            {/* Floating emoji for this button */}
            {bursts.filter((b) => b.kind === kind).map((b) =>
              b.drifts.map((dx, i) => (
                <motion.span
                  key={`${b.id}-${i}`}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 text-base"
                  initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], y: -50 - i * 12, x: dx, scale: [0.4, 1.1, 0.8] }}
                  transition={{ duration: 1.3, delay: i * 0.07, ease: "easeOut" }}
                >
                  {b.emoji}
                </motion.span>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
