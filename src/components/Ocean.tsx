"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { moonPhase } from "@/lib/moon";
import { useWeather } from "@/lib/weather";
import Moon from "./Moon";

interface Star { id: number; x: number; y: number; s: number; dur: number; delay: number }
interface Rise { id: number; left: number; size: number; dur: number; delay: number; bubble: boolean; warm: boolean }
interface Ripple { id: number; x: number; y: number }

/**
 * The whole app lives in this scene, fixed behind the content.
 * Scrolling is DIVING: `depth` (0 at the surface → 1 after ~3500px) crossfades
 *   moonlit night sky  →  lightless deep,
 * fading out the stars, moon and light-rays while bioluminescence blooms.
 * A soft "lantern" follows the pointer and every tap sends out a ripple.
 * Random elements are generated after mount so server/client markup agree.
 */
export default function Ocean() {
  // The map page is a data view: fade out the moon, stars and rays and settle into the deep.
  const calm = usePathname() === "/map";
  const { scrollY } = useScroll();
  const depth = useTransform(scrollY, [0, 3500], [0, 1]);
  const starsO = useTransform(depth, [0, 0.45], [1, 0]);
  const moonO = useTransform(depth, [0, 0.35], [1, 0]);
  const moonY = useTransform(scrollY, [0, 900], [0, -180]);
  const raysO = useTransform(depth, [0, 0.55], [0.6, 0]);
  const glowO = useTransform(depth, [0.25, 1], [0, 1]);

  const [stars, setStars] = useState<Star[]>([]);
  const [rise, setRise] = useState<Rise[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const lamp = useRef<HTMLDivElement>(null);
  const weather = useWeather();
  const [moon, setMoon] = useState(() => moonPhase(new Date(0))); // real phase set after mount (avoids SSR mismatch)
  useEffect(() => setMoon(moonPhase()), []);

  useEffect(() => {
    // Phones (and reduced-motion users) get a lighter scene: fewer elements, same mood.
    const light = window.innerWidth < 640 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStars(Array.from({ length: light ? 40 : 90 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 46, s: 1 + Math.random() * 1.8,
      dur: 2.5 + Math.random() * 4, delay: -Math.random() * 6,
    })));
    setRise(Array.from({ length: light ? 8 : 26 }, (_, i) => ({
      id: i, left: Math.random() * 100, size: i % 2 ? 3 + Math.random() * 4 : 6 + Math.random() * 10,
      dur: 16 + Math.random() * 22, delay: -Math.random() * 32, bubble: i % 2 === 0, warm: Math.random() < 0.3,
    })));

    let n = 0;
    const moveLamp = (x: number, y: number) => {
      lamp.current?.style.setProperty("--mx", `${x}px`);
      lamp.current?.style.setProperty("--my", `${y}px`);
    };
    const onDown = (e: PointerEvent) => {
      moveLamp(e.clientX, e.clientY);
      const id = ++n;
      setRipples((r) => [...r.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 1400);
    };
    const onMove = (e: PointerEvent) => moveLamp(e.clientX, e.clientY);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Moonlit surface water */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#17475a 0%,#0f3140 38%,#0a2331 100%)" }} />
      {/* ...crossfading to the lightless deep */}
      <motion.div className="absolute inset-0" style={{ opacity: depth, background: "linear-gradient(180deg,#08202d 0%,#051520 45%,#030a12 100%)" }} />
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: calm ? 0.9 : 0 }} transition={{ duration: 0.9 }} style={{ background: "linear-gradient(180deg,#08202d 0%,#051520 45%,#030a12 100%)" }} />
      {/* Bioluminescent bloom, only down deep */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: glowO,
          background:
            "radial-gradient(40rem 26rem at 18% 88%, rgba(159,227,208,.13), transparent 70%), radial-gradient(36rem 26rem at 86% 58%, rgba(140,160,255,.10), transparent 70%)",
        }}
      />

      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: calm ? 0 : 1 }} transition={{ duration: 0.9 }}>
      {/* Stars + a rare shooting star */}
      <motion.div className="absolute inset-0" style={{ opacity: starsO }}>
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute animate-twinkle rounded-full bg-foam"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
          />
        ))}
        <div className="absolute right-[8%] top-[12%] rotate-[24deg]">
          <span className="block h-px w-32 animate-shoot bg-gradient-to-r from-transparent to-white/90" />
        </div>
      </motion.div>

      {/* The moon, in tonight's real phase; its glow scales with how much of it is lit */}
      <motion.div className="absolute right-[7%] top-[3.75rem] sm:right-[9%] sm:top-24" style={{ y: moonY, opacity: moonO }}>
        <div className="relative h-[4.5rem] w-[4.5rem] animate-breathe rounded-full sm:h-44 sm:w-44"
          style={{ boxShadow: `0 0 80px 18px rgba(247,213,142,${0.06 + 0.24 * moon.illumination}), 0 0 220px 60px rgba(247,213,142,${0.03 + 0.1 * moon.illumination})` }}>
          <div className="h-full w-full"><Moon phase={moon.phase} size={176} /></div>
        </div>
      </motion.div>

      {/* When it's raining in Malé, it rains here too */}
      {weather?.rainy && (
        <div className="absolute inset-0">
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="absolute top-[-10%] block h-10 w-px animate-rain bg-gradient-to-b from-transparent to-white/40"
              style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-((i * 0.37) % 1.4)}s`, animationDuration: `${0.9 + ((i * 13) % 7) / 10}s` }} />
          ))}
        </div>
      )}

      {/* Light rays slanting down through the water */}
      <motion.div className="absolute inset-x-0 top-0 h-[75vh] overflow-hidden" style={{ opacity: raysO }}>
        {[8, 26, 47, 66, 86].map((l, i) => (
          <span
            key={l}
            className="absolute -top-10 h-[120%] w-20 origin-top animate-sway bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-xl"
            style={{ left: `${l}%`, animationDelay: `${-i * 2.4}s`, animationDuration: `${10 + i * 2}s` }}
          />
        ))}
      </motion.div>

      </motion.div>

      {/* Lantern light that follows the pointer */}
      <div
        ref={lamp}
        className="absolute inset-0"
        style={{ background: "radial-gradient(280px circle at var(--mx,50%) var(--my,35%), rgba(247,213,142,.10), transparent 70%)" }}
      />

      {/* Bubbles + plankton rising from the seabed */}
      {rise.map((r) => (
        <span
          key={r.id}
          className={`absolute animate-floatup rounded-full ${r.bubble ? "border border-white/30 bg-white/[0.04]" : ""}`}
          style={{
            left: `${r.left}%`, bottom: "-16px", width: r.size, height: r.size,
            ...(r.bubble ? {} : { background: r.warm ? "#f7d58e" : "#9fe3d0", boxShadow: `0 0 ${r.size * 3}px ${r.warm ? "#f7d58e" : "#9fe3d0"}` }),
            animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s`,
          }}
        />
      ))}

      {/* Tap ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute h-24 w-24 rounded-full border border-glow/40"
            style={{ left: r.x - 48, top: r.y - 48 }}
            initial={{ scale: 0.1, opacity: 0.6 }} animate={{ scale: 3, opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
