"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceToken } from "@/lib/device";
import type { Comment } from "@/lib/types";

/** Anonymous notes under one letter. Posting goes through add_comment(), where the word filter + limits live. */
export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("comments")
      .select("id,post_id,created_at,body")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => { if (!cancelled) { setComments((data ?? []) as Comment[]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [postId]);

  /** Returns an error message to show the person, or null on success. */
  const add = useCallback(async (body: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc("add_comment", { p_post_id: postId, p_body: body, p_device: getDeviceToken() });
    if (error) return error.message; // already phrased kindly by the database
    const row = (data as Comment[] | null)?.[0];
    if (row) setComments((c) => [...c, row]);
    return null;
  }, [postId]);

  /** Hide a note locally (after the reader reports it). */
  const hide = useCallback((id: string) => setComments((c) => c.filter((x) => x.id !== id)), []);

  return { comments, loading, add, hide };
}
