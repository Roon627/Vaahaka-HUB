"use client";
/**
 * Tiny sound engine: every sound is synthesised with the Web Audio API (no audio files, nothing to download).
 * Browsers only allow audio after a tap, so the context is created on the first pointer press (see unlockAudio)
 * and every play call quietly does nothing until then. Sounds can be turned off from the Menu; the choice is remembered.
 */
const KEY = "ihusaas.sound";
export const SOUND_EVENT = "ihusaas:sound";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export const soundOn = () => { try { return localStorage.getItem(KEY) !== "off"; } catch { return true; } };
export function setSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode: lasts until reload */ }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

/** Call from a user gesture (first tap anywhere). */
export const unlockAudio = () => { ac(); };

function noiseBuf(c: AudioContext) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** A burst of filtered noise: the building block of water, paper and crumple sounds. */
function burst(c: AudioContext, at: number, dur: number, type: BiquadFilterType, f0: number, f1: number, gain: number, q = 0.8) {
  const src = c.createBufferSource(); src.buffer = noiseBuf(c);
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(at, Math.random() * 0.4, dur + 0.05);
}

function blip(c: AudioContext, at: number, f0: number, f1: number, dur: number, gain: number) {
  const o = c.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + 0.02);
}

/** A bottle hitting the sea: a low "plonk", a bright splash, a soft wash, then a few rising bubbles. */
export function playSplash(strength = 1) {
  if (!soundOn()) return;
  const c = ac(); if (!c || c.state !== "running") return;
  const t = c.currentTime + 0.01, s = Math.min(1, Math.max(0.2, strength));
  blip(c, t, 170, 48, 0.22, 0.5 * s);                       // the plonk
  burst(c, t, 0.5, "bandpass", 2600, 700, 0.42 * s, 0.9);  // the splash
  burst(c, t + 0.04, 1.0, "lowpass", 1400, 260, 0.2 * s);  // the wash settling
  for (let i = 0; i < 6; i++) {                              // bubbles
    const at = t + 0.14 + Math.random() * 0.6, f = 380 + Math.random() * 600;
    blip(c, at, f, f * (1.5 + Math.random() * 0.5), 0.07 + Math.random() * 0.05, 0.1 * s);
  }
}

/** A page ripped off a pad and scrunched up. */
export function playTear() {
  if (!soundOn()) return;
  const c = ac(); if (!c || c.state !== "running") return;
  const t = c.currentTime + 0.01;
  burst(c, t, 0.32, "bandpass", 5200, 1800, 0.34, 0.6);        // the rip
  for (let i = 0; i < 7; i++) burst(c, t + 0.05 + i * 0.035, 0.04, "highpass", 3000, 2400, 0.1 + Math.random() * 0.08); // fibres snapping
  for (let i = 0; i < 5; i++) burst(c, t + 0.3 + i * 0.07 + Math.random() * 0.03, 0.06, "bandpass", 1800 + Math.random() * 1500, 900, 0.16); // the scrunch
}
