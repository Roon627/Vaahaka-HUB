"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import InstallSheet from "./InstallSheet";
import { HELP_EVENT, initPwaListeners } from "@/lib/pwa";

/**
 * Registers the service worker (production only: a caching worker in dev causes stale-bundle
 * headaches, so dev actively removes any old one) and hosts the "how to install" sheet.
 * It never pops anything up by itself: installing is offered only in the Menu, when the person asks.
 */
export default function PWA() {
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
    const open = () => setHelp(true);
    window.addEventListener(HELP_EVENT, open);
    return () => window.removeEventListener(HELP_EVENT, open);
  }, []);

  return <AnimatePresence>{help && <InstallSheet onClose={() => setHelp(false)} />}</AnimatePresence>;
}
