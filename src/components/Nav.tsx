"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";
import MoodDock from "./MoodDock";
import { startInstall, useInstall } from "@/lib/pwa";
import { SUGGEST_EVENT } from "@/lib/suggest";
import { SOUND_EVENT, setSound, soundOn } from "@/lib/sound";
import SuggestionSheet from "./SuggestionSheet";
import Sheet from "./Sheet";

/* ------------------------------------------------------------------ icons */
const I = (d: React.ReactNode) => function Icon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{d}</svg>;
};
const Waves = I(<><path d="M2 8c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /><path d="M2 13c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /><path d="M2 18c2.5-2.5 4.5 2.5 7 0s4.5-2.5 7 0 4.5 2.5 6 0" /></>);
const MapPin = I(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
const Dice = I(<><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /><circle cx="9" cy="15" r="1" fill="currentColor" /></>);
const Pen = I(<><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" /><path d="M14 7l3 3" /></>);
// the menu mark: one straight line and two lines of sea, so it still reads as a menu but belongs to this app
const Bars = I(<><path d="M4 6.5h16" /><path d="M4 12c2-2 3.5 2 6 0s3.5 2 6 0 2.5 1 4 0" /><path d="M4 17.5c2-2 3.5 2 6 0s3.5 2 6 0 2.5 1 4 0" /></>);
const Speaker = I(<><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></>);
const SpeakerOff = I(<><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" /><path d="M16 9.5l5 5" /><path d="M21 9.5l-5 5" /></>);
const Close = I(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
const Chevron = I(<path d="M9 6l6 6-6 6" />);

function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-xl text-foam">
      <img src="/brand/mark.svg" alt="" width={20} height={33} className="h-[30px] w-auto" />
      <span>Ihusaas</span>
    </span>
  );
}

/* ------------------------------------------------------------- about menu */
/** A sticker tile, the same shape as the mood tiles in "How does it feel?", so every sheet in the app looks like one family. */
function Tile({ sticker, title, hint, onClick, href, tone = "plain", badge }: { sticker: string; title: string; hint: string; onClick?: () => void; href?: string; tone?: "plain" | "glow" | "coral"; badge?: string }) {
  const cls = `relative flex min-h-[7.5rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${
    tone === "glow" ? "border-glow/35 bg-glow/[0.09] hover:bg-glow/15" : tone === "coral" ? "border-coral/30 bg-coral/[0.08] hover:bg-coral/15" : "border-white/10 bg-white/[0.04] hover:bg-white/10"}`;
  const inner = (
    <>
      <motion.img src={`/brand/stickers/${sticker}.svg`} alt="" width={40} height={48} className="h-11 w-auto" whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }} transition={{ duration: 0.5 }} />
      <span className="text-sm font-semibold text-foam">{title}</span>
      <span className="text-[11.5px] leading-tight text-mist">{hint}</span>
      {badge && <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-foam">{badge}</span>}
    </>
  );
  const props = { whileTap: { scale: 0.96 }, className: cls };
  return href ? <Link href={href} onClick={onClick} className={cls}>{inner}</Link> : <motion.button onClick={onClick} {...props}>{inner}</motion.button>;
}

function AboutMenu({ onClose, onSuggest }: { onClose: () => void; onSuggest: () => void }) {
  const { openRandom, finding } = useSea();
  const [on, setOn] = useState(false);
  useEffect(() => { const sync = () => setOn(soundOn()); sync(); window.addEventListener(SOUND_EVENT, sync); return () => window.removeEventListener(SOUND_EVENT, sync); }, []);

  const steps = [
    ["✍️", "Write a letter", "No account, no email. Choose an ink for how it feels."],
    ["🍾", "Seal it in a bottle", "It drifts into the sea for strangers to find."],
    ["🕯️", "They only listen", "Readers offer supportive reactions and kind anonymous notes."],
  ];
  const fold = "group mt-3 rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05]";
  const sum = "flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-foam [&::-webkit-details-marker]:hidden";
  return (
    <Sheet title="Menu" onClose={onClose}>
      <h2 className="font-display text-2xl text-foam">Menu</h2>
      <p className="font-hand text-xl text-sand/80">Everything is a tap away.</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Tile tone="glow" sticker="relationships" title="Contact us" hint="An idea, a bug or a thank-you" onClick={onSuggest} />
        <Tile tone="coral" sticker="sad" title="Need help now?" hint="Free helplines, 24 hours" href="/help" onClick={onClose} />
        <Tile sticker="secrets" title="Surprise me" hint="Open a random bottle" onClick={() => { onClose(); if (!finding) openRandom(); }} />
        <Tile sticker="happy" title="Sounds" hint="Splashes and paper tears" badge={on ? "On" : "Off"} onClick={() => setSound(!on)} />
      </div>

      <div className="mt-3 rounded-2xl border border-coral/25 bg-coral/[0.08] p-3.5 text-[13px] leading-snug text-foam/90">
        <strong className="font-medium text-coral">In distress?</strong> Call the national mental health helpline <a href="tel:1677" className="font-semibold underline">1677</a>. In an emergency call <a href="tel:911" className="font-semibold underline">911</a>.
      </div>

      <details className={fold}>
        <summary className={sum}>How Ihusaas works<Chevron className="h-4 w-4 text-mist transition group-open:rotate-90" /></summary>
        <ol className="space-y-3 px-4 pb-4">
          {steps.map(([e, t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 text-lg">{e}</span>
              <span><span className="block text-sm font-medium text-foam">{t}</span><span className="text-[13px] leading-snug text-mist">{d}</span></span>
            </li>
          ))}
        </ol>
      </details>
      <details className={fold}>
        <summary className={sum}>Our promise<Chevron className="h-4 w-4 text-mist transition group-open:rotate-90" /></summary>
        <ul className="space-y-1.5 px-4 pb-4 text-[13px] leading-snug text-mist">
          <li>· No name, email or account is attached to a letter.</li>
          <li>· Kind anonymous notes and supportive reactions. No downvotes.</li>
          <li>· Please keep names and identifying details out. Reports hide a letter for review.</li>
        </ul>
      </details>
      <InstallRow />
    </Sheet>
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

/* -------------------------------------------------------------------- nav */
const TABS = [
  { href: "/", label: "Drift", Icon: Waves },
  { href: "/map", label: "Map", Icon: MapPin },
];

/**
 * Desktop: a floating glass pill — logo · Drift / Map (sliding highlight) ·
 * Surprise me · Menu · Write.
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
        <nav aria-label="Main" className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-abyss/85 py-2 pl-5 pr-2 shadow-soft backdrop-blur-xl">
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
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openWriter()} className="flex items-center gap-2 rounded-full bg-sand px-5 py-2.5 text-sm font-semibold text-abyss transition hover:bg-[#fae8c8]">
              <Pen /> Write
            </motion.button>
            <button onClick={() => setAbout((v) => !v)} aria-label="Menu: contact, help and how it works" aria-expanded={about} aria-haspopup="dialog" className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition hover:bg-white/10 hover:text-foam ${about ? "bg-white/10 text-foam" : "text-mist"}`}><Bars /> Menu</button>
          </div>
        </nav>
      </header>

      {/* ---- mobile top logo ---- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end border-b border-white/[0.06] bg-[rgba(8,26,38,0.92)] px-5 pb-2 backdrop-blur-xl md:hidden">
        <Link href="/" aria-label="Ihusaas home"><Logo /></Link>
      </header>

      {/* ---- mobile dock ---- */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,26,38,0.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {TABS.slice(0, 1).map(({ href, label, Icon }) => <DockLink key={href} href={href} label={label} Icon={Icon} on={path === href} />)}
          <DockLink href="/map" label="Map" Icon={MapPin} on={path === "/map"} />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => openWriter()} aria-label="Write a letter" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand text-abyss shadow-sm"><Pen className="h-5 w-5" /></motion.button>
          <MoodDock variant="dock" />
          <button onClick={() => setAbout((v) => !v)} aria-label="Menu: contact, help and how it works" aria-expanded={about} aria-haspopup="dialog" className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[10px] ${about ? "bg-white/10 text-foam" : "text-mist"}`}><Bars className="h-5 w-5" />Menu</button>
        </div>
      </nav>

      <AnimatePresence>{about && <AboutMenu onClose={() => setAbout(false)} onSuggest={() => { setAbout(false); setSuggest(true); }} />}</AnimatePresence>
      <AnimatePresence>{suggest && <SuggestionSheet onClose={() => setSuggest(false)} />}</AnimatePresence>
    </>
  );
}

function DockLink({ href, label, Icon, on }: { href: string; label: string; Icon: ReturnType<typeof I>; on: boolean }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[10px] transition-colors ${on ? "bg-white/10 text-foam" : "text-mist"}`}>
      <Icon className="h-5 w-5" />{label}
    </Link>
  );
}
