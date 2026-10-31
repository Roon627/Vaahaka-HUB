"use client";
import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { ATOLL_BY_CODE, CATEGORIES, type CategoryId } from "@/lib/constants";
import BottleCard from "./BottleCard";
import FeedBar from "./FeedBar";
import StickyNote from "./StickyNote";
import SoulsOnline from "./SoulsOnline";
import { useSea } from "./SeaProvider";

const WATER = "rgba(8, 26, 38, 0.75)";

/** Subtle oceanic waterline dividing the surface from the shore collection. */
function Surface() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-12 -translate-y-full overflow-hidden">
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        className="h-full w-full opacity-60"
      >
        <path
          d="M0 24 Q300 48 600 24 T1200 24 V48 H0 Z"
          fill={WATER}
        />
      </svg>
    </div>
  );
}

/** Placeholder card skeleton while the first page loads. */
function BottleSkeleton() {
  return (
    <li aria-hidden className="flex">
      <div className="flex w-full flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#0c222e]/60 p-5">
        <div>
          <div className="flex items-center justify-between">
            <span className="h-5 w-20 animate-pulse rounded-full bg-white/[0.08]" />
            <span className="h-4 w-24 animate-pulse rounded bg-white/[0.05]" />
          </div>
          <div className="mt-4 space-y-2">
            <span className="block h-4 w-full animate-pulse rounded bg-white/[0.07]" />
            <span className="block h-4 w-4/5 animate-pulse rounded bg-white/[0.07]" />
            <span className="block h-4 w-2/3 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-3">
          <span className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
          <span className="h-3 w-10 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
    </li>
  );
}

/**
 * The feed:
 * - Serene hero: The tactile Ruled Notepad where letters can be read and torn away.
 * - Grounded shore: Actual readable letter cards with human excerpts, mood seals, and origin tags.
 * - Filterable by mood and atoll, with keyset infinite scroll.
 */
