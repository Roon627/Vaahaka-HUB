"use client";
import { useSyncExternalStore } from "react";

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Chrome/Edge/Android fire `beforeinstallprompt`; we hold it so the app can offer install at a good moment. */
export function initPwaListeners() {
  const w = window as unknown as { __pwaInit?: boolean };
  if (w.__pwaInit) return;
  w.__pwaInit = true;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; emit(); });
}

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** iOS has no install event: users add it from the Share sheet. */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === "accepted";
}

export const useCanInstall = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => !!deferred, () => false);
