"use client";

/** If the app ever crashes, show this instead of a blank screen, with the reason so it can be fixed. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <img src="/brand/stickers/sad.svg" alt="" width={64} height={77} />
      <h1 className="mt-4 font-display text-2xl text-foam">The tide pulled the page away</h1>
      <p className="mt-2 text-sm text-mist">Something went wrong on our side. Your letters are safe.</p>
      <button onClick={() => reset()} className="mt-5 min-h-12 rounded-full bg-gradient-to-r from-glow to-sand px-6 text-sm font-semibold text-abyss">Try again</button>
      <button onClick={async () => {
        try {
          const registrations = await navigator.serviceWorker?.getRegistrations() ?? [];
          await Promise.all(registrations.map((r) => r.unregister()));
          if ("caches" in window) await Promise.all((await caches.keys()).filter((k) => k.startsWith("rf-")).map((k) => caches.delete(k)));
        } finally { location.reload(); }
      }} className="mt-2 min-h-11 text-xs text-mist underline">Refresh app cache</button>
      <p className="mt-6 break-words text-[11px] text-mist/70">Something went wrong.{error.digest ? ` · ${error.digest}` : ""}</p>
    </div>
  );
}
