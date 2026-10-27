"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CategoryId } from "@/lib/constants";

/** Story count per atoll code, optionally for a single category. */
export function useAtollCounts(category: CategoryId | null) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("atoll_counts", { p_category: category })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const next: Record<string, number> = {};
          for (const r of data as { atoll_code: string; total: number | string }[]) {
            next[r.atoll_code] = Number(r.total); // bigint arrives as string/number
          }
          setCounts(next);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category]);

  return { counts, loading };
}
