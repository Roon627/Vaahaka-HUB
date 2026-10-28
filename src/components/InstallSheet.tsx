"use client";
import { useState } from "react";
import Sheet from "./Sheet";
import { startInstall, useInstall } from "@/lib/pwa";

const Share = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="inline h-[18px] w-[18px] align-[-3px]" aria-hidden>
    <path d="M12 15V3M8 7l4-4 4 4" /><path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
  </svg>
);

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-sm leading-snug text-foam/90">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-glow/15 text-xs font-semibold text-glow">{i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

/** "How to install" for whatever browser this is. Prompt-capable browsers get a real Install button. */
export default function InstallSheet({ onClose }: { onClose: () => void }) {
  const { mode, android } = useInstall();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.origin); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt("Copy this link", window.location.origin); }
  };

  return (
    <Sheet title="Install Ihusaas" onClose={onClose}>
      <div className="flex items-center gap-3">
        <img src="/brand/png/icon-192.png" alt="" width={56} height={56} className="h-14 w-14 rounded-2xl shadow-soft" />
        <div>
          <h2 className="font-display text-xl leading-tight text-foam">Keep Ihusaas close</h2>
          <p className="text-[13px] text-mist">One tap from your home screen. No browser bar.</p>
        </div>
      </div>

      {mode === "prompt" && (
        <button onClick={async () => { if (await startInstall()) onClose(); }} className="mt-5 min-h-12 w-full rounded-2xl bg-gradient-to-r from-glow to-sand text-sm font-semibold text-abyss">Install the app</button>
      )}

      {mode === "ios" && (
        <Steps items={[<>Tap the <b>Share</b> button <Share /> in Safari (or Chrome).</>, <>Scroll down and tap <b>Add to Home Screen</b>.</>, <>Tap <b>Add</b>. Ihusaas now opens like an app.</>]} />
      )}

      {mode === "inapp" && (
        <>
          <p className="mt-4 rounded-2xl border border-sand/25 bg-sand/[0.08] p-3.5 text-[13px] leading-snug text-foam/90">
            You&apos;re in an in-app browser (TikTok, Instagram, Facebook…). Apps can&apos;t be installed from here, so open Ihusaas in your phone&apos;s own browser first.
          </p>
          <Steps items={[
            <>Tap the <b>⋯</b> or <b>Share</b> button at the top or bottom of this screen.</>,
            <>Choose <b>Open in browser</b> (Safari or Chrome).</>,
            <>Then tap <b>Install</b> there. On iPhone: <b>Share → Add to Home Screen</b>.</>,
          ]} />
          <div className="mt-4 flex flex-col gap-2">
            {android && (
              <a href={`intent://${typeof window !== "undefined" ? window.location.host : ""}/#Intent;scheme=https;package=com.android.chrome;end`} className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-glow to-sand text-sm font-semibold text-abyss">Open in Chrome</a>
            )}
            <button onClick={copy} className="min-h-12 rounded-2xl border border-white/15 bg-white/[0.05] text-sm text-foam transition hover:bg-white/10">{copied ? "Link copied ✓" : "Copy link, paste it in your browser"}</button>
          </div>
        </>
      )}

      {mode === "manual" && (
        <Steps items={android
          ? [<>Tap the browser menu <b>⋮</b> (top right).</>, <>Choose <b>Install app</b> (or <b>Add to Home screen</b>).</>, <>Confirm. Ihusaas appears with your other apps.</>]
          : [<>Look for the <b>install icon</b> at the right of the address bar (Chrome or Edge).</>, <>Click <b>Install</b>.</>, <>Ihusaas opens in its own window and lives in your apps.</>]} />
      )}

      <button onClick={onClose} className="mt-4 w-full rounded-full py-2 text-xs text-mist transition hover:text-foam">Close</button>
    </Sheet>
  );
}
