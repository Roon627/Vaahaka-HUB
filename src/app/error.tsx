"use client";

/** If the app ever crashes, show this instead of a blank screen, with the reason so it can be fixed. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <img src="/brand/stickers/sad.svg" alt="" width={64} height={77} />
      <h1 className="mt-4 font-display text-2xl text-foam">The tide pulled the page away</h1>
      <p className="mt-2 text-sm text-mist">Something went wrong on our side. Your letters are safe.</p>
      <button onClick={() => reset()} className="mt-5 min-h-12 rounded-full bg-gradient-to-r from-glow to-sand px-6 text-sm font-semibold text-abyss">Try again</button>
      <button onClick={() => { try { navigator.serviceWorker?.getRegistrations().then((r) => r.forEach((x) => x.unregister())); caches?.keys().then((k) => k.forEach((x) => caches.delete(x))); } catch {} location.reload(); }} className="mt-2 min-h-11 text-xs text-mist underline">Clear saved data and reload</button>
      <p className="mt-6 break-words text-[11px] text-mist/70">{error.message || "Unknown error"}{error.digest ? ` · ${error.digest}` : ""}</p>
    </div>
  );
}
