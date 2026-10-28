"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/constants";

/** stats["all"][code] and stats[categoryId][code] -> story count. */
export type AtollStats = Record<string, Record<string, number>>;

/**
 * One RPC per mood (+ one for all), fired in parallel, so switching moods on the
 * map is instant and each atoll's mood breakdown is available without another round-trip.
 */
export function useAtollStats() {
  const [stats, setStats] = useState<AtollStats>({});
  const [recent, setRecent] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const keys = ["all", ...CATEGORIES.map((c) => c.id)];
    Promise.all(
      keys.map((k) =>
        supabase.rpc("atoll_counts", { p_category: k === "all" ? null : k }).then(({ data }) => {
          const m: Record<string, number> = {};
          for (const r of (data ?? []) as { atoll_code: string; total: number | string }[]) m[r.atoll_code] = Number(r.total); // bigint arrives as string
          return [k, m] as const;
        })
      )
    ).then((entries) => {
      if (cancelled) return;
      setStats(Object.fromEntries(entries));
      setLoading(false);
    });
    // Letters sent in the last 24h per region: drives the ripples on the map.
    supabase.from("posts").select("atoll_code").gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()).limit(2000)
      .then(({ data }) => {
        if (cancelled) return;
        const m: Record<string, number> = {};
        for (const r of (data ?? []) as { atoll_code: string }[]) m[r.atoll_code] = (m[r.atoll_code] ?? 0) + 1;
        setRecent(m);
      });
    return () => { cancelled = true; };
  }, []);

  return { stats, recent, loading };
}
