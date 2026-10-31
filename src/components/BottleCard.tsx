"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/lib/types";
import { useSea } from "./SeaProvider";
import Bottle from "./Bottle";
import WaxSeal from "./WaxSeal";
import { getDeviceToken, getMyReactions, setMyReaction } from "@/lib/device";
import { supabase } from "@/lib/supabase";

const THAANA = /[\u0780-\u07BF]/;

interface Props {
  post: Post;
  index: number;
  onOpen: (post: Post) => void;
  onPatch?: (id: string, fields: Partial<Post>) => void;
}

/**
 * Shore Letter Card:
 * Instead of an empty cartoon bottle that hides the confession, each card is a
 * tactile letter washed ashore. It shows the mood, origin atoll/island, and a
 * genuine excerpt of the words (or a respectful wax seal if content-warned).
 *
 * Visitors can heart-react directly from the feed with optimistic UI and haptics,
 * or tap the letter to open the full reader.
 */
export default function BottleCard({ post, index, onOpen, onPatch }: Props) {
  const { opened, previousVisit } = useSea();
  const isOpened = opened.has(post.id);
  const isNew = !!(previousVisit && new Date(post.created_at) > new Date(previousVisit) && !isOpened);
  const cat = CATEGORY_BY_ID[post.category] ?? {
    id: post.category,
    label: "Feeling",
    color: "#9fe3d0",
    emoji: "🌊",
  };
  const atoll = ATOLL_BY_CODE[post.atoll_code];
  const place = post.island
    ? `${post.island}${atoll ? `, ${atoll.name}` : ""}`
    : atoll?.name || post.atoll_code || "The sea";

  const isThaana = THAANA.test(post.body);

  // Heart reaction state
  const [mine, setMine] = useState<boolean>(false);
  const [heartCount, setHeartCount] = useState<number>((post.heart_count || 0) + (post.felt_count || 0));
  const [busy, setBusy] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; dx: number }[]>([]);

  // Hydrate local reaction state from device storage on mount
  useEffect(() => {
    const reactions = getMyReactions()[post.id] ?? [];
    setMine(reactions.includes("heart") || reactions.includes("felt"));
  }, [post.id]);

  // Keep local counter in sync with post prop changes
  useEffect(() => {
    setHeartCount((post.heart_count || 0) + (post.felt_count || 0));
  }, [post.heart_count, post.felt_count]);

  async function handleHeart(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const wasOn = mine;
    const delta = wasOn ? -1 : 1;
    const newCount = Math.max(0, heartCount + delta);

    if (!wasOn) {
      navigator.vibrate?.(12);
      const newBursts = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i,
        dx: (Math.random() - 0.5) * 36,
      }));
      setBursts((b) => [...b, ...newBursts]);
      setTimeout(() => {
        setBursts((b) => b.filter((x) => !newBursts.some((nb) => nb.id === x.id)));
      }, 1000);
    }

    // Optimistic UI updates
    setMine(!wasOn);
    setHeartCount(newCount);
    onPatch?.(post.id, {
      heart_count: Math.max(0, (post.heart_count || 0) + delta),
    });

    const myReactions = getMyReactions()[post.id] ?? [];
    const targetKind = myReactions.includes("felt") && !myReactions.includes("heart") ? "felt" : "heart";

    const { data, error } = await supabase.rpc("react_to_post", {
      p_post_id: post.id,
      p_kind: targetKind,
      p_device: getDeviceToken(),
    });
    setBusy(false);

    if (error || !data?.[0]) {
      // Rollback on failure
      setMine(wasOn);
      setHeartCount(heartCount);
      onPatch?.(post.id, {
        heart_count: post.heart_count,
        felt_count: post.felt_count,
      });
      return;
    }

    const res = data[0] as { felt: number; heart: number; listening: number; active: boolean };
    setMyReaction(post.id, targetKind, res.active);
    setMine(res.active);
    setHeartCount((res.heart || 0) + (res.felt || 0));
    onPatch?.(post.id, {
      felt_count: res.felt,
      heart_count: res.heart,
      listening_count: res.listening,
    });
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.05, ease: "easeOut" }}
      className="flex"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigator.vibrate?.(8);
          onOpen(post);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigator.vibrate?.(8);
            onOpen(post);
          }
        }}
        aria-label={`${isOpened ? "Re-read" : "Read"} a ${cat.label.toLowerCase()} letter from ${place}${post.trigger_warning ? " (sealed with a note)" : ""}`}
        className={`group relative flex w-full cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all sm:p-5 select-none ${
          isOpened
            ? "border-white/[0.06] bg-[#0c222e]/50 opacity-75 hover:opacity-100"
            : isNew
            ? "border-sand/35 bg-[#0e2736] shadow-sm hover:-translate-y-0.5 hover:border-sand/60"
            : "border-white/[0.09] bg-[#0c222e]/85 shadow-sm hover:-translate-y-0.5 hover:border-sand/40 hover:bg-[#102b3a]"
        }`}
      >
        {/* Top: Mood badge + Origin & Time */}
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: `${cat.color}18`,
                color: cat.color,
                border: `1px solid ${cat.color}33`,
              }}
            >
              <Bottle color={cat.color} height={16} uncorked={isOpened} />
              <span>{cat.label}</span>
            </span>

            <div className="flex items-center gap-1.5">
              {isNew && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sand/30 bg-sand/15 px-2 py-0.5 text-[10px] font-semibold text-sand">
                  ✦ New arrival
                </span>
              )}
              <span className="truncate text-[11px] text-mist/80">
                {place} · {timeAgo(post.created_at)}
              </span>
            </div>
          </div>

          {/* Letter excerpt or sealed notice */}
          <div className="mt-3.5">
            {post.trigger_warning && !isOpened ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-coral/20 bg-coral/[0.06] p-2.5 text-xs text-foam/90">
                <WaxSeal color="#b4563f" emoji="🤍" size={24} />
                <span className="leading-snug">
                  <strong className="font-semibold text-coral">Sealed letter:</strong>{" "}
                  {post.trigger_warning}
                </span>
              </div>
            ) : (
              <p
                dir="auto"
                className={`line-clamp-3 text-sm leading-relaxed text-foam/90 transition-colors group-hover:text-foam ${
                  isThaana ? "font-sans leading-loose text-right" : "font-serif text-[14.5px]"
                }`}
              >
                {post.body}
              </p>
            )}
          </div>
        </div>

        {/* Foot: Read prompt & Reactions */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-mist">
          <span className="font-medium text-sand/80 transition-colors group-hover:text-sand">
            {isOpened ? "Read letter →" : "Open letter →"}
          </span>

          <div className="flex items-center gap-2">
            {/* Direct Heart React Button */}
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={handleHeart}
                aria-label={mine ? `Remove heart (${heartCount})` : `Heart this letter (${heartCount})`}
                aria-pressed={mine}
                title={mine ? "Hearted by you · tap to remove" : "Heart this letter"}
                className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  mine
                    ? "border border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-sm"
                    : "border border-white/10 bg-white/[0.04] text-mist hover:border-sand/40 hover:bg-white/10 hover:text-foam"
                }`}
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 transition-colors"
                  initial={false}
                  animate={{ scale: mine ? [1, 1.35, 1] : 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  fill={mine ? "#f43f5e" : "none"}
                  stroke={mine ? "#f43f5e" : "currentColor"}
                  strokeWidth={mine ? "1.5" : "2"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </motion.svg>
                {heartCount > 0 && <span className="tabular-nums font-semibold">{heartCount}</span>}
              </motion.button>

              {/* Floating hearts celebration burst */}
              {bursts.map((b) => (
                <motion.span
                  key={b.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-xs"
                  initial={{ opacity: 1, y: 0, x: 0, scale: 0.6 }}
                  animate={{ opacity: 0, y: -26, x: b.dx, scale: 1.15 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  ❤️
                </motion.span>
              ))}
            </div>

            {post.comment_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-mist/80" title="Kind notes left">
                <span className="text-[10px]">💬</span>
                <span>{post.comment_count}</span>
              </span>
            )}
            {heartCount === 0 && post.comment_count === 0 && (
              <span className="text-[10px] text-mist/50">New arrival</span>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
