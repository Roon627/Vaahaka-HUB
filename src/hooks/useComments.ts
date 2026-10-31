"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getDeviceToken,
  getMyCommentHearts,
  setMyCommentHeart,
  getCommentHeartCounts,
  setCommentHeartCount,
} from "@/lib/device";
import type { Comment } from "@/lib/types";

/** Anonymous notes under one letter. Posting goes through add_comment(), where the word filter + limits live. */
export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState<Set<string>>(new Set());
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setHearts(getMyCommentHearts());
    setHeartCounts(getCommentHeartCounts());
  }, []);

  // Listen to realtime comment hearts across users on the post channel
  useEffect(() => {
    const ch = supabase.channel(`comments-${postId}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "comment_heart" }, ({ payload }) => {
      const { commentId, delta } = (payload ?? {}) as { commentId: string; delta: number };
      if (!commentId || typeof delta !== "number") return;
      setHeartCounts((prev) => {
        const next = { ...prev, [commentId]: Math.max(0, (prev[commentId] ?? 0) + delta) };
        setCommentHeartCount(commentId, next[commentId]);
        return next;
      });
    }).subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [postId]);

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

  /** Toggle heart reaction on an anonymous comment note */
  const toggleHeart = useCallback((commentId: string) => {
    navigator.vibrate?.(12);
    setHearts((prev) => {
      const next = new Set(prev);
      const isHearted = next.has(commentId);
      if (isHearted) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      setMyCommentHeart(commentId, !isHearted);

      const delta = isHearted ? -1 : 1;
      setHeartCounts((counts) => {
        const currentCount = counts[commentId] ?? (isHearted ? 1 : 0);
        const newCount = Math.max(0, currentCount + delta);
        setCommentHeartCount(commentId, newCount);
        return { ...counts, [commentId]: newCount };
      });

      // Broadcast to other readers of this post
      try {
        supabase.channel(`comments-${postId}`).send({
          type: "broadcast",
          event: "comment_heart",
          payload: { commentId, delta },
        });
      } catch {
        /* ignore broadcast failure */
      }

      return next;
    });
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

  return { comments, loading, add, hide, hearts, heartCounts, toggleHeart };
}
