"use client";

/**
 * Deterministic, privacy-preserving device fingerprinting for Ihusaas.
 *
 * It combines non-invasive client attributes (screen geometry, timezone,
 * hardware concurrency, canvas text rendering) into a stable fingerprint.
 *
 * This allows Ihusaas to:
 * 1. Recognize letters shared from this device across visits and reloads.
 * 2. Prevent authors from accidentally commenting or reacting to their own letters.
 * 3. Give visitors full control: an explicit toggle in Sanctuary Menu to enable/disable.
 */

function fnv1a(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x84222325;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >> 8), 0x5bd1e995);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${p1}${p2}`;
}

function getCanvasEntropy(): string {
  if (typeof document === "undefined") return "server-canvas";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas-2d";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Geist', 'Dhivehi', -apple-system, sans-serif";
    ctx.fillStyle = "#ecd9b5";
    ctx.fillRect(0, 0, 200, 50);

    ctx.fillStyle = "#0a1c26";
    ctx.fillText("Ihusaas 🌊 އިޙްސާސް", 10, 10);

    ctx.fillStyle = "rgba(235, 160, 196, 0.7)";
    ctx.fillText("Sanctuary for Maldives", 12, 28);

    return canvas.toDataURL();
  } catch {
    return "canvas-blocked";
  }
}

let cachedFingerprint: string | null = null;

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr-device-seed";
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const stored = localStorage.getItem("ihusaas:device_fingerprint");
    if (stored && stored.length >= 24) {
      cachedFingerprint = stored;
      return stored;
    }
  } catch {
    /* ignore */
  }

  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`;
    const timezone = new Date().getTimezoneOffset().toString();
    const hardware = `${navigator.hardwareConcurrency || 2}-${navigator.language || "en"}`;
    const canvasEntropy = getCanvasEntropy();

    const hash1 = fnv1a(screenInfo + timezone);
    const hash2 = fnv1a(hardware);
    const hash3 = fnv1a(canvasEntropy);

    const fp = `dfp-${hash1}-${hash2}-${hash3}`;
    cachedFingerprint = fp;

    try {
      localStorage.setItem("ihusaas:device_fingerprint", fp);
    } catch {
      /* ignore */
    }

    return fp;
  } catch {
    const fallback = `dfp-fallback-${Math.random().toString(36).slice(2, 10)}`;
    cachedFingerprint = fallback;
    return fallback;
  }
}
