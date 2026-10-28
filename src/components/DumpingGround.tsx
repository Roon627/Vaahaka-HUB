"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { ATOLL_BY_CODE, CATEGORIES, type CategoryId } from "@/lib/constants";
import BottleCard from "./BottleCard";
import Bottle from "./Bottle";
import FeedBar from "./FeedBar";
import StickyNote from "./StickyNote";
import { useSea } from "./SeaProvider";

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
  const { openWriter, openRandom, finding, openPost, onPosted, arrivals, clearArrivals } = useSea();

  const catParam = params.get("cat");
  const category = CATEGORIES.some((c) => c.id === catParam) ? (catParam as CategoryId) : null;
  const atollParam = params.get("atoll");
  const atoll = atollParam && ATOLL_BY_CODE[atollParam] ? atollParam : null;

  const { posts, loading, done, error, loadMore, prepend, patch, reload } = usePosts({ category, atoll });

  // New letters sent from anywhere (this page's button, the nav) land at the top of this feed.
  useEffect(() => { onPosted(prepend); return () => onPosted(null); }, [onPosted, prepend]);

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

  const open = (p: typeof posts[number]) =>
    openPost(p, (c) => patch(p.id, { felt_count: c.felt, heart_count: c.heart, listening_count: c.listening }), posts);

  return (
    <section className="w-full">

      {/* ---------------------------------------------------------- surface */}
      <div className="shore-hero mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-10 md:pb-24 lg:pt-12">
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr] md:gap-12">
          <div className="relative z-10">
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-light leading-[1.04] tracking-[-0.055em] text-foam">
              Say it<br /><em className="text-glow">to the sea.</em>
            </h1>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-mist">
              Leave a feeling. Find a little understanding.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={() => openWriter({ atoll, category })} className="shore-primary">Write a letter <span aria-hidden>↗</span></button>
              <button onClick={openRandom} disabled={finding} className="shore-secondary disabled:opacity-50">{finding ? "Finding a bottle…" : "Surprise me"} <span aria-hidden>↝</span></button>
            </div>
            <p className="mt-5 text-xs tracking-wide text-mist">No account. No name. Just you.</p>
          </div>
          <div className="shore-art">
            <div className="shore-orbit shore-orbit-one hidden md:block" aria-hidden="true" />
            <div className="shore-orbit shore-orbit-two hidden md:block" aria-hidden="true" />
            <span aria-hidden="true" className="absolute right-6 top-6 hidden font-hand text-2xl text-sand/80 md:block">Let it all out.</span>
            <StickyNote />
            <div className="shore-hero-bottle hidden md:block" aria-hidden="true"><Bottle color="#9fe3d0" height={230} glow /></div>
            <span aria-hidden="true" className="absolute -bottom-2 right-10 hidden font-hand text-2xl text-sand/80 md:block">The sea is listening.</span>
            <span aria-hidden="true" className="absolute right-8 top-20 hidden text-xl text-sand md:block">✧</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ water */}
      <div id="bottles" className="relative min-h-[60vh] scroll-mt-24 pb-24" style={{ background: WATER }}>
        <Surface />

        <div className="mx-auto max-w-6xl px-5 pt-3 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight text-foam sm:text-3xl">Washed ashore</h2>
              <p className="mt-2 text-sm text-mist">Tap a bottle to read.</p>
            </div>

          </div>
          <FeedBar category={category} atoll={atoll} onCategory={(c) => setParam("cat", c)} onAtoll={(a) => setParam("atoll", a)} />
        </div>
        <AnimatePresence>
          {arrivals > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex justify-center">
              <button onClick={() => { clearArrivals(); reload(); document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" }); }}
                className="min-h-11 rounded-full bg-gradient-to-r from-glow to-sand px-5 text-sm font-semibold text-abyss shadow-glow">
                🍾 {arrivals} new {arrivals === 1 ? "bottle" : "bottles"}, tap to see
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the shelf: bottles stand still; only touch moves them */}
        <ul className="mx-auto mt-5 grid max-w-6xl grid-cols-2 gap-3 px-5 sm:grid-cols-3 sm:gap-4 sm:px-10 md:grid-cols-4">
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