export default function DumpingGround() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    openWriter,
    openRandom,
    finding,
    openPost,
    onPosted,
    arrivals,
    clearArrivals,
    previousVisit,
    opened,
    newArrivalsCount,
    setNewArrivalsCount,
    filterNewArrivals,
    setFilterNewArrivals,
  } = useSea();

  const catParam = params.get("cat");
  const category = CATEGORIES.some((c) => c.id === catParam) ? (catParam as CategoryId) : null;
  const atollParam = params.get("atoll");
  const atoll = atollParam && ATOLL_BY_CODE[atollParam] ? atollParam : null;

  const { posts, loading, done, error, loadMore, prepend, patch, reload } = usePosts({ category, atoll });

  // Calculate new letters arrived since the visitor's previous visit
  const newPosts = useMemo(() => {
    if (!previousVisit) return [];
    const visitDate = new Date(previousVisit);
    return posts.filter((p) => new Date(p.created_at) > visitDate && !opened.has(p.id));
  }, [posts, previousVisit, opened]);

  // Sync count to sea context so the Nav Menu also displays the high tide count
  useEffect(() => {
    setNewArrivalsCount(newPosts.length);
  }, [newPosts.length, setNewArrivalsCount]);

  // Filtered letters if returning visitor activated "View new arrivals"
  const visiblePosts = filterNewArrivals && newPosts.length > 0 ? newPosts : posts;

  // New letters sent from anywhere land at the top of this feed.
  useEffect(() => {
    onPosted(prepend);
    return () => onPosted(null);
  }, [onPosted, prepend]);

  // Update query params.
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  // Infinite scroll sentinel.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const open = (p: typeof posts[number]) =>
    openPost(
      p,
      (c) =>
        patch(p.id, {
          felt_count: c.felt,
          heart_count: c.heart,
          listening_count: c.listening,
        }),
      posts
    );

  return (
    <section className="w-full">
      {/* ---------------------------------------------------------- hero */}
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:px-10 md:pb-20 lg:pb-24 lg:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="relative z-10">
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.75rem)] font-light leading-[1.05] tracking-tight text-foam">
              Say it <br />
              <span className="font-serif italic text-sand">to the sea.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-mist">
              A quiet, anonymous sanctuary for Maldivians to write down what they are carrying.
              No names, no accounts. Only the sea listens.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => openWriter({ atoll, category })}
                className="shore-primary"
              >
                Write a letter <span aria-hidden>↗</span>
              </button>
              <button
                onClick={openRandom}
                disabled={finding}
                className="shore-secondary disabled:opacity-50"
              >
                {finding ? "Uncorking a letter…" : "Surprise me"} <span aria-hidden>↝</span>
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mist/80">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sand/60" />
                Anonymous & free
              </span>
              <span className="text-white/20">·</span>
              <SoulsOnline />
              {previousVisit && newPosts.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <button
                    onClick={() => {
                      setFilterNewArrivals(true);
                      document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-1 font-medium text-sand hover:underline"
                  >
                    <span>✦ {newPosts.length} new since your last visit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Ruled Notepad: Clean tactile hero element */}
          <div className="relative z-20 flex justify-center lg:justify-end">
            <StickyNote />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ shore feed */}
      <div id="bottles" className="relative min-h-[60vh] scroll-mt-24 border-t border-white/[0.06] pb-24" style={{ background: WATER }}>
        <Surface />

        <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight text-foam sm:text-3xl">Washed ashore</h2>
              <p className="mt-1 text-sm text-mist">Real thoughts released from across the islands. Tap any letter to read.</p>
            </div>
          </div>
          <FeedBar
            category={category}
            atoll={atoll}
            onCategory={(c) => setParam("cat", c)}
            onAtoll={(a) => setParam("atoll", a)}
          />
        </div>

        {/* Creative Revisit Tide Banner */}
        <AnimatePresence>
          {previousVisit && newPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto mt-6 max-w-7xl px-5 sm:px-8"
            >
              <div className="relative overflow-hidden rounded-2xl border border-sand/40 bg-gradient-to-r from-[#0d2634] via-[#112f42] to-[#0d2634] p-4 sm:p-5 shadow-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand/15 text-lg text-sand shadow-inner">
                      🌊
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base font-medium text-foam">
                          The tide washed ashore {newPosts.length} new {newPosts.length === 1 ? "letter" : "letters"}
                        </h3>
                        <span className="rounded-full border border-sand/30 bg-sand/15 px-2.5 py-0.5 text-[10px] font-bold text-sand">
                          Since your last visit
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-mist">
                        Quiet thoughts released from across the islands while you were away.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-12 sm:pl-0">
                    <button
                      onClick={() => setFilterNewArrivals(!filterNewArrivals)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        filterNewArrivals
                          ? "bg-sand text-abyss shadow-md"
                          : "border border-sand/40 bg-sand/15 text-sand hover:bg-sand/25"
                      }`}
                    >
                      {filterNewArrivals ? "Showing new arrivals ✓" : `View new arrivals (${newPosts.length})`}
                    </button>
                    {filterNewArrivals && (
                      <button
                        onClick={() => setFilterNewArrivals(false)}
                        className="text-xs text-mist hover:text-foam underline underline-offset-4"
                      >
                        Show all letters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live new arrivals banner (sent while tab is open) */}
        <AnimatePresence>
          {arrivals > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex justify-center"
            >
              <button
                onClick={() => {
                  clearArrivals();
                  reload();
                  document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-full border border-sand/40 bg-sand/15 px-5 py-2.5 text-xs font-semibold text-sand transition hover:bg-sand/25"
              >
                <span>🌊</span> {arrivals} new {arrivals === 1 ? "letter" : "letters"} arrived, tap to view
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shore Letter Grid */}
        <ul className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-4 px-5 sm:grid-cols-2 sm:gap-5 sm:px-8 lg:grid-cols-3">
          {visiblePosts.map((p, i) => (
            <BottleCard key={p.id} post={p} index={i} onOpen={open} />
          ))}
          {loading && posts.length === 0 && Array.from({ length: 6 }, (_, i) => <BottleSkeleton key={i} />)}
        </ul>

        {/* Infinite scroll sentinel & status states */}
        <div ref={sentinel} className="px-4 py-14 text-center text-sm text-mist">
          {error ? (
            <span className="text-coral">The tide pulled us away: {error}</span>
          ) : loading && posts.length > 0 ? (
            <span className="inline-flex items-center gap-2 font-serif text-lg text-foam/80">
              <span className="animate-spin text-sand">✦</span> Reading the deeper waters…
            </span>
          ) : done ? (
            posts.length === 0 ? (
              <div className="mx-auto max-w-sm rounded-2xl border border-white/[0.08] bg-[#0c222e]/60 p-8 text-center">
                <p className="font-display text-lg text-foam">
                  {category || atoll ? "No letters found here yet" : "The shore is quiet"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-mist">
                  {category || atoll ? "Try choosing another feeling or island, or " : "Be the first to "}
                  <button
                    className="font-medium text-sand underline underline-offset-4"
                    onClick={() => openWriter({ atoll, category })}
                  >
                    leave a letter for the sea
                  </button>
                  .
                </p>
              </div>
            ) : (
              <span className="font-serif text-sm tracking-wide text-mist/70">
                You have reached the calm of the shoreline. 🐚
              </span>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
