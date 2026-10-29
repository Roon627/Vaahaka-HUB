"use client";
/**
 * Sound effects: short real recordings (public domain, see public/sounds/CREDITS.txt) played with the Web Audio API.
 * Browsers only allow audio after a tap, so the context is created on the first pointer press (see unlockAudio), which
 * also downloads the little files (about 90 KB in all). Until then every play call quietly does nothing.
 * Each play picks one of a few takes at random with a touch of pitch variation, so it never sounds like a loop.
 * Sounds can be turned off from the Menu; the choice is remembered.
 */
const KEY = "ihusaas.sound";
export const SOUND_EVENT = "ihusaas:sound";

const FILES = {
  tear: [1, 2, 3].map((i) => `/sounds/paper-crumple-${i}.mp3`),
  splash: [1, 2, 3].map((i) => `/sounds/splash-${i}.mp3`),
} as const;
type Kind = keyof typeof FILES;

let ctx: AudioContext | null = null;
let loading = false;
const buffers: Record<Kind, AudioBuffer[]> = { tear: [], splash: [] };
const last: Record<Kind, number> = { tear: -1, splash: -1 };

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

async function preload(c: AudioContext) {
  if (loading) return;
  loading = true;
  await Promise.all((Object.keys(FILES) as Kind[]).flatMap((k) => FILES[k].map(async (url) => {
    try {
      const data = await (await fetch(url)).arrayBuffer();
      buffers[k].push(await new Promise<AudioBuffer>((ok, bad) => c.decodeAudioData(data, ok, bad)));
    } catch { /* a missing take just means one fewer variation */ }
  })));
}

/** Call from a user gesture (first tap anywhere). */
export function unlockAudio() { const c = ac(); if (c) void preload(c); }

function play(kind: Kind, gain: number) {
  if (!soundOn()) return;
  const c = ac(); const list = buffers[kind];
  if (!c || c.state !== "running" || !list.length) return;
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === last[kind]) i = (i + 1) % list.length; // never the same take twice in a row
  last[kind] = i;
  const src = c.createBufferSource(); src.buffer = list[i];
  src.playbackRate.value = 0.94 + Math.random() * 0.12;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(g).connect(c.destination); src.start();
}

/** A bottle landing in the sea. `strength` 0..1: other people's bottles arrive softer than yours. */
export const playSplash = (strength = 1) => play("splash", 0.5 + 0.5 * Math.min(1, Math.max(0, strength)));

/** A page torn off the pad and crumpled. */
export const playTear = () => play("tear", 0.9);
