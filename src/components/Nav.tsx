"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/map", label: "Heatmap" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate2/60 bg-abyss/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-foam">
          <span className="animate-drift text-glow">〰️</span> Raalhu
          <span className="hidden text-xs text-mist sm:inline">· ރާޅު</span>
        </Link>
        <nav className="flex gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href} href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${path === l.href ? "bg-glow/10 text-glow" : "text-mist hover:text-foam"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
