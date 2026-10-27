import * as SunCalc from "suncalc";

/** Malé: the sky above the app is always the sky above the Maldives, whoever is looking. */
export const MALE = { lat: 4.1755, lng: 73.5093 };

const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * clamp(t)).toString(16).padStart(2, "0")).join("");

export interface Body { alt: number; y: number; visible: number }
export interface SkyState {
  sun: Body & { color: string; glow: number };
  moon: Body & { phase: number; fraction: number; tilt: number; warm: number };
  /** 0 = night … 1 = day */
  daylight: number;
  stars: number;
  /** violet haze of twilight, 0..1 */
  twilight: number;
  /** warm glow along the horizon (sunrise / sunset), 0..1 */
  glow: number;
  glowColor: string;
  morning: boolean;
  /** next sun event for the UI */
  next: { kind: "sunrise" | "sunset"; at: Date };
}

// Where a body is drawn: a fixed spot in the top-right corner (clear of the header and the text), drifting a little
// upward as its REAL altitude rises: 24% of the viewport height at the horizon, 13% from 60° up.
const yFor = (altDeg: number) => 24 - clamp(altDeg / 60) * 11;

export function skyAt(now: Date): SkyState {
  const sp = SunCalc.getPosition(now, MALE.lat, MALE.lng);
  const mp = SunCalc.getMoonPosition(now, MALE.lat, MALE.lng);
  const mi = SunCalc.getMoonIllumination(now);
  const times = SunCalc.getTimes(now, MALE.lat, MALE.lng);
  const sunAlt = deg(sp.altitude), moonAlt = deg(mp.altitude);

  // ---- sun
  // At 4°N the sun always rises and sets, so these are never null; the fallbacks are belt and braces.
  const sunrise = times.sunrise ?? new Date(now.getTime() - 6 * 3600_000), sunset = times.sunset ?? new Date(now.getTime() + 6 * 3600_000);
  const rise = sunrise.getTime(), set = sunset.getTime(), n = now.getTime();
  const sunY = yFor(Math.max(sunAlt, 0));
  const sunColor = sunAlt < 3 ? mix("#ff6a3a", "#ff9d4d", sunAlt / 3 + 0.4) : mix("#ffb347", "#fff1b8", (sunAlt - 3) / 25);

  // ---- moon
  const moonY = yFor(Math.max(moonAlt, 0));

  // Tilt: the lit side always faces the sun. Angle (clockwise from up) of the sun as seen from the moon, in a local
  // sky frame (facing south: west to the right). Independent of hemisphere and of any sign convention.
  let dAz = sp.azimuth - mp.azimuth;
  dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
  const toSun = deg(Math.atan2(dAz * Math.cos(mp.altitude), sp.altitude - mp.altitude)); // 0 = up, 90 = right
  const waxing = mi.phase < 0.5;
  const tilt = toSun - (waxing ? 90 : -90); // the drawing has its lit side on the right (waxing) / left (waning)

  // ---- light
  const daylight = smooth(-8, 6, sunAlt);
  const twilight = smooth(-18, -8, sunAlt) * (1 - smooth(-2, 6, sunAlt));
  const morning = sp.azimuth < 0; // east of south
  const glow = clamp(1 - Math.abs(sunAlt + 1.5) / 9) * 0.95;
  const stars = 1 - smooth(-12, -2, sunAlt);

  const tomorrowRise = SunCalc.getTimes(new Date(n + 86_400_000), MALE.lat, MALE.lng).sunrise ?? new Date(n + 86_400_000);
  const next: SkyState["next"] = n < rise ? { kind: "sunrise", at: sunrise } : n < set ? { kind: "sunset", at: sunset } : { kind: "sunrise", at: tomorrowRise };

  return {
    sun: { alt: sunAlt, y: sunY, visible: smooth(-4, 1, sunAlt), color: sunColor, glow: clamp(1 - sunAlt / 40, 0.25, 1) },
    moon: { alt: moonAlt, y: moonY, visible: smooth(-3, 2, moonAlt) * (0.5 + 0.5 * (1 - daylight)), phase: mi.phase, fraction: mi.fraction, tilt, warm: 1 - clamp(moonAlt / 30) },
    daylight, stars, twilight, glow, glowColor: morning ? "#ffb07a" : "#ff8a5c", morning, next,
  };
}

export const DAY_SKY = ["#1a6483", "#14516a", "#0e3d52"] as const;
export const NIGHT_SKY = ["#17475a", "#0f3140", "#0a2331"] as const;

/** Malé clock time, e.g. "06:12". */
export const maleTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Indian/Maldives", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
