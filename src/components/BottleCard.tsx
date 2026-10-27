"use client";
import { motion } from "framer-motion";
import { ATOLL_BY_CODE, CATEGORY_BY_ID } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/lib/types";
import Bottle from "./Bottle";
import { useSea } from "./SeaProvider";
import WaxSeal from "./WaxSeal";

interface Props { post: Post; index: number; onOpen: (post: Post) => void }

/** The glass plank every bottle stands on. Adjacent cells overlap by the grid gap, so a row reads as one shelf. */
const SHELF = "-mx-[7px] h-2.5 self-stretch rounded-sm bg-gradient-to-b from-[#7cc4c0]/45 to-[#2a6f78]/45 shadow-[0_10px_18px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.28)]";

/**
 * One sealed bottle, standing still on its shelf: no bobbing, no random offsets. It only moves when you
 * touch it (lifts and tilts). The message is NOT shown: just where it came from, how it feels and how
 * long it has been drifting; uncork it to read. Opened bottles stay on the shelf, uncorked and faded.
 * The caption always has the same three lines, so rows never jump around.
 */
export default function BottleCard({ post, index, onOpen }: Props) {
  const { opened } = useSea();
  const isOpened = opened.has(post.id);
  const cat = CATEGORY_BY_ID[post.category];
  const atoll = ATOLL_BY_CODE[post.atoll_code];
  const place = post.island || atoll?.name || post.atoll_code;

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.04, ease: "easeOut" }}
      className="flex"
    >
      <button
        onClick={() => { navigator.vibrate?.(8); onOpen(post); }}
        aria-label={`${isOpened ? "Reopen" : "Open"} a ${cat.label.toLowerCase()} message from ${place}${post.trigger_warning ? " (sealed with a content note)" : ""}`}
        className="group flex w-full flex-col items-center rounded-2xl pb-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow/60"
      >
        <span className="relative flex h-[8.75rem] w-full items-end justify-center">
          {/* a pool of the mood's light under the bottle, shown on hover / press */}
          <span aria-hidden className="absolute bottom-0 h-6 w-20 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-70 group-active:opacity-80" style={{ background: cat.color }} />
          <span className={`relative block origin-bottom transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:rotate-[5deg] group-active:scale-95 ${isOpened ? "opacity-50" : ""}`}>
            <Bottle color={cat.color} height={128} uncorked={isOpened} glow={!isOpened} />
          </span>
          {post.trigger_warning && !isOpened && (
            <span className="absolute right-[18%] top-3" title="Sealed with a content note"><WaxSeal color="#b4563f" emoji="🤍" size={22} /></span>
          )}
        </span>

        <span aria-hidden className={SHELF} />

        <span className="mt-2.5 block max-w-full truncate px-1 font-display text-[15px] text-foam/90 transition-colors group-hover:text-foam">{place}</span>
        <span className="block max-w-full truncate px-1 text-[11px] text-mist">{cat.emoji} {cat.label} · {timeAgo(post.created_at)}</span>
        <span className="mt-0.5 block text-[11px] text-mist/70">{isOpened ? "opened" : post.trigger_warning ? "sealed" : `🕯️ ${post.listening_count} listening`}</span>
      </button>
    </motion.li>
  );
}
