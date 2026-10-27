"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PAGE_SIZE, type CategoryId } from "@/lib/constants";
import type { Post } from "@/lib/types";

// Only the columns the anon role may read (see column grants in schema.sql).
export const POST_COLUMNS =
  "id,created_at,body,category,trigger_warning,atoll_code,island,felt_count,heart_count,listening_count";

interface Filters {
  category: CategoryId | null;
  atoll: string | null;
}

/**
 * Keyset-paginated feed: each page asks for rows strictly "older" than the
 * last (created_at, id) we have — stable under concurrent inserts, unlike OFFSET.
 */
export function usePosts({ category, atoll }: Filters) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against out-of-order responses when filters change quickly.
  const generation = useRef(0);
  const inFlight = useRef(false);

  const fetchPage = useCallback(
    async (after: Post | null, gen: number) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      let q = supabase
        .from("posts")
        .select(POST_COLUMNS)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (category) q = q.eq("category", category);
      if (atoll) q = q.eq("atoll_code", atoll);
      if (after) {
        q = q.or(
          `created_at.lt.${after.created_at},and(created_at.eq.${after.created_at},id.lt.${after.id})`
        );
      }
      const { data, error } = await q;
      inFlight.current = false;
      if (gen !== generation.current) return; // stale response
      setLoading(false);
      if (error) return setError(error.message);
      setError(null);
      const rows = (data ?? []) as unknown as Post[];
      setPosts((prev) => (after ? [...prev, ...rows] : rows));
      if (rows.length < PAGE_SIZE) setDone(true);
    },
    [category, atoll]
  );

  // Reset + first page whenever filters change.
  useEffect(() => {
    generation.current += 1;
    inFlight.current = false;
    setPosts([]);
    setDone(false);
    fetchPage(null, generation.current);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (done || inFlight.current || posts.length === 0) return;
    fetchPage(posts[posts.length - 1], generation.current);
  }, [done, posts, fetchPage]);

  /** Optimistically show a freshly dropped story at the top. */
  const prepend = useCallback(
    (p: Post) => {
      const matches = (!category || p.category === category) && (!atoll || p.atoll_code === atoll);
      if (matches) setPosts((prev) => [p, ...prev]);
    },
    [category, atoll]
  );

  return { posts, loading, done, error, loadMore, prepend };
}
