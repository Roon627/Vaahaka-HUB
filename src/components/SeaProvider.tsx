"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getOpened, markOpened } from "@/lib/device";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLL_BY_CODE, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import Bottle from "./Bottle";
import type { Post, ReactionCounts } from "@/lib/types";
import DropStory from "./DropStory";
import MessageReader from "./MessageReader";

interface WriterOpts { atoll?: string | null; category?: CategoryId | null }

interface Sea {
  /** Open the "Dear sea," composer from anywhere. */
  openWriter: (opts?: WriterOpts) => void;
  /** Open a bottle. `onCounts` lets the caller keep its list in sync with reactions. */
  /** `list` (optional) lets the reader step to the previous/next letter without closing. */
  openPost: (post: Post, onCounts?: (c: ReactionCounts) => void, list?: Post[]) => void;
  /** Open a random bottle (prefers ones you haven't opened). */
  openRandom: () => Promise<void>;
  finding: boolean;
  /** Ids this browser has opened. */
  opened: Set<string>;
  /** The feed registers here to receive a story the moment it's posted. */
  onPosted: (cb: ((p: Post) => void) | null) => void;
  /** People with Ihusaas open right now (Realtime presence; anonymous per-tab ids). */
  online: number;
  /** Bottles other people sent since this tab opened (the feed offers to show them). */
  arrivals: number;
  clearArrivals: () => void;
  /** The most recent bottle someone else sent (null once its animation is over). */
  lastArrival: { id: number; category: CategoryId; atoll: string } | null;
}

interface Arrival { id: number; category: CategoryId; atoll: string }

const Ctx = createContext<Sea | null>(null);
export const useSea = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSea must be used inside <SeaProvider>");
  return c;
};

/**
 * Owns the two full-screen experiences — writing a letter and opening a bottle —
 * so the nav, the feed and the map can all trigger them without prop-drilling.
 */
export function SeaProvider({ children }: { children: React.ReactNode }) {
  const [writer, setWriter] = useState<WriterOpts | null>(null);
  const [reading, setReading] = useState<{ post: Post; onCounts?: (c: ReactionCounts) => void; list?: Post[] } | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [finding, setFinding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const postedCb = useRef<((p: Post) => void) | null>(null);
  const [online, setOnline] = useState(0);
  const [arrivals, setArrivals] = useState(0);
  const [sailing, setSailing] = useState<Arrival | null>(null);
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Live sea: presence (who's here) + broadcast (a bottle was just sent). Only mood + atoll travel, never the text.
  useEffect(() => {
    const me = crypto.randomUUID(); // per tab, not the device token
    const ch = supabase.channel("ihusaas-sea", { config: { presence: { key: me }, broadcast: { self: false } } });
    ch.on("presence", { event: "sync" }, () => setOnline(Object.keys(ch.presenceState()).length))
      .on("broadcast", { event: "bottle" }, ({ payload }) => {
        const a = payload as { category: CategoryId; atoll: string };
        if (!CATEGORY_BY_ID[a.category]) return;
        setArrivals((n) => n + 1);
        setSailing({ id: Date.now(), ...a });
        navigator.vibrate?.([6, 40, 6]);
      })
      .subscribe((status) => { if (status === "SUBSCRIBED") ch.track({ at: Date.now() }); });
    channel.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => { if (!sailing) return; const t = setTimeout(() => setSailing(null), 5200); return () => clearTimeout(t); }, [sailing]);

  useEffect(() => { setOpened(new Set(getOpened())); }, []);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); }, []);

  const openPost = useCallback((post: Post, onCounts?: (c: ReactionCounts) => void, list?: Post[]) => {
    markOpened(post.id);
    setOpened((s) => new Set(s).add(post.id));
    setReading({ post, onCounts, list });
  }, []);

  const openRandom = useCallback(async () => {
    if (finding) return;
    setFinding(true);
    const { data, error } = await supabase.from("posts").select(POST_COLUMNS).order("created_at", { ascending: false }).limit(80);
    setFinding(false);
    const rows = (data ?? []) as unknown as Post[];
    if (error || rows.length === 0) return flash(error ? "The current pulled it away — try again." : "The sea is quiet. No bottles yet.");
    const fresh = rows.filter((p) => !opened.has(p.id));
    const pool = fresh.length ? fresh : rows;
    openPost(pool[Math.floor(Math.random() * pool.length)]);
  }, [finding, opened, openPost, flash]);

  // Home-screen shortcuts (manifest `shortcuts`) land here as ?write=1 / ?surprise=1.
  const randomRef = useRef(openRandom);
  randomRef.current = openRandom;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("write") === "1") setWriter({});
    if (q.get("surprise") === "1") randomRef.current();
    if (["write", "surprise", "source"].some((k) => q.has(k))) {
      ["write", "surprise", "source"].forEach((k) => q.delete(k));
      history.replaceState(null, "", window.location.pathname + (q.toString() ? `?${q}` : ""));
    }
  }, []);

  const value = useMemo<Sea>(
    () => ({
      openWriter: (o) => setWriter(o ?? {}),
      openPost, openRandom, finding, opened,
      onPosted: (cb) => { postedCb.current = cb; },
      online, arrivals, clearArrivals: () => setArrivals(0), lastArrival: sailing,
    }),
    [openPost, openRandom, finding, opened, online, arrivals, sailing]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      <AnimatePresence>
        {reading && (
          <MessageReader
            post={reading.post}
            onStep={(() => {
              const l = reading.list, i = l ? l.findIndex((p) => p.id === reading.post.id) : -1;
              if (!l || i < 0) return undefined;
              return (dir: -1 | 1) => { const n = l[i + dir]; if (n) openPost(n, reading.onCounts, l); };
            })()}
            hasPrev={!!reading.list && reading.list.findIndex((p) => p.id === reading.post.id) > 0}
            hasNext={!!reading.list && reading.list.findIndex((p) => p.id === reading.post.id) < reading.list.length - 1}
            onClose={() => setReading(null)}
            onCounts={(c) => reading.onCounts?.(c)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {writer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/75 backdrop-blur-md sm:items-center sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setWriter(null)}
          >
            <motion.div
              className="max-h-[94dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl sm:max-h-[92dvh] sm:rounded-none"
              initial={{ y: 80, rotate: -2, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 160 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DropStory
                defaultAtoll={writer.atoll}
                defaultCategory={writer.category}
                onClose={() => setWriter(null)}
                onPosted={(p) => { postedCb.current?.(p); setWriter(null); channel.current?.send({ type: "broadcast", event: "bottle", payload: { category: p.category, atoll: p.atoll_code } }); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Someone, somewhere, just sent a bottle: it sails across the top of the screen */}
      <AnimatePresence>
        {sailing && (
          <motion.div key={sailing.id} className="pointer-events-none fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-[55] md:top-24"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="animate-sail"><span className="inline-block -rotate-[70deg]"><Bottle color={CATEGORY_BY_ID[sailing.category].color} height={56} /></span></div>
            <p className="mx-auto mt-1 w-fit rounded-full border border-white/10 bg-abyss/80 px-4 py-1.5 text-xs text-foam backdrop-blur-md">
              A {CATEGORY_BY_ID[sailing.category].label.toLowerCase()} bottle just washed ashore{ATOLL_BY_CODE[sailing.atoll] ? ` from ${ATOLL_BY_CODE[sailing.atoll].name}` : ""} 🌊
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/15 bg-abyss/90 px-5 py-2.5 text-sm text-foam shadow-soft backdrop-blur-md md:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
