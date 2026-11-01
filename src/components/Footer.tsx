"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSea } from "./SeaProvider";
import { useLanguage } from "@/lib/i18n";
import SoulsOnline from "./SoulsOnline";

export default function Footer() {
  const path = usePathname();
  const { openWriter, openRandom, finding } = useSea();
  const { lang, t } = useLanguage();

  return (
    <footer className="relative mt-20 border-t border-white/[0.08] bg-[#05131b] text-mist transition-colors pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12">
      {/* Soft teal ocean horizon glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-6 pt-14">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sand/15 text-sand border border-sand/25 transition-transform group-hover:scale-105">
                🍾
              </span>
              <span className="font-display text-xl font-light tracking-wide text-foam group-hover:text-sand transition-colors">
                Ihusaas
              </span>
            </Link>

            <p className="font-serif italic text-sm text-sand/80">
              Say it to the sea.
            </p>

            <p className="text-xs leading-relaxed text-mist/80 max-w-xs">
              An anonymous sanctuary for the Maldives. Set down what you are carrying. Seal it in a bottle. Let the ocean quietly listen.
            </p>

            <div className="pt-2">
              <SoulsOnline />
            </div>
          </div>

          {/* Column 2: Calm Spaces */}
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-foam/90">
              Calm Spaces
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/"
                  className={`transition hover:text-sand ${path === "/" ? "text-sand font-medium" : "text-mist"}`}
                >
                  🌊 {lang === "dv" ? "އައްސޭރި" : "The Shore (Drift)"}
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className={`transition hover:text-sand ${path === "/map" ? "text-sand font-medium" : "text-mist"}`}
                >
                  🗺️ {lang === "dv" ? "އަތޮޅުތަކުގެ ޗާޓު" : "Atoll Map (20 Atolls)"}
                </Link>
              </li>
              <li>
                <Link
                  href="/sanctuary"
                  className={`transition hover:text-sand ${path === "/sanctuary" ? "text-sand font-medium" : "text-mist"}`}
                >
                  🌿 {lang === "dv" ? "ތަސައްލީ (ލިޔުންތައް)" : "The Sanctuary (Articles)"}
                </Link>
              </li>
              <li>
                <button
                  onClick={openRandom}
                  disabled={finding}
                  className="transition hover:text-sand text-left text-mist disabled:opacity-50"
                >
                  🎲 {lang === "dv" ? "ކޮންމެވެސް ސިޓީއެއް" : "Surprise Me (Random Letter)"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => openWriter()}
                  className="font-medium text-sand hover:underline underline-offset-4"
                >
                  ✍️ {lang === "dv" ? "ސިޓީއެއް ލިޔުމަށް" : "Write a Letter"}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Privacy & Anonymity Notes (Reassuring) */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-sand text-sm">🛡️</span>
              <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-foam/90">
                Privacy Notes
              </h3>
            </div>

            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-mist/85">
              <li className="flex items-start gap-1.5">
                <span className="text-sand font-bold">•</span>
                <span><strong>No Accounts:</strong> No sign-up, password, or real name ever requested.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sand font-bold">•</span>
                <span><strong>No IP Logging:</strong> Raw IP addresses are never saved in our database.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sand font-bold">•</span>
                <span><strong>Local Device Token:</strong> Stored only in your browser to avoid self-comments.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sand font-bold">•</span>
                <span><strong>Safety Filters:</strong> Automated blocking of phone numbers, emails, and slurs.</span>
              </li>
            </ul>

            <div className="mt-3 pt-2 border-t border-white/[0.06]">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sand hover:underline"
              >
                <span>Read Full Privacy & Safety Policy</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Column 4: 24/7 Maldives Helplines */}
          <div className="rounded-2xl border border-coral/20 bg-coral/[0.04] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-coral text-sm">🤍</span>
              <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-coral">
                24h Support Helplines
              </h3>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-mist/85">
              Free, confidential crisis lines in the Maldives. You never have to carry distress alone.
            </p>

            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 border border-white/[0.04]">
                <span className="text-foam text-[11px]">National Mental Health</span>
                <a href="tel:1677" className="font-bold text-coral hover:underline">
                  1677
                </a>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 border border-white/[0.04]">
                <span className="text-foam text-[11px]">Child & Family Care</span>
                <a href="tel:1412" className="font-bold text-coral hover:underline">
                  1412
                </a>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 border border-white/[0.04]">
                <span className="text-foam text-[11px]">National Emergency</span>
                <a href="tel:911" className="font-bold text-coral hover:underline">
                  911
                </a>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-coral/10">
              <Link
                href="/help"
                className="text-[11px] font-medium text-coral hover:underline"
              >
                View all support resources →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Location Respect */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-8 text-center text-xs text-mist/70 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Ihusaas (ihusaas.online). Connected across 20 atolls from Haa Alif to Addu.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-sand transition">
              Privacy & Anonymity
            </Link>
            <span>•</span>
            <Link href="/sanctuary" className="hover:text-sand transition">
              Mental Health Articles
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-sand transition">
              Helplines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
