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
const Bars = I(<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>);
const Close = I(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
const Chevron = I(<path d="M9 6l6 6-6 6" />);

function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-xl text-foam">
      <img src="/brand/mark.svg" alt="" width={20} height={33} className="h-[33px] w-auto animate-drift" />
      <span>Ihusaas</span>
    </span>
  );
}

/* ------------------------------------------------------------- about menu */
function MenuRow({ icon, title, hint, onClick, href, tone = "plain" }: { icon: string; title: string; hint: string; onClick?: () => void; href?: string; tone?: "plain" | "glow" | "coral" }) {
  const cls = `flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
    tone === "glow" ? "border-glow/30 bg-glow/[0.09] hover:bg-glow/15" : tone === "coral" ? "border-coral/30 bg-coral/[0.09] hover:bg-coral/15" : "border-white/10 bg-white/[0.04] hover:bg-white/10"}`;
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-xl" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foam">{title}</span><span className="block text-[12.5px] leading-snug text-mist">{hint}</span></span>
      <Chevron className="h-4 w-4 shrink-0 text-mist" />
    </>
  );
  return href ? <Link href={href} onClick={onClick} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}

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
  const fold = "group mt-3 rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05]";
  const sum = "flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-foam [&::-webkit-details-marker]:hidden";
  return (
    <>
      <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default bg-black/30 md:bg-transparent" onClick={onClose} />
      <motion.div
        role="dialog" aria-label="Menu"
        initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-x-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-50 max-h-[78dvh] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-abyss/95 p-4 shadow-soft backdrop-blur-xl md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:max-h-[calc(100dvh-6.5rem)] md:w-[23rem]"
      >
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <h2 className="font-display text-xl text-foam">Menu</h2>
          <button onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full text-mist transition hover:bg-white/10 hover:text-foam"><Close className="h-5 w-5" /></button>
        </div>

        <div className="space-y-2.5">
          <MenuRow tone="glow" icon="💌" title="Contact us" hint="Send an idea, report a bug or say thank you" onClick={onSuggest} />
          <MenuRow tone="coral" icon="🛟" title="Need help right now?" hint="Free helplines in the Maldives, 24 hours" href="/help" onClick={onClose} />
          <MenuRow icon="🎲" title="Surprise me" hint="Open a random bottle" onClick={() => { onClose(); if (!finding) openRandom(); }} />
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
            <button onClick={() => setAbout((v) => !v)} aria-label="Menu: contact, help and how it works" aria-expanded={about} aria-haspopup="dialog" className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition hover:bg-white/10 hover:text-foam ${about ? "bg-white/10 text-foam" : "text-mist"}`}>{about ? <Close /> : <Bars />} Menu</button>
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
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,26,38,0.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {TABS.slice(0, 1).map(({ href, label, Icon }) => <DockLink key={href} href={href} label={label} Icon={Icon} on={path === href} />)}
          <DockLink href="/map" label="Map" Icon={MapPin} on={path === "/map"} />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => openWriter()} aria-label="Write a letter" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-glow to-sand text-abyss shadow-glow"><Pen className="h-5 w-5" /></motion.button>
          <MoodDock variant="dock" />
          <button onClick={() => setAbout((v) => !v)} aria-label="Menu: contact, help and how it works" aria-expanded={about} aria-haspopup="dialog" className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[10px] ${about ? "bg-white/10 text-foam" : "text-mist"}`}>{about ? <Close className="h-5 w-5" /> : <Bars className="h-5 w-5" />}Menu</button>
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
