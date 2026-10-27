"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getDeviceToken, getMyReactions, setMyReaction } from "@/lib/device";
import { REACTIONS, type ReactionKind } from "@/lib/constants";
import type { Post, ReactionCounts } from "@/lib/types";

/**
 * Supportive-only reactions. Tapping toggles; the server dedupes per device
 * token and returns authoritative counters. Optimistic UI with rollback.
 */
export default function ReactionBar({ post }: { post: Post }) {
  const [counts, setCounts] = useState<ReactionCounts>({
    felt: post.felt_count, heart: post.heart_count, listening: post.listening_count,
  });
  const [mine, setMine] = useState<Set<ReactionKind>>(new Set());
  const [busy, setBusy] = useState<ReactionKind | null>(null);

  // localStorage is client-only; hydrate after mount to avoid SSR mismatch.
  useEffect(() => { setMine(new Set(getMyReactions()[post.id] ?? [])); }, [post.id]);

  async function toggle(kind: ReactionKind) {
    if (busy) return;
    setBusy(kind);
    const wasOn = mine.has(kind);
    const delta = wasOn ? -1 : 1;
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

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ kind, emoji, label }) => {
        const on = mine.has(kind);
        return (
          <motion.button
            key={kind}
            whileTap={{ scale: 0.88 }}
            onClick={() => toggle(kind)}
            aria-pressed={on}
            aria-label={`${label} (${counts[kind]})`}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
              on ? "border-glow/60 bg-glow/10 text-glow shadow-glow" : "border-slate2 text-mist hover:border-mist/50 hover:text-foam"
            }`}
          >
            <motion.span key={String(on)} initial={{ scale: on ? 1.5 : 1 }} animate={{ scale: 1 }}>{emoji}</motion.span>
            <span>{label}</span>
            <span className="tabular-nums text-xs opacity-80">{counts[kind]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
