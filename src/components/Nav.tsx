"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";
import MoodDock from "./MoodDock";
import { startInstall, useInstall } from "@/lib/pwa";
import { SUGGEST_EVENT } from "@/lib/suggest";
import SuggestionSheet from "./SuggestionSheet";

/* ------------------------------------------------------------------ icons */
const I = (d: React.ReactNode) => function Icon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{d}</svg>;
};
const Waves = I(<><path d="M2 8c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /><path d="M2 13c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /><path d="M2 18c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /></>);
const MapPin = I(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
const Dice = I(<><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /><circle cx="9" cy="15" r="1" fill="currentColor" /></>);
const Pen = I(<><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" /><path d="M14 7l3 3" /></>);
const Info = I(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.8" r=".6" fill="currentColor" /></>);

function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-xl text-foam">
      <img src="/brand/mark.svg" alt="" width={20} height={33} className="h-[33px] w-auto animate-drift" />
      <span>Ihusaas</span>
    </span>
  );
}

/* ------------------------------------------------------------- about menu */
function AboutMenu({ onClose, onSuggest }: { onClose: () => void; onSuggest: () => void }) {
  const { openRandom, finding } = useSea();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const steps = [
    ["✍️", "Write a letter", "No account, no email. Choose an ink for how it feels."],
    ["🍾", "Seal it in a bottle", "It drifts into the sea for strangers to find."],
    ["🕯️", "They only listen", "Readers offer supportive reactions and kind anonymous notes."],
  ];
  return (
    <>
      <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <motion.div
        role="dialog" aria-label="About Ihusaas"
        initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 max-h-[70dvh] overflow-y-auto rounded-3xl border border-white/10 bg-abyss/90 p-5 shadow-soft backdrop-blur-xl md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:w-[22rem]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-foam">How Ihusaas works</h2>
          <button onClick={onSuggest} className="flex shrink-0 items-center gap-1.5 rounded-full border border-glow/30 bg-glow/10 px-3 py-1.5 text-xs font-semibold text-glow transition active:scale-95"><span aria-hidden>💌</span> Send a note</button>
        </div>
        <ol className="mt-3 space-y-3">
          {steps.map(([e, t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 text-lg">{e}</span>
              <span><span className="block text-sm font-medium text-foam">{t}</span><span className="text-[13px] leading-snug text-mist">{d}</span></span>
            </li>
          ))}
        </ol>

        <h3 className="mt-5 text-xs font-medium uppercase tracking-widest text-sand/80">Our promise</h3>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-mist">
          <li>· No name, email or account is attached to a letter.</li>
          <li>· Kind anonymous notes and supportive reactions. No downvotes.</li>
          <li>· Please keep names and identifying details out. Reports hide a letter for review.</li>
        </ul>

        <div className="mt-5 rounded-2xl border border-coral/25 bg-coral/[0.08] p-3.5 text-[13px] leading-snug text-foam/90">
          <strong className="font-medium text-coral">Need someone right now?</strong> Free, confidential, 24 hours: the national mental health helpline on <a href="tel:1677" className="font-semibold underline">1677</a>. In an emergency call <a href="tel:911" className="font-semibold underline">911</a>.
          <Link href="/help" onClick={onClose} className="mt-2 block font-medium text-foam underline underline-offset-2">See all Maldives helplines →</Link>
        </div>
        <button onClick={() => { onClose(); openRandom(); }} disabled={finding}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-foam transition hover:bg-white/10">
          <Dice className="h-[18px] w-[18px]" /> Surprise me: open a random bottle
        </button>
        <button onClick={onSuggest} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-glow/25 bg-glow/[0.07] text-sm text-foam transition hover:bg-glow/15">
          <span aria-hidden>💌</span> Send us a note: ideas, bugs or a thank-you
        </button>
        <InstallRow />
      </motion.div>
    </>
  );
}

/** "Install app": a real button where the browser allows it, otherwise it opens the how-to for this browser. Hidden once installed. */
function InstallRow() {
  const { show, can, mode } = useInstall();
  if (!show) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-[13px] text-mist">
      <span>{mode === "inapp" ? "Open in your browser to add Ihusaas to your home screen." : "Add Ihusaas to your home screen."}</span>
      <button onClick={() => startInstall()} className="min-h-10 shrink-0 rounded-full bg-gradient-to-r from-glow to-sand px-4 text-xs font-semibold text-abyss">{can ? "Install" : "How"}</button>
    </div>
  );
}

/** Small always-there "Install" pill in the phone top bar. */
function InstallPill() {
  const { show } = useInstall();
  if (!show) return null;
  return (
    <button onClick={() => startInstall()} aria-label="Install the Ihusaas app" className="ml-auto flex items-center gap-1.5 rounded-full border border-glow/30 bg-glow/10 px-3 py-1.5 text-xs font-semibold text-glow transition active:scale-95">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M12 3v12M7 11l5 5 5-5" /><path d="M5 20h14" /></svg>
      Install
    </button>
  );
}

/* -------------------------------------------------------------------- nav */
const TABS = [
  { href: "/", label: "Drift", Icon: Waves },
  { href: "/map", label: "Map", Icon: MapPin },
];

/**
 * Desktop: a floating glass pill — logo · Drift / Map (sliding highlight) ·
 * Surprise me · About · Write.
 * Mobile: slim top logo + a floating bottom dock with the same actions.
 */
export default function Nav() {
  const path = usePathname();
  const { openWriter, openRandom, finding } = useSea();
  const [about, setAbout] = useState(false);
  useEffect(() => setAbout(false), [path]);
  // "Send us a note" can be opened from the About menu or from other pages (see lib/suggest.ts)
  const [suggest, setSuggest] = useState(false);
  useEffect(() => { const open = () => { setAbout(false); setSuggest(true); }; window.addEventListener(SUGGEST_EVENT, open); return () => window.removeEventListener(SUGGEST_EVENT, open); }, []);

  const surprise = (
    <button onClick={openRandom} disabled={finding} className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-mist transition hover:bg-white/10 hover:text-foam disabled:opacity-60">
      <Dice className={`h-[18px] w-[18px] ${finding ? "animate-spin" : ""}`} /> <span className="hidden lg:inline">Surprise me</span>
    </button>
  );

  return (
    <>
      {/* ---- desktop pill ---- */}
      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 hidden justify-center px-3 md:flex">
        <nav aria-label="Main" className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-abyss/55 py-2 pl-5 pr-2 shadow-soft backdrop-blur-xl">
          <Link href="/" aria-label="Ihusaas home"><Logo /></Link>
          <div className="flex items-center gap-1">
            {TABS.map(({ href, label, Icon }) => {
              const on = path === href;
              return (
                <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${on ? "text-foam" : "text-mist hover:text-foam"}`}>
                  {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <Icon className="relative h-[18px] w-[18px]" /><span className="relative">{label}</span>
                </Link>
              );
            })}
            <MoodDock variant="pill" />
            {surprise}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setAbout((v) => !v)} aria-label="About and safety" aria-expanded={about} className={`rounded-full p-2.5 transition hover:bg-white/10 hover:text-foam ${about ? "bg-white/10 text-foam" : "text-mist"}`}><Info /></button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => openWriter()} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-glow to-sand px-5 py-2.5 text-sm font-semibold text-abyss shadow-glow">
              <Pen /> Write
            </motion.button>
          </div>
        </nav>
      </header>

      {/* ---- mobile top logo ---- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end border-b border-white/[0.06] bg-[rgba(8,26,38,0.92)] px-5 pb-2 backdrop-blur-xl md:hidden">
        <Link href="/" aria-label="Ihusaas home"><Logo /></Link>
        <InstallPill />
      </header>

      {/* ---- mobile dock ---- */}
      <nav aria-label="Main" className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3 md:hidden">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-abyss/70 p-1.5 shadow-soft backdrop-blur-xl">
          {TABS.slice(0, 1).map(({ href, label, Icon }) => <DockLink key={href} href={href} label={label} Icon={Icon} on={path === href} />)}
          <DockLink href="/map" label="Map" Icon={MapPin} on={path === "/map"} />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => openWriter()} aria-label="Write a letter" className="mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-glow to-sand text-abyss shadow-glow"><Pen className="h-5 w-5" /></motion.button>
          <MoodDock variant="dock" />
          <button onClick={() => setAbout((v) => !v)} aria-label="About and safety" className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px] ${about ? "text-foam" : "text-mist"}`}><Info className="h-5 w-5" />About</button>
        </div>
      </nav>

      <AnimatePresence>{about && <AboutMenu onClose={() => setAbout(false)} onSuggest={() => { setAbout(false); setSuggest(true); }} />}</AnimatePresence>
      <AnimatePresence>{suggest && <SuggestionSheet onClose={() => setSuggest(false)} />}</AnimatePresence>
    </>
  );
}

function DockLink({ href, label, Icon, on }: { href: string; label: string; Icon: ReturnType<typeof I>; on: boolean }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px] transition-colors ${on ? "bg-white/10 text-foam" : "text-mist"}`}>
      <Icon className="h-5 w-5" />{label}
    </Link>
  );
}
