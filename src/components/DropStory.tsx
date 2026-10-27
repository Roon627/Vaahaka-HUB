"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceToken } from "@/lib/device";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLLS, BODY_MAX, BODY_MIN, CATEGORIES, type CategoryId } from "@/lib/constants";
import type { Post } from "@/lib/types";

interface Props {
  defaultAtoll?: string | null;
  defaultCategory?: CategoryId | null;
  onPosted: (post: Post) => void;
  onClose?: () => void;
}

/**
 * Friction-free composer: story + category + atoll are required, island and
 * trigger warning optional. No account, no email — only a local device token
 * is sent (for rate limiting; it is unreadable by other users).
 */
export default function DropStory({ defaultAtoll, defaultCategory, onPosted, onClose }: Props) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(defaultCategory ?? null);
  const [atoll, setAtoll] = useState(defaultAtoll ?? "");
  const [island, setIsland] = useState("");
  const [warn, setWarn] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.trim();
  const valid = trimmed.length >= BODY_MIN && trimmed.length <= BODY_MAX && !!category && !!atoll;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError(null);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        body: trimmed,
        category,
        atoll_code: atoll,
        island: island.trim() || null,
        trigger_warning: warn.trim() || null,
        device_token: getDeviceToken(),
      })
      .select(POST_COLUMNS)
      .single();

    setSending(false);
    if (error || !data) {
      // The rate-limit trigger raises a friendly message; surface it as-is.
      return setError(error?.message ?? "Something went wrong. Your words are still here — try again.");
    }
    onPosted(data as unknown as Post);
  }

  const field = "w-full rounded-xl border border-slate2 bg-tide px-3 py-2 text-sm text-foam placeholder:text-mist/60 focus:border-glow/60 focus:outline-none focus:ring-1 focus:ring-glow/40";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl text-foam">Drop a story</h2>
          <p className="text-xs text-mist">🔒 Anonymous. We store no name, email, or IP with your story.</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close" className="text-mist hover:text-foam">✕</button>}
      </div>

      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          maxLength={BODY_MAX}
          placeholder="Say what you couldn't say out loud…"
          className={`${field} resize-y leading-relaxed`}
          autoFocus
        />
        <div className="mt-1 text-right text-[11px] text-mist">
          {trimmed.length < BODY_MIN ? `at least ${BODY_MIN} characters` : `${body.length}/${BODY_MAX}`}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-wider text-mist">Mood</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = category === c.id;
            return (
              <button
                type="button" key={c.id} onClick={() => setCategory(c.id)} aria-pressed={on}
                className="rounded-full border px-3 py-1.5 text-sm transition"
                style={on ? { borderColor: c.color, background: `${c.color}22`, color: c.color } : { borderColor: "#1c2b3d", color: "#8aa0b6" }}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-wider text-mist">
          Atoll
          <select value={atoll} onChange={(e) => setAtoll(e.target.value)} className={`${field} mt-1 normal-case tracking-normal`}>
            <option value="" disabled>Where did this happen?</option>
            {ATOLLS.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
        </label>
        <label className="block text-xs uppercase tracking-wider text-mist">
          Island <span className="normal-case tracking-normal">(optional)</span>
          <input value={island} onChange={(e) => setIsland(e.target.value)} maxLength={60} placeholder="e.g. Hulhumalé" className={`${field} mt-1 normal-case tracking-normal`} />
        </label>
      </div>

      <label className="block text-xs uppercase tracking-wider text-mist">
        Trigger warning <span className="normal-case tracking-normal">(optional — hides the story behind a gentle gate)</span>
        <input value={warn} onChange={(e) => setWarn(e.target.value)} maxLength={80} placeholder="e.g. violence, self-harm, loss" className={`${field} mt-1 normal-case tracking-normal`} />
      </label>

      {error && <p role="alert" className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}

      <button
        type="submit" disabled={!valid || sending}
        className="w-full rounded-full bg-glow py-3 text-sm font-semibold text-abyss shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {sending ? "Releasing…" : "Release it to the sea"}
      </button>
      <p className="text-center text-[11px] text-mist">If you're in crisis, please reach out to someone you trust or a local helpline.</p>
    </form>
  );
}
