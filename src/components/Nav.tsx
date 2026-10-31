"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";
import MoodDock from "./MoodDock";
import SoulsOnline from "./SoulsOnline";
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

function Logo({ showDhivehi = true }: { showDhivehi?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sand/20 bg-sand/10 shadow-sm transition-colors group-hover:border-sand/40 group-hover:bg-sand/20">
        <img
          src="/brand/mark.svg"
          alt=""
          width={18}
          height={30}
          className="h-5 w-auto drop-shadow-[0_2px_8px_rgba(236,217,181,0.25)]"
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-xl font-medium tracking-tight text-foam transition-colors group-hover:text-sand">
          Ihusaas
        </span>
        {showDhivehi && (
          <span className="font-serif text-xs font-normal text-sand/80">
            އިޙްސާސް
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- about menu */
function AboutMenu({ onClose, onSuggest }: { onClose: () => void; onSuggest: () => void }) {
  const { openRandom, finding, newArrivalsCount, setFilterNewArrivals } = useSea();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(soundOn());
    sync();
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);

  return (
    <Sheet title="Ihusaas Sanctuary Menu" onClose={onClose}>
      {/* Editorial Header */}
      <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sand/20 bg-sand/10 shadow-sm">
            <img src="/brand/mark.svg" alt="" width={20} height={33} className="h-6 w-auto" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-2xl tracking-tight text-foam">Ihusaas</h2>
              <span className="font-serif text-sm font-normal text-sand/80">އިޙްސާސް</span>
            </div>
            <p className="text-xs text-mist">A quiet sanctuary for words left to the sea.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-full p-2 text-mist transition hover:bg-white/10 hover:text-foam"
        >
          <Close className="h-5 w-5" />
        </button>
      </div>

      {/* Dynamic Tide Update for Returning Visitors */}
      <div className="mt-4">
        {newArrivalsCount > 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-sand/40 bg-gradient-to-br from-[#123040] via-[#0e2736] to-[#0a1c26] p-4 text-left shadow-lg">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sand">
                <Waves className="h-4 w-4" />
                High Tide Arrivals
              </span>
              <span className="rounded-full bg-sand/20 px-2.5 py-0.5 text-[10px] font-bold text-sand">
                {newArrivalsCount} new {newArrivalsCount === 1 ? "letter" : "letters"}
              </span>
            </div>
            <p className="mt-2 font-serif text-sm italic text-foam/95">
              The tide has carried {newArrivalsCount} new {newArrivalsCount === 1 ? "thought" : "thoughts"} ashore since your last visit.
            </p>
            <button
              onClick={() => {
                onClose();
                setFilterNewArrivals(true);
                document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand px-4 py-1.5 text-xs font-semibold text-abyss transition hover:bg-[#fae8c8] active:scale-95"
            >
              <span>Walk the shore & read them</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-xs text-mist/90">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sand/80 shadow-[0_0_8px_rgba(236,217,181,0.6)]" />
              <span className="font-medium text-foam">Quiet sea over the atolls</span>
            </div>
            <span className="text-[11px] text-mist/70">20 atolls listening</span>
          </div>
        )}
      </div>

      {/* Editorial Actions */}
      <div className="mt-4 space-y-2.5">
        {/* Surprise letter */}
        <button
          onClick={() => {
            onClose();
            if (!finding) openRandom();
          }}
          disabled={finding}
          className="group flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-all hover:border-sand/35 hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/15 text-sand transition-transform group-hover:scale-105">
              <Dice className={`h-5 w-5 ${finding ? "animate-spin" : ""}`} />
            </span>
            <div>
              <span className="block text-sm font-medium text-foam group-hover:text-sand">
                Surprise me
              </span>
              <span className="block text-xs text-mist">Uncork a random letter from the sea</span>
            </div>
          </div>
          <Chevron className="h-4 w-4 shrink-0 text-mist/60 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Ambient Sounds */}
        <div className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-all hover:border-white/15">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sand">
              {on ? <Speaker className="h-5 w-5" /> : <SpeakerOff className="h-5 w-5" />}
            </span>
            <div>
              <span className="block text-sm font-medium text-foam">
                Ambient sounds
              </span>
              <span className="block text-xs text-mist">Ocean wash and tactile paper tears</span>
            </div>
          </div>
          <button
            onClick={() => setSound(!on)}
            className={`min-h-8 shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              on ? "bg-sand text-abyss shadow-sm hover:bg-[#fae8c8]" : "border border-white/15 bg-white/5 text-mist hover:text-foam"
            }`}
          >
            {on ? "Sound: On" : "Sound: Off"}
          </button>
        </div>

        {/* Contact creator */}
        <button
          onClick={onSuggest}
          className="group flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-all hover:border-sand/35 hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sand transition-transform group-hover:scale-105">
              <Pen className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-sm font-medium text-foam group-hover:text-sand">
                Contact the creator
              </span>
              <span className="block text-xs text-mist">Send a quiet note, idea, or issue to Harun</span>
            </div>
          </div>
          <Chevron className="h-4 w-4 shrink-0 text-mist/60 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Crisis Support Card */}
        <Link
          href="/help"
          onClick={onClose}
          className="group flex w-full items-center justify-between rounded-xl border border-coral/25 bg-coral/[0.06] p-3.5 text-left transition-all hover:border-coral/40 hover:bg-coral/[0.12]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-coral">
              🤍
            </span>
            <div>
              <span className="block text-sm font-medium text-foam group-hover:text-coral">
                Need support right now?
              </span>
              <span className="block text-xs text-mist">Free 24h helplines in the Maldives (1677, 1412, 911)</span>
            </div>
          </div>
          <Chevron className="h-4 w-4 shrink-0 text-coral/70 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Editorial Sanctuary Note */}
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#091b24] p-4 text-xs leading-relaxed text-mist">
        <div className="flex items-center gap-2 font-serif text-sm font-medium text-foam/90">
          <span className="text-sand">✦</span>
          <span>Our Promise</span>
        </div>
        <p className="mt-1.5 text-mist/85">
          No accounts. No algorithms. No tracking. You release letters into the sea anonymously, and strangers respond only with quiet kindness.
        </p>
        <p className="mt-2 text-right font-serif text-[11px] italic text-sand/70">
          — Ihusaas (Say it to the sea)
        </p>
      </div>

      <InstallRow />
    </Sheet>
  );
}

/** "Install app": a real button where the browser allows it, otherwise it opens the how-to for this browser. Hidden once installed. */
function InstallRow() {
  const { show, can, mode } = useInstall();
  if (!show) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mist">
      <span>{mode === "inapp" ? "Open in browser to add Ihusaas to your home screen." : "Add Ihusaas to your home screen."}</span>
      <button onClick={() => startInstall()} className="min-h-8 shrink-0 rounded-full bg-sand px-3.5 text-xs font-semibold text-abyss transition hover:bg-[#fae8c8]">{can ? "Install" : "How"}</button>
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
  const {
    openWriter,
    openRandom,
    finding,
    newArrivalsCount,
    filterNewArrivals,
    setFilterNewArrivals,
  } = useSea();
  const [about, setAbout] = useState(false);
  useEffect(() => setAbout(false), [path]);
  // "Send us a note" can be opened from the About menu or from other pages (see lib/suggest.ts)
  const [suggest, setSuggest] = useState(false);
  useEffect(() => { const open = () => { setAbout(false); setSuggest(true); }; window.addEventListener(SUGGEST_EVENT, open); return () => window.removeEventListener(SUGGEST_EVENT, open); }, []);

  return (
    <>
      {/* ---- Grounded Sanctuary Header (Desktop) ---- */}
      <header className="fixed inset-x-0 top-0 z-40 hidden border-b border-white/[0.08] bg-[#071720]/85 backdrop-blur-xl transition-all md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Brand lockup */}
          <Link href="/" aria-label="Ihusaas home" className="group flex items-center">
            <Logo />
          </Link>

          {/* Center: Editorial navigation + dynamic High Tide Revisit Experience */}
          <nav aria-label="Main" className="flex items-center gap-1 lg:gap-2">
            {TABS.map(({ href, label, Icon }) => {
              const on = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                    on ? "text-sand font-semibold" : "text-mist hover:text-foam"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {on && (
                    <motion.span
                      layoutId="nav-active-pip"
                      className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-sand shadow-[0_0_8px_rgba(236,217,181,0.5)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            <MoodDock variant="editorial" />

            {/* Surprise me */}
            <button
              onClick={openRandom}
              disabled={finding}
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-mist transition hover:text-foam disabled:opacity-50"
              title="Uncork a random letter from the sea"
            >
              <Dice className={`h-4 w-4 ${finding ? "animate-spin text-sand" : ""}`} />
              <span className="hidden xl:inline">Surprise me</span>
            </button>

            {/* Dynamic Revisit Experience: High Tide Pill */}
            {newArrivalsCount > 0 && (
              <div className="ml-2 border-l border-white/[0.1] pl-3">
                <motion.button
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setFilterNewArrivals(!filterNewArrivals);
                    document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group relative flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    filterNewArrivals
                      ? "bg-sand text-abyss font-semibold shadow-[0_0_16px_rgba(236,217,181,0.35)]"
                      : "border border-sand/40 bg-sand/15 text-sand hover:border-sand/70 hover:bg-sand/25"
                  }`}
                  title={filterNewArrivals ? "Showing new letters since your last visit. Click to show all." : "Click to view new letters that washed ashore since your last visit"}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
                  </span>
                  <span className="font-serif italic text-sand/90">High tide:</span>
                  <span>{newArrivalsCount} new {newArrivalsCount === 1 ? "letter" : "letters"}</span>
                  <span className="text-[11px] opacity-75 transition-transform group-hover:translate-x-0.5">
                    {filterNewArrivals ? "✓ showing" : "read →"}
                  </span>
                </motion.button>
              </div>
            )}
          </nav>

          {/* Right: Tactile Sanctuary Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:block">
              <SoulsOnline />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openWriter()}
              className="flex items-center gap-2 rounded-full border border-sand/40 bg-sand/15 px-4 py-2 text-xs font-semibold tracking-wide text-sand transition-all hover:bg-sand hover:text-abyss"
            >
              <Pen className="h-3.5 w-3.5" />
              <span>Write a letter</span>
            </motion.button>

            <button
              onClick={() => setAbout((v) => !v)}
              aria-label="Sanctuary menu"
              aria-expanded={about}
              aria-haspopup="dialog"
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                about
                  ? "border-sand/50 bg-sand/20 text-sand shadow-sm"
                  : "border-white/[0.08] bg-white/[0.03] text-mist hover:border-white/20 hover:bg-white/[0.07] hover:text-foam"
              }`}
            >
              <Bars className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---- mobile top header ---- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end border-b border-white/[0.08] bg-[#071720]/90 px-4 pb-2.5 backdrop-blur-xl md:hidden">
        <div className="flex w-full items-center justify-between">
          <Link href="/" aria-label="Ihusaas home" className="group flex items-center">
            <Logo showDhivehi={false} />
          </Link>

          <div className="flex items-center gap-2">
            {newArrivalsCount > 0 && (
              <button
                onClick={() => {
                  setFilterNewArrivals(!filterNewArrivals);
                  document.getElementById("bottles")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  filterNewArrivals
                    ? "bg-sand text-abyss font-semibold"
                    : "border border-sand/40 bg-sand/15 text-sand"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sand animate-pulse" />
                <span>{newArrivalsCount} new</span>
              </button>
            )}
            {/* Cute Thaana Translation Pill on Right */}
            <span
              className="inline-flex items-center rounded-full border border-sand/25 bg-sand/10 px-3 py-1 font-serif text-xs font-normal tracking-wider text-sand/90 shadow-sm"
              aria-label="Ihusaas in Dhivehi"
            >
              އިޙްސާސް
            </span>
          </div>
        </div>
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
