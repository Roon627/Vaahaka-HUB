"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { DAY_SKY, NIGHT_SKY, skyAt, type SkyState } from "@/lib/sky";
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
  // The REAL sky over Malé, recomputed every minute (set after mount so server and client markup agree).
  const [sky, setSky] = useState<SkyState | null>(null);
  useEffect(() => {
    const tick = () => setSky(skyAt(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  const day = sky?.daylight ?? 0;

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
      {/* Sky: night, crossfading to day with the real sun; twilight haze and a glow on the horizon at sunrise/sunset */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg,${NIGHT_SKY[0]} 0%,${NIGHT_SKY[1]} 38%,${NIGHT_SKY[2]} 100%)` }} />
      <div className="absolute inset-0 transition-opacity duration-[4000ms]" style={{ opacity: day, background: `linear-gradient(180deg,${DAY_SKY[0]} 0%,${DAY_SKY[1]} 45%,${DAY_SKY[2]} 100%)` }} />
      <div className="absolute inset-0 transition-opacity duration-[4000ms]" style={{ opacity: (sky?.twilight ?? 0) * 0.55, background: "linear-gradient(180deg,#3b2f6e 0%,#5b4486 40%,transparent 80%)" }} />
      <div className="absolute inset-0 transition-opacity duration-[4000ms]" style={{ opacity: sky?.glow ?? 0, background: `radial-gradient(130% 42% at ${sky?.morning ? "22%" : "78%"} 82%, ${sky?.glowColor ?? "#ffb07a"}99 0%, ${sky?.glowColor ?? "#ffb07a"}33 40%, transparent 72%)` }} />
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
      <motion.div className="absolute inset-0 transition-opacity duration-[4000ms]" style={{ opacity: starsO, filter: `opacity(${sky?.stars ?? 1})` }}>
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

      {/* The sun and moon, where they REALLY are over Malé right now. Both sit behind all text, below the header.
          x = progress between rise and set, y = real altitude. */}
      {sky && (
        <>
          <motion.div className="absolute" style={{ right: "7%", top: `${sky.sun.y}%`, y: moonY, opacity: moonO, translateX: "50%", translateY: "-50%" }}>
            <div className="transition-opacity duration-[4000ms]" style={{ opacity: sky.sun.visible }}>
              <div className="h-12 w-12 rounded-full sm:h-28 sm:w-28"
                style={{ background: `radial-gradient(circle at 40% 38%, #fffdf2 0%, ${sky.sun.color} 62%)`, boxShadow: `0 0 ${50 * sky.sun.glow + 20}px ${14 * sky.sun.glow}px ${sky.sun.color}88, 0 0 160px 50px ${sky.sun.color}33` }} />
            </div>
          </motion.div>

          <motion.div className="absolute" style={{ right: sky.sun.visible > 0.3 && sky.moon.visible > 0.3 ? "calc(7% + 68px)" : "7%", top: `${sky.moon.y}%`, y: moonY, opacity: moonO, translateX: "50%", translateY: "-50%" }} transition={{ duration: 1 }}>
            <div className="transition-opacity duration-[4000ms]" style={{ opacity: sky.moon.visible }}>
              <div className="h-10 w-10 rounded-full sm:h-24 sm:w-24"
                style={{ transform: `rotate(${sky.moon.tilt}deg)`, filter: `sepia(${0.75 * sky.moon.warm}) saturate(${1 + sky.moon.warm * 0.6})`,
                  boxShadow: `0 0 70px 14px rgba(247,213,142,${(0.05 + 0.22 * sky.moon.fraction) * (1 - day)}), 0 0 200px 50px rgba(247,213,142,${(0.02 + 0.08 * sky.moon.fraction) * (1 - day)})` }}>
                <Moon phase={sky.moon.phase} size={96} />
              </div>
            </div>
          </motion.div>
        </>
      )}

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
      <motion.div className="absolute inset-x-0 top-0 h-[75vh] overflow-hidden" style={{ opacity: raysO, filter: `opacity(${0.4 + day * 0.9})` }}>
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
