"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getDeviceToken } from "@/lib/device";
import { POST_COLUMNS } from "@/hooks/usePosts";
import { ATOLLS, ATOLL_BY_CODE, BODY_MAX, BODY_MIN, CATEGORIES, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import { norm } from "@/lib/search";
import { useIslands } from "@/lib/islands";
import type { Post } from "@/lib/types";
import Bottle from "./Bottle";
import Combobox, { type Opt } from "./Combobox";
import WaxSeal from "./WaxSeal";
import CrisisNudge from "./CrisisNudge";

interface Props {
  defaultAtoll?: string | null;
  defaultCategory?: CategoryId | null;
  onPosted: (post: Post) => void;
  onClose?: () => void;
}

/**
 * Writing a message in a bottle.
 * Parchment with ruled lines → pick an "ink" (mood) → seal it with wax.
 * On success the bottle arcs across the screen and splashes into the sea
 * before the story joins the feed.
 * No account, no email — only a local device token is sent (rate limiting;
 * unreadable by other users).
 */
export default function DropStory({ defaultAtoll, defaultCategory, onPosted, onClose }: Props) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(defaultCategory ?? null);
  const [atoll, setAtoll] = useState(defaultAtoll ?? "");
  const [island, setIsland] = useState("");
  const [warn, setWarn] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Post | null>(null);

  // Keep the latest callback without restarting the timer on parent re-renders.
  const onPostedRef = useRef(onPosted);
  onPostedRef.current = onPosted;
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => onPostedRef.current(sent), 3000);
    return () => clearTimeout(t);
  }, [sent]);

  // Focus the page straight away on desktop; on phones leave the keyboard down so the whole form is visible first.
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (window.matchMedia("(pointer: fine)").matches) taRef.current?.focus(); }, []);

  const trimmed = body.trim();
  const valid = trimmed.length >= BODY_MIN && trimmed.length <= BODY_MAX && !!category && !!atoll;
  const mood = category ? CATEGORY_BY_ID[category] : null;
  const sealColor = mood?.color ?? "#b4563f";

  // ---- searchable pickers (real data: official atolls + 1,000+ islands) ----
  const islands = useIslands();
  const atollOpts = useMemo<Opt[]>(
    () => ATOLLS.map((a) => ({ key: a.code, label: a.name, badge: a.code, hint: a.aka[0], also: [a.code, ...a.aka] })),
    []
  );
  // With an atoll chosen: only its islands. Without: every island, tagged with its atoll.
  const islandOpts = useMemo<Opt[]>(
    () =>
      islands
        .filter((i) => !atoll || i.atoll === atoll)
        .map((i) => ({ key: `${i.atoll}:${i.name}`, label: i.name, hint: atoll ? undefined : ATOLL_BY_CODE[i.atoll]?.name })),
    [islands, atoll]
  );
  const pickAtoll = (o: Opt | null) => {
    const code = o?.key ?? "";
    setAtoll(code);
    // Drop a previously picked island if it belongs to a different atoll.
    const known = islands.find((i) => norm(i.name) === norm(island));
    if (known && code && known.atoll !== code) setIsland("");
  };
  const pickIsland = (o: Opt | null) => {
    if (!o) return setIsland("");
    setIsland(o.label);
    const code = o.key.split(":")[0];
    if (code && code !== atoll) setAtoll(code); // choosing an island fills in its atoll
  };

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
    setSent(data as unknown as Post);
  }

  // ------------------------------------------------------------ sent state --
  if (sent) {
    const c = CATEGORY_BY_ID[sent.category];
    return (
      <div className="relative flex min-h-[26rem] flex-col items-center justify-center overflow-hidden text-center">
        {/* The bottle arcs out over the water... */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          initial={{ x: -260, y: 120, rotate: -40, scale: 0.7, opacity: 0 }}
          animate={{
            x: [-260, -60, 130, 190],
            y: [120, -120, -40, 30],
            rotate: [-40, 10, 70, 95],
            scale: [0.7, 1.1, 0.9, 0.7],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 1.9, times: [0, 0.35, 0.8, 1], ease: "easeInOut" }}
        >
          <Bottle color={c.color} height={110} />
        </motion.div>
        {/* ...and lands with a splash. */}
        {[0, 0.18, 0.36].map((d) => (
          <motion.span
            key={d}
            className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full border"
            style={{ marginLeft: 190 - 32, marginTop: 30 - 8, borderColor: c.color, transformOrigin: "center", height: 20 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3.2], opacity: [0.8, 0] }}
            transition={{ delay: 1.7 + d, duration: 1.2, ease: "easeOut" }}
          />
        ))}
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }} className="mt-56 font-display text-3xl font-light text-foam">
          It's out there now.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }} className="mt-2 font-hand text-2xl text-sand">
          Someone will find it, and they'll listen.
        </motion.p>
      </div>
    );
  }

  // Underline-only fields feel like filling in a form by hand.
  const field =
    "w-full border-b border-ink/30 bg-transparent px-1 py-2 text-[15px] text-ink placeholder:text-inksoft/60 transition focus:border-ink focus:outline-none";

  return (
    <form onSubmit={submit} className="paper sheet sheet-pad p-5 pt-3 sm:p-10">
      <span aria-hidden className="mx-auto mb-2 block h-1.5 w-12 rounded-full bg-ink/20 sm:hidden" />
      <div className="flex items-start justify-between">
        <p className="font-hand text-4xl text-ink sm:text-5xl">Dear sea,</p>
        {onClose && <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded-full p-3 text-inksoft transition hover:bg-ink/10 hover:text-ink">✕</button>}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        maxLength={BODY_MAX}
        placeholder="Take your time. Say what you couldn't say out loud…"
        className="ruled mt-1 w-full resize-y bg-transparent font-display text-[17px] text-ink placeholder:text-inksoft/50 focus:outline-none"
        style={{ caretColor: sealColor }}
        ref={taRef}
      />
      <CrisisNudge text={body} />
      <div className="mt-1 text-right text-[11px] text-inksoft">
        {trimmed.length < BODY_MIN ? `a few more words (${BODY_MIN} minimum)` : `${body.length}/${BODY_MAX}`}
      </div>

      {/* Ink wells: the mood */}
      <fieldset className="mt-5">
        <legend className="font-hand text-2xl text-ink">Choose your ink{mood && <span className="text-inksoft"> · {mood.label}</span>}</legend>
        <div className="mt-1 flex flex-wrap items-center">
          {CATEGORIES.map((c) => {
            const on = category === c.id;
            return (
              <motion.button
                type="button" key={c.id} onClick={() => setCategory(c.id)} aria-pressed={on} aria-label={c.label} title={c.label}
                whileHover={{ y: -3, scale: 1.08 }} whileTap={{ scale: 0.92 }}
                animate={{ scale: on ? 1.15 : 1, opacity: category && !on ? 0.55 : 1 }}
                className="rounded-full p-1.5"
                style={{ boxShadow: on ? `0 0 0 2px #3a2d1f, 0 0 0 5px ${c.color}77` : "none" }}
              >
                <WaxSeal color={c.color} emoji={c.emoji} size={34} />
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Combobox
          label="Where, in the atolls?"
          placeholder="Search — Kaafu, Ari, Addu…"
          options={atollOpts}
          value={atoll ? ATOLL_BY_CODE[atoll]?.name ?? "" : ""}
          onSelect={pickAtoll}
          emptyHint="Try the atoll's code or an older name."
        />
        <Combobox
          label={<>Which island? <span className="text-lg text-inksoft">(optional)</span></>}
          placeholder={atoll ? `Search islands in ${ATOLL_BY_CODE[atoll]?.name}` : "Search any island"}
          options={islandOpts}
          value={island}
          onSelect={pickIsland}
          onText={setIsland}
          emptyHint="You can still use what you typed."
        />
      </div>

      <label className="mt-4 block font-hand text-2xl text-ink">
        A note for readers <span className="text-lg text-inksoft">(optional — keeps the letter sealed until they choose to open it)</span>
        <input value={warn} onChange={(e) => setWarn(e.target.value)} maxLength={80} placeholder="e.g. loss, violence, self-harm" className={`${field} mt-0.5 font-sans`} />
      </label>

      {error && <p role="alert" className="mt-4 rounded-xl bg-wax/10 px-4 py-2.5 text-sm text-wax">{error}</p>}

      {/* Seal it */}
      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="max-w-[16rem] text-[11px] leading-relaxed text-inksoft">
          🔒 No name, email or account is attached to your letter. If you're in crisis, please reach out to someone you trust or your local emergency services.
        </p>
        <motion.button
          type="submit" disabled={!valid || sending}
          aria-label="Seal and send"
          whileHover={valid ? { scale: 1.06, rotate: -4 } : undefined} whileTap={valid ? { scale: 0.9 } : undefined}
          animate={sending ? { scale: [1, 0.9, 1] } : { scale: 1 }}
          transition={sending ? { repeat: Infinity, duration: 0.9 } : undefined}
          className="flex shrink-0 flex-col items-center gap-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <WaxSeal color={sealColor} emoji="🌊" size={68} />
          <span className="font-hand text-xl text-ink">{sending ? "sealing…" : "seal & send"}</span>
        </motion.button>
      </div>
    </form>
  );
}
