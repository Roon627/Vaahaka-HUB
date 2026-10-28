"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import InstallSheet from "./InstallSheet";
import { HELP_EVENT, initPwaListeners, isStandalone, startInstall, useInstall } from "@/lib/pwa";

const DISMISS_KEY = "raalhu.install.dismissed";
const COOLDOWN = 14 * 24 * 3600 * 1000;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

/**
 * Registers the service worker (production only: a caching worker in dev causes stale-bundle
 * headaches, so dev actively removes any old one) and shows a gentle, dismissible install card
 * after a short while. On iOS, where there is no install event, it explains the Share-sheet route.
 */
export default function PWA() {
  const { show: installable, can: canInstall, mode } = useInstall();
  const [ready, setReady] = useState(false); // waited long enough
  const [dismissed, setDismissed] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    initPwaListeners();
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
      else {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
        caches?.keys().then((ks) => ks.filter((k) => k.startsWith("rf-")).forEach((k) => caches.delete(k)));
      }
    }
    setDismissed(isStandalone() || Date.now() - Number(read(DISMISS_KEY) ?? 0) < COOLDOWN);
    const t = setTimeout(() => setReady(true), 9_000); // don't pounce on a first-time visitor
    const open = () => setHelp(true);
    window.addEventListener(HELP_EVENT, open);
    return () => { clearTimeout(t); window.removeEventListener(HELP_EVENT, open); };
  }, []);

  const show = ready && !dismissed && installable;
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} };

  return (
    <>
    <AnimatePresence>{help && <InstallSheet onClose={() => setHelp(false)} />}</AnimatePresence>
    <AnimatePresence>
      {show && (
        <motion.aside
          role="dialog" aria-label="Install Ihusaas"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-3xl border border-white/15 bg-abyss/90 p-3 pr-4 shadow-soft backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-[24rem]"
        >
          <img src="/brand/png/icon-192.png" alt="" width={52} height={52} className="h-[52px] w-[52px] shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] leading-tight text-foam">Keep Ihusaas close</p>
            <p className="mt-0.5 text-xs leading-snug text-mist">
              {mode === "inapp" ? "Open it in your browser first, then add it to your home screen." : "Add it to your home screen: one tap to open, no browser bar."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1">
            <button onClick={async () => { if (await startInstall()) dismiss(); }} className="rounded-full bg-gradient-to-r from-glow to-sand px-4 py-1.5 text-xs font-semibold text-abyss">{canInstall ? "Install" : "How"}</button>
            <button onClick={dismiss} className="rounded-full px-4 py-1 text-xs text-mist transition hover:text-foam">Not now</button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
    </>
  );
}
