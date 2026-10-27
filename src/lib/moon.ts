// Moon phase from astronomy (no API), via SunCalc.
import * as SunCalc from "suncalc";

export interface MoonPhase { phase: number; illumination: number; name: string; emoji: string }

/** phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
export function moonPhase(date = new Date()): MoonPhase {
  const { phase, fraction: illumination } = SunCalc.getMoonIllumination(date);
  const names: [number, string, string][] = [
    [0.0339, "New moon", "🌑"], [0.216, "Waxing crescent", "🌒"], [0.284, "First quarter", "🌓"], [0.466, "Waxing gibbous", "🌔"],
    [0.534, "Full moon", "🌕"], [0.716, "Waning gibbous", "🌖"], [0.784, "Last quarter", "🌗"], [0.966, "Waning crescent", "🌘"], [1, "New moon", "🌑"],
  ];
  const [, name, emoji] = names.find(([edge]) => phase < edge)!;
  return { phase, illumination, name, emoji };
}

/**
 * SVG path of the lit part of a moon of radius r at (cx, cy). Northern-hemisphere view (lit on the right
 * while waxing); the Maldives are just north of the equator, so this matches the sky there closely enough.
 */
export function litPath(phase: number, cx: number, cy: number, r: number): string {
  const c = Math.cos(2 * Math.PI * phase);
  const rx = Math.abs(c) * r;
  const waxing = phase < 0.5;
  const top = `${cx} ${cy - r}`, bottom = `${cx} ${cy + r}`;
  // outer limb: right half when waxing, left half when waning
  const limb = `M${top} A${r} ${r} 0 0 ${waxing ? 1 : 0} ${bottom}`;
  // terminator back to the top: bulges toward the lit limb for a crescent, away from it for a gibbous
  const sweep = waxing ? (c > 0 ? 0 : 1) : c > 0 ? 1 : 0;
  return `${limb} A${rx} ${r} 0 0 ${sweep} ${top}Z`;
}
