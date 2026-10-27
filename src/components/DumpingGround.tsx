"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { ATOLL_BY_CODE, CATEGORIES, type CategoryId } from "@/lib/constants";
import BottleCard from "./BottleCard";
import Bottle from "./Bottle";
import FeedBar from "./FeedBar";
import { useSea } from "./SeaProvider";
import SkyLine from "./SkyLine";
import { supabase } from "@/lib/supabase";

const WAVE = "M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 T1500 60 T1800 60 T2100 60 T2400 60 V140 H0 Z";
/** Colour of the water body below the surface. The front wave uses the same value so there's no seam. */
const WATER = "rgba(9,36,49,0.62)";

/** The waterline: three drifting waves. Back waves fade to transparent so only the front one meets the water body. */
function Surface() {
  const layers = [
    { cls: "animate-wave3", h: 88, from: "rgba(150,210,215,0.16)" },
    { cls: "animate-wave2", h: 68, from: "rgba(90,160,175,0.30)" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 -translate-y-[calc(100%-1px)] overflow-hidden">
      {layers.map((l, i) => (
        <svg key={i} viewBox="0 0 2400 140" preserveAspectRatio="none" className={`absolute bottom-0 left-0 w-[200%] ${l.cls}`} style={{ height: l.h }}>
          <defs>
            <linearGradient id={`surf${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={l.from} /><stop offset=".7" stopColor={l.from} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={WAVE} fill={`url(#surf${i})`} />
        </svg>
      ))}
      <svg viewBox="0 0 2400 140" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-[200%] animate-wave1" style={{ height: 52 }}>
        <path d={WAVE} fill={WATER} />
      </svg>
    </div>
  );
}

/** A little depth gauge on the right edge: you really are diving. */
function DepthGauge() {
  const { scrollY } = useScroll();
  const [m, setM] = useState(0);
  useMotionValueEvent(scrollY, "change", (v) => setM(Math.round(v / 40)));
  const pct = Math.min(m / 90, 1) * 100;
  return (
    <div aria-hidden className="pointer-events-none fixed right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2 text-[10px] text-mist/80 lg:flex">
      <span>0 m</span>
      <div className="relative h-44 w-px bg-white/15">
        <motion.span className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-glow shadow-glow" animate={{ top: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
      <span className="tabular-nums text-glow">{m} m</span>
    </div>
  );
}

/** Placeholder bottle while the first page loads. */
function BottleSkeleton() {
  return (
    <li aria-hidden className="flex flex-col items-center">
      <span className="flex h-[8.75rem] w-full items-end justify-center"><span className="h-28 w-14 animate-pulse rounded-[45%_45%_40%_40%] border border-white/10 bg-white/[0.04]" /></span>
      <span className="-mx-1.5 h-2.5 self-stretch rounded-sm bg-white/[0.08]" />
      <span className="mt-3 h-4 w-24 animate-pulse rounded bg-white/[0.07]" />
      <span className="mt-1.5 h-3 w-16 animate-pulse rounded bg-white/[0.05]" />
    </li>
  );
}

/**
 * The feed.
 *  - A short surface (moon, headline, one button) — the bottles are on the first screen.
 *  - Bottles drift in a dense field; the message stays hidden until you uncork one.
 *  - Filters live in the URL (?cat=horror&atoll=HA) so the map can deep-link here.
 *  - Infinite scroll = diving deeper, via IntersectionObserver.
 */
export default function DumpingGround() {
  const router = useRouter();
  const params = useSearchParams();
  const { openWriter, openPost, onPosted, arrivals, clearArrivals } = useSea();

  const catParam = params.get("cat");
  const category = CATEGORIES.some((c) => c.id === catParam) ? (catParam as CategoryId) : null;
  const atollParam = params.get("atoll");
  const atoll = atollParam && ATOLL_BY_CODE[atollParam] ? atollParam : null;

  const { posts, loading, done, error, loadMore, prepend, patch, reload } = usePosts({ category, atoll });

  // New letters sent from anywhere (this page's button, the nav) land at the top of this feed.
  useEffect(() => { onPosted(prepend); return () => onPosted(null); }, [onPosted, prepend]);

  // "N bottles washed ashore today": a live nudge that the sea is alive.
  const [today, setToday] = useState(0);
  useEffect(() => {
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString())
      .then(({ count }) => setToday(count ?? 0));
  }, []);

  // A greeting that notices the hour. Set after mount so SSR and client agree.
  const [hello, setHello] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setHello(h >= 23 || h < 4 ? "Can't sleep? You're not alone." : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.");
  }, []);

  // Update one query param, keep the rest.
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  // Infinite scroll sentinel: fetch the next page 600px before the bottom.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const headline = ["Say", "it", "to", "the", "sea."];
  const open = (p: typeof posts[number]) =>
    openPost(p, (c) => patch(p.id, { felt_count: c.felt, heart_count: c.heart, listening_count: c.listening }), posts);

  return (
    <section className="w-full">
      <DepthGauge />

      {/* ---------------------------------------------------------- surface */}
      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-14 text-center sm:pt-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }} className="font-hand text-2xl text-sand sm:text-3xl">
          {hello}
        </motion.p>
        <h1 className="mt-1 flex flex-wrap justify-center gap-x-3 font-display text-4xl font-light leading-tight text-foam sm:gap-x-4 sm:text-6xl">
          {headline.map((w, i) => (
            <motion.span
              key={w + i}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={i >= 3 ? "italic text-glow" : ""}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }} className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-foam/70">
          Write what you're carrying, seal it in a bottle, and let it go. Or uncork someone else's and just listen.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
          onClick={() => openWriter({ atoll, category })}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-glow to-sand py-2.5 pl-4 pr-7 text-sm font-semibold text-abyss shadow-glow"
        >
          <span className="-rotate-[25deg]"><Bottle color="#b4563f" height={34} glow={false} /></span>
          Write a message
        </motion.button>
        <SkyLine />
        {today > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-4 text-xs text-mist">
            🍾 {today.toLocaleString()} {today === 1 ? "bottle" : "bottles"} washed ashore today
          </motion.p>
        )}
      </div>

      {/* ------------------------------------------------------------ water */}
      <div className="relative min-h-[60vh] pb-32" style={{ background: WATER }}>
        <Surface />

                <FeedBar category={category} atoll={atoll} onCategory={(c) => setParam("cat", c)} onAtoll={(a) => setParam("atoll", a)} />

        <p className="mt-4 text-center text-xs text-mist/80">Tap a bottle to uncork it</p>
        <AnimatePresence>
          {arrivals > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex justify-center">
              <button onClick={() => { clearArrivals(); reload(); window.scrollTo({ top: 380, behavior: "smooth" }); }}
                className="min-h-11 rounded-full bg-gradient-to-r from-glow to-sand px-5 text-sm font-semibold text-abyss shadow-glow">
                🍾 {arrivals} new {arrivals === 1 ? "bottle" : "bottles"}, tap to see
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the shelf: bottles stand still; only touch moves them */}
        <ul className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-x-3 gap-y-9 px-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {posts.map((p, i) => <BottleCard key={p.id} post={p} index={i} onOpen={open} />)}
          {loading && posts.length === 0 && Array.from({ length: 6 }, (_, i) => <BottleSkeleton key={i} />)}
        </ul>

        <div ref={sentinel} className="px-4 py-14 text-center text-sm text-mist">
          {error ? (
            <span className="text-coral">The current dragged us off: {error}</span>
          ) : loading && posts.length > 0 ? (
            <span className="inline-flex items-center gap-2 font-hand text-2xl"><img src="/brand/stickers/happy.svg" alt="" width={22} height={26} className="animate-bob" />Fetching more bottles…</span>
          ) : done ? (
            posts.length === 0 ? (
              <div className="mx-auto max-w-xs">
                <img src="/brand/stickers/nostalgia.svg" alt="" width={64} height={77} className="mx-auto" />
                <p className="mt-3 font-display text-lg text-foam">{category || atoll ? "No bottles here yet" : "The shelf is empty"}</p>
                <p className="mt-1">{category || atoll ? "Try another mood or place, or " : ""}<button className="text-glow underline underline-offset-4" onClick={() => openWriter({ atoll, category })}>send the first one</button>.</p>
              </div>
            ) : <span className="font-hand text-2xl">That's every bottle. 🐚</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
