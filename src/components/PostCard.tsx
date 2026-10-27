"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getDeviceToken } from "@/lib/device";
import { ATOLL_BY_CODE, CATEGORY_BY_ID } from "@/lib/constants";
import type { Post } from "@/lib/types";
import ReactionBar from "./ReactionBar";

function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [[60, "s"], [3600, "m"], [86400, "h"], [604800, "d"]];
  let div = 1;
  for (const [limit, unit] of steps) {
    if (s < limit) return `${Math.floor(s / div)}${unit} ago`;
    div = limit;
  }
  return new Date(iso).toLocaleDateString();
}

export default function PostCard({ post }: { post: Post }) {
  const cat = CATEGORY_BY_ID[post.category];
  const atoll = ATOLL_BY_CODE[post.atoll_code];
  // Posts with a trigger warning start collapsed behind a gentle gate.
  const [revealed, setRevealed] = useState(!post.trigger_warning);
  const [reported, setReported] = useState(false);

  async function report() {
    if (reported || !confirm("Report this story for review?")) return;
    setReported(true);
    await supabase.rpc("report_post", { p_post_id: post.id, p_device: getDeviceToken() });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate2 bg-tide/80 p-5 backdrop-blur"
      style={{ boxShadow: `0 0 0 1px ${cat.color}10, 0 12px 40px -24px ${cat.color}` }}
    >
      {/* Category glow strip */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />

      <header className="mb-3 flex items-center justify-between gap-2 text-xs text-mist">
        <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ background: `${cat.color}1f`, color: cat.color }}>
          {cat.emoji} {cat.label}
        </span>
        <span>
          📍 {post.island ? `${post.island}, ` : ""}{atoll?.name ?? post.atoll_code} · {timeAgo(post.created_at)}
        </span>
      </header>

      {revealed ? (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foam/95">{post.body}</p>
      ) : (
        <div className="rounded-xl border border-dashed border-coral/40 bg-coral/5 p-4 text-center">
          <p className="text-sm text-coral">⚠️ Trigger warning: {post.trigger_warning}</p>
          <button onClick={() => setRevealed(true)} className="mt-2 text-xs text-mist underline underline-offset-4 hover:text-foam">
            I understand, show story
          </button>
        </div>
      )}

      <footer className="mt-4 flex items-end justify-between gap-2">
        <ReactionBar post={post} />
        <button onClick={report} disabled={reported} className="text-[11px] text-mist/60 opacity-0 transition hover:text-coral group-hover:opacity-100 focus:opacity-100">
          {reported ? "reported" : "report"}
        </button>
      </footer>
    </motion.article>
  );
}
