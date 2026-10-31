"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { DAY_SKY, NIGHT_SKY, skyAt, type SkyState } from "@/lib/sky";
import { useWeather } from "@/lib/weather";
import Moon from "./Moon";

/** Blend two #rrggbb colours (t = 0 → a, 1 → b). */
const mix = (a: string, b: string, t: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => {
      const x = parseInt(a.slice(i, i + 2), 16),
        y = parseInt(b.slice(i, i + 2), 16);
      return Math.round(x + (y - x) * t)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");

interface Star {
  id: number;
  x: number;
  y: number;
  s: number;
  dur: number;
  delay: number;
}

/**
 * Atmospheric background: fixed behind the app.
 * Refined and quiet:
 * - Real sky over Malé, updated with astronomical accuracy.
 * - Deep oceanic gradient that deepens gently on scroll.
 * - Real local weather (gentle rain when it is raining in Malé).
 * No hyperactive animations, particle spam, or gimmick spotlights.
 */
export default function Ocean() {
  const calm = usePathname() === "/map";
  const { scrollY } = useScroll();
  const depth = useTransform(scrollY, [0, 3500], [0, 1]);
  const starsO = useTransform(depth, [0, 0.45], [0.85, 0]);
  const moonO = useTransform(depth, [0, 0.35], [1, 0]);
  const moonY = useTransform(scrollY, [0, 900], [0, -180]);

  const [stars, setStars] = useState<Star[]>([]);
  const weather = useWeather();
  const [sky, setSky] = useState<SkyState | null>(null);

  useEffect(() => {
    const tick = () => setSky(skyAt(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const day = sky?.daylight ?? 0;

  useEffect(() => {
    const light = window.innerWidth < 640 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStars(
      Array.from({ length: light ? 25 : 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 45,
        s: 1 + Math.random() * 1.4,
        dur: 3.5 + Math.random() * 4,
        delay: -Math.random() * 6,
      }))
    );
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sky: night, crossfading to day with the real sun; twilight haze and horizon glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,${NIGHT_SKY[0]} 0%,${NIGHT_SKY[1]} 38%,${NIGHT_SKY[2]} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[4000ms]"
        style={{
          opacity: day,
          background: `linear-gradient(180deg,${DAY_SKY[0]} 0%,${DAY_SKY[1]} 45%,${DAY_SKY[2]} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[4000ms]"
        style={{
          opacity: (sky?.twilight ?? 0) * 0.45,
          background: "linear-gradient(180deg,#30265b 0%,#4b3870 40%,transparent 80%)",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[4000ms]"
        style={{
          opacity: (sky?.glow ?? 0) * 0.8,
          background: `radial-gradient(130% 42% at ${sky?.morning ? "22%" : "78%"} 82%, ${sky?.glowColor ?? "#ffb07a"}66 0%, ${sky?.glowColor ?? "#ffb07a"}22 40%, transparent 72%)`,
        }}
      />

      {/* Deep ocean gradient on scroll */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: depth,
          background: "linear-gradient(180deg,#081c26 0%,#05131c 45%,#02080f 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: calm ? 0.95 : 0 }}
        transition={{ duration: 0.9 }}
        style={{ background: "linear-gradient(180deg,#081c26 0%,#05131c 45%,#02080f 100%)" }}
      />

      {/* Soft celestial layer: stars and astronomical bodies */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: calm ? 0 : 1 }}
        transition={{ duration: 0.9 }}
      >
        {/* Calm night stars (quiet, no shooting star gimmick) */}
        <motion.div
          className="absolute inset-0 transition-opacity duration-[4000ms]"
          style={{ opacity: starsO, filter: `opacity(${sky?.stars ?? 1})` }}
        >
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute animate-twinkle rounded-full bg-foam/80"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.s,
                height: s.s,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </motion.div>

        {/* Real astronomical Sun and Moon over Malé */}
        {sky && (
          <>
            <motion.div
              className="absolute"
              style={{
                right: "7%",
                top: `${sky.sun.y}%`,
                y: moonY,
                opacity: moonO,
                translateX: "50%",
                translateY: "-50%",
              }}
            >
              <div className="transition-opacity duration-[4000ms]" style={{ opacity: sky.sun.visible }}>
                <div
                  className="h-12 w-12 rounded-full sm:h-20 sm:w-20"
                  style={{
                    background: `radial-gradient(circle, ${mix(sky.sun.color, "#fffffa", 0.9)} 0%, ${mix(sky.sun.color, "#fffdf0", 0.7)} 46%, ${sky.sun.color} 100%)`,
                    boxShadow: `0 0 40px 10px ${sky.sun.color}44, 0 0 100px 30px ${sky.sun.color}22`,
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              className="absolute"
              style={{
                right: sky.sun.visible > 0.3 && sky.moon.visible > 0.3 ? "calc(7% + 68px)" : "7%",
                top: `${sky.moon.y}%`,
                y: moonY,
                opacity: moonO,
                translateX: "50%",
                translateY: "-50%",
              }}
              transition={{ duration: 1 }}
            >
              <div className="transition-opacity duration-[4000ms]" style={{ opacity: sky.moon.visible }}>
                <div
                  className="h-10 w-10 rounded-full sm:h-20 sm:w-20"
                  style={{
                    transform: `rotate(${sky.moon.tilt}deg)`,
                    filter: `sepia(${0.6 * sky.moon.warm}) saturate(${1 + sky.moon.warm * 0.4})`,
                    boxShadow: `0 0 50px 10px rgba(247,213,142,${(0.04 + 0.15 * sky.moon.fraction) * (1 - day)})`,
                  }}
                >
                  <Moon phase={sky.moon.phase} size={80} />
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Rain in Malé */}
        {weather?.rainy && (
          <div className="absolute inset-0">
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="absolute top-[-10%] block h-10 w-px animate-rain bg-gradient-to-b from-transparent to-white/30"
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${-((i * 0.37) % 1.4)}s`,
                  animationDuration: `${0.9 + ((i * 13) % 7) / 10}s`,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
