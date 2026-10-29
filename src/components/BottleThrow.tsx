"use client";
import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Bottle from "./Bottle";
import { playSplash } from "@/lib/sound";

const FLIGHT = 0.95; // seconds in the air

/**
 * A bottle is thrown into the sea: it arcs up from the bottom of the screen, lands with a splash
 * (rings, droplets and the sound of water), bobs for a moment and sinks. Used for the letter you
 * send and for bottles other people send while you are here.
 */
export default function BottleThrow({ color, onDone, soft = false }: { color: string; onDone: () => void; soft?: boolean }) {
  const calm = useReducedMotion();
  const drops = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const a = (-160 + i * 14 + Math.random() * 8) * (Math.PI / 180), r = 40 + Math.random() * 60;
    return { x: Math.cos(a) * r, up: Math.abs(Math.sin(a)) * (50 + Math.random() * 60), s: 4 + Math.random() * 5 };
  }), []);
  const side = useMemo(() => (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 14), []); // landing spot, vw from centre

  useEffect(() => {
    const t1 = setTimeout(() => playSplash(soft ? 0.55 : 1), calm ? 0 : FLIGHT * 1000);
    const t2 = setTimeout(onDone, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone, calm, soft]);

  if (calm) return null; // sound only: no motion for people who asked for less

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[56] overflow-hidden">
      {/* the throw */}
      <motion.div className="absolute left-1/2 top-[44%]" style={{ marginLeft: -14 }}
        initial={{ x: 0, y: "52vh", rotate: -20, opacity: 1, scale: 1.1 }}
        animate={{ x: [0, `${side * 0.5}vw`, `${side}vw`], y: ["52vh", "-6vh", "0vh"], rotate: [-20, 140, 300], opacity: [1, 1, 1], scale: [1.1, 1, 0.9] }}
        transition={{ duration: FLIGHT, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }}>
        {/* once landed: bob, tilt and sink */}
        <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: [0, 6, -3, 8, 22], opacity: [1, 1, 1, 1, 0], rotate: [0, 8, -6, 10, 14] }}
          transition={{ delay: FLIGHT, duration: 2.0, times: [0, 0.2, 0.45, 0.7, 1], ease: "easeInOut" }}>
          <Bottle color={color} height={58} />
        </motion.div>
      </motion.div>

      {/* the splash, where it lands */}
      <div className="absolute left-1/2 top-[44%]" style={{ marginLeft: `${side}vw` }}>
        {[0, 0.12, 0.26].map((d, i) => (
          <motion.span key={i} className="absolute -left-10 -top-3 block h-6 w-20 rounded-[50%] border border-white/70"
            initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 2.6 + i * 0.7], opacity: [0.9, 0] }}
            transition={{ delay: FLIGHT + d, duration: 1.3, ease: "easeOut" }} />
        ))}
        {drops.map((p, i) => (
          <motion.span key={i} className="absolute left-0 top-0 block rounded-full bg-white/85" style={{ width: p.s, height: p.s }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: [0, p.x * 0.6, p.x], y: [0, -p.up, 14], opacity: [0, 1, 0] }}
            transition={{ delay: FLIGHT, duration: 0.75 + (i % 3) * 0.1, times: [0, 0.45, 1], ease: "easeOut" }} />
        ))}
        <motion.span className="absolute -left-6 -top-10 block h-12 w-12 rounded-full bg-white/60 blur-md"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1.8], opacity: [0.8, 0.4, 0] }} transition={{ delay: FLIGHT, duration: 0.6 }} />
      </div>
    </div>
  );
}
