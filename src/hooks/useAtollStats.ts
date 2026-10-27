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
    return () => { cancelled = true; };
  }, []);

  return { stats, loading };
}
