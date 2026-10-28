"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const INSTALLED_KEY = "raalhu.installed";
/** Fired when the app wants to show the "how to install" sheet (see InstallSheet, hosted by PWA.tsx). */
export const HELP_EVENT = "ihusaas:install-help";

/** Chrome/Edge/Android fire `beforeinstallprompt`; we hold it so the app can offer install at a good moment. */
export function initPwaListeners() {
  const w = window as unknown as { __pwaInit?: boolean };
  if (w.__pwaInit) return;
  w.__pwaInit = true;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
    emit();
  });
}

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** TikTok / Instagram / Facebook / Snapchat & co open links in a built-in browser that cannot install web apps. */
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|Bytedance|MicroMessenger|Line\/|Twitter|LinkedInApp|Pinterest/i;
export const isInApp = () => IN_APP.test(navigator.userAgent);
/** iOS (and iPadOS, which reports as a Mac): there is no install event, people add it from the Share sheet. */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isAndroid = () => /android/i.test(navigator.userAgent);

/** Install straight away if the browser allows it, otherwise open the how-to sheet. Resolves true if installed. */
export async function startInstall(): Promise<boolean> {
  if (deferred) {
    const ev = deferred;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    deferred = null;
    emit();
    return outcome === "accepted";
  }
  window.dispatchEvent(new Event(HELP_EVENT));
  return false;
}

export const promptInstall = startInstall;

export const useCanInstall = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => !!deferred, () => false);

export type InstallMode = "prompt" | "ios" | "inapp" | "manual";

/** What this visitor can do about installing. `show` is false in the installed app and before mount (so SSR markup matches). */
export function useInstall() {
  const can = useCanInstall();
  const [env, setEnv] = useState({ ready: false, standalone: true, inApp: false, ios: false, android: false });
  useEffect(() => {
    let installed = false;
    try { installed = localStorage.getItem(INSTALLED_KEY) === "1"; } catch {}
    setEnv({ ready: true, standalone: isStandalone() || installed, inApp: isInApp(), ios: isIos(), android: isAndroid() });
  }, []);
  const mode: InstallMode = can ? "prompt" : env.inApp ? "inapp" : env.ios ? "ios" : "manual";
  return { ...env, can, mode, show: env.ready && !env.standalone };
}
