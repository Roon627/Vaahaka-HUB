"use client";
import { useEffect, useState } from "react";
import { moonPhase, type MoonPhase } from "@/lib/moon";
import { maleTime, skyAt, type SkyState } from "@/lib/sky";
import { useWeather } from "@/lib/weather";
import { useSea } from "./SeaProvider";

/** "🟢 4 here now · Malé 29° 🌦️ · 🌔 Waxing gibbous": who's around, the real weather, the real moon. */
export default function SkyLine() {
  const { online } = useSea();
  const w = useWeather();
  const [moon, setMoon] = useState<MoonPhase | null>(null);
  const [sky, setSky] = useState<SkyState | null>(null);
  useEffect(() => { setMoon(moonPhase()); setSky(skyAt(new Date())); }, []);
  const bits = [
    online > 0 && <span key="o" className="inline-flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-glow" /></span>{online} here now</span>,
    w && <span key="w" title={`${w.label}, wind ${w.wind} km/h`}>Malé {w.temp}° {w.emoji}</span>,
    sky && <span key="s" title="Malé local time">{sky.next.kind === "sunrise" ? "🌅 sunrise" : "🌇 sunset"} {maleTime(sky.next.at)}</span>,
    moon && <span key="m" title={`${Math.round(moon.illumination * 100)}% lit`}>{moon.emoji} {moon.name}</span>,
  ].filter(Boolean);
  if (!bits.length) return null;
  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-mist">
      {bits.map((b, i) => <span key={i} className="inline-flex items-center gap-2.5">{i > 0 && <span className="text-mist/40">·</span>}{b}</span>)}
    </p>
  );
}
