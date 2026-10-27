"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { ATOLL_BY_CODE, CATEGORIES, type CategoryId } from "@/lib/constants";
import CategoryFilter from "./CategoryFilter";
import PostCard from "./PostCard";
import DropStory from "./DropStory";

/**
 * The "Unjudged" feed.
 *  - Filters live in the URL (?cat=horror&atoll=HA) so the map can deep-link here.
 *  - Masonry via CSS columns (no JS layout), infinite scroll via IntersectionObserver.
 *  - New stories appear at the top instantly after dropping.
 */
export default function DumpingGround() {
  const router = useRouter();
  const params = useSearchParams();

  const catParam = params.get("cat");
  const category = CATEGORIES.some((c) => c.id === catParam) ? (catParam as CategoryId) : null;
  const atollParam = params.get("atoll");
  const atoll = atollParam && ATOLL_BY_CODE[atollParam] ? atollParam : null;

  const { posts, loading, done, error, loadMore, prepend } = usePosts({ category, atoll });
  const [composing, setComposing] = useState(false);

  // Update one query param, keep the rest.
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  // Infinite scroll sentinel: fetch the next page 400px before the bottom.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-32">
      <div className="py-8 text-center">
        <h1 className="font-display text-3xl text-foam sm:text-4xl">Let it out. <span className="text-glow">Nobody's judging.</span></h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-mist">
          Anonymous stories from across the Maldives. No accounts, no downvotes, no comments — just people listening.
        </p>
        <button
          onClick={() => setComposing(true)}
          className="mt-5 rounded-full bg-glow px-6 py-2.5 text-sm font-semibold text-abyss shadow-glow transition hover:brightness-110"
        >
          Drop a story
        </button>
      </div>

      <div className="sticky top-14 z-20 -mx-4 bg-abyss/80 px-4 py-2 backdrop-blur">
        <CategoryFilter idPrefix="feed" value={category} onChange={(c) => setParam("cat", c)} />
        {atoll && (
          <button onClick={() => setParam("atoll", null)} className="mt-2 rounded-full border border-glow/40 px-3 py-1 text-xs text-glow">
            📍 {ATOLL_BY_CODE[atoll].name} ✕
          </button>
        )}
      </div>

      {/* Masonry: 1 / 2 / 3 columns. break-inside-avoid lives on the card. */}
      <div className="mt-4 columns-1 gap-4 md:columns-2 lg:columns-3">
        <AnimatePresence initial={false}>
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </AnimatePresence>
      </div>

      <div ref={sentinel} className="py-8 text-center text-sm text-mist">
        {error ? (
          <span className="text-coral">Couldn't reach the shore: {error}</span>
        ) : loading ? (
          <span className="animate-pulse">Listening…</span>
        ) : done ? (
          posts.length === 0 ? (
            <>It's quiet here. <button className="text-glow underline underline-offset-4" onClick={() => setComposing(true)}>Be the first to share.</button></>
          ) : "You've reached the shore. 🌊"
        ) : null}
      </div>

      <Link href="/map" className="fixed bottom-5 right-5 z-30 rounded-full border border-slate2 bg-deep/90 px-4 py-2 text-sm text-foam backdrop-blur hover:border-glow/50">
        🗺️ Heatmap
      </Link>

      <AnimatePresence>
        {composing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setComposing(false)}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate2 bg-deep p-6 sm:rounded-3xl"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DropStory
                defaultAtoll={atoll}
                defaultCategory={category}
                onClose={() => setComposing(false)}
                onPosted={(p) => { prepend(p); setComposing(false); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
