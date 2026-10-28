"use client";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, CATEGORY_BY_ID, type CategoryId } from "@/lib/constants";
import MoodSheet from "./MoodSheet";

/**
 * The mood filter, living in the bottom menu (and the desktop nav). The icon is the mascot wearing the current mood.
 * Picking a mood filters the feed; from another page it takes you to the feed, filtered.
 */
function Inner({ variant }: { variant: "dock" | "pill" }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const raw = params.get("cat");
  const value = path === "/" && CATEGORIES.some((c) => c.id === raw) ? (raw as CategoryId) : null;
  const color = value ? CATEGORY_BY_ID[value].color : "#9fe3d0";

  const pick = (c: CategoryId | null) => {
    const next = new URLSearchParams(path === "/" ? params.toString() : "");
    c ? next.set("cat", c) : next.delete("cat");
    const url = `/?${next.toString()}`;
    path === "/" ? router.replace(url, { scroll: false }) : router.push(url);
  };

  const face = (
    <motion.img key={value ?? "all"} src={`/brand/stickers/${value ?? "happy"}.svg`} alt="" width={22} height={26}
      initial={{ scale: 0.5, rotate: -16 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 14 }}
      className={variant === "dock" ? "h-6 w-auto" : "h-5 w-auto"} />
  );

  return (
    <>
      {variant === "dock" ? (
        <button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Mood: ${value ? CATEGORY_BY_ID[value].label : "every mood"}. Change`}
          className="flex min-h-12 w-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px]"
          style={{ color: value ? color : "#9db9b8", background: value ? `${color}1f` : undefined }}>
          {face}<span className="max-w-full truncate">{value ? CATEGORY_BY_ID[value].label : "Mood"}</span>
        </button>
      ) : (
        <button onClick={() => setOpen(true)} aria-haspopup="dialog" className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-mist transition hover:bg-white/10 hover:text-foam"
          style={value ? { color, background: `${color}1f` } : undefined}>
          {face}<span>{value ? CATEGORY_BY_ID[value].label : "Mood"}</span>
        </button>
      )}
      <AnimatePresence>{open && <MoodSheet value={value} onChange={pick} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

export default function MoodDock({ variant }: { variant: "dock" | "pill" }) {
  // useSearchParams needs a Suspense boundary when rendered from the root layout
  return <Suspense fallback={null}><Inner variant={variant} /></Suspense>;
}
