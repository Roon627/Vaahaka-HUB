"use client";
import { motion } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/lib/types";
import { useSea } from "./SeaProvider";
import Bottle from "./Bottle";
import WaxSeal from "./WaxSeal";

const THAANA = /[\u0780-\u07BF]/;

interface Props {
  post: Post;
  index: number;
  onOpen: (post: Post) => void;
}

/**
 * Shore Letter Card:
 * Instead of an empty cartoon bottle that hides the confession, each card is a
 * tactile letter washed ashore. It shows the mood, origin atoll/island, and a
 * genuine excerpt of the words (or a respectful wax seal if content-warned).
 */
export default function BottleCard({ post, index, onOpen }: Props) {
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

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.05, ease: "easeOut" }}
      className="flex"
    >
      <button
        onClick={() => {
          navigator.vibrate?.(8);
          onOpen(post);
        }}
        aria-label={`${isOpened ? "Re-read" : "Read"} a ${cat.label.toLowerCase()} letter from ${place}${post.trigger_warning ? " (sealed with a note)" : ""}`}
        className={`group relative flex w-full flex-col justify-between rounded-2xl border p-4 text-left transition-all sm:p-5 ${
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

          <div className="flex items-center gap-3">
            {post.felt_count > 0 && (
              <span className="inline-flex items-center gap-1" title="Felt by readers">
                <span className="text-[10px]">🤍</span>
                <span>{post.felt_count}</span>
              </span>
            )}
            {post.comment_count > 0 && (
              <span className="inline-flex items-center gap-1" title="Kind notes left">
                <span className="text-[10px]">💬</span>
                <span>{post.comment_count}</span>
              </span>
            )}
            {post.felt_count === 0 && post.comment_count === 0 && (
              <span className="text-[10px] text-mist/60">New arrival</span>
            )}
          </div>
        </div>
      </button>
    </motion.li>
  );
}
