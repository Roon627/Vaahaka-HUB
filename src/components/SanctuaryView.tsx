"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ARTICLES, type Article } from "@/lib/articles";
import { useSea } from "@/components/SeaProvider";
import { useLanguage } from "@/lib/i18n";
import HelplineCard from "@/components/HelplineCard";
import { HELPLINES } from "@/lib/helplines";

const ALL_TAGS = ["All", "Quiet Boundaries", "Emotional Release", "Grounding Practice", "Compassionate Care", "Peace of Mind"];

export default function SanctuaryView() {
  const { openWriter } = useSea();
  const { lang } = useLanguage();
  const [selectedTag, setSelectedTag] = useState("All");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const filteredArticles = useMemo(() => {
    if (selectedTag === "All") return ARTICLES;
    return ARTICLES.filter((a) => a.tag === selectedTag);
  }, [selectedTag]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-2 sm:px-6">
      {/* Hero Header */}
      <header className="pb-10 pt-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sand/30 bg-sand/10 text-2xl text-sand shadow-inner animate-bob">
          🌿
        </div>
        <h1 className="mt-4 font-display text-3xl font-light text-foam sm:text-4xl md:text-5xl">
          {lang === "dv" ? "ތަސައްލީ: ހިތުގެ ހިމޭން މަންޒިލް" : "The Sanctuary"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-mist">
          {lang === "dv"
            ? "ދިވެހިރާއްޖޭގެ ދިރިއުޅުމުގެ ޙަޤީޤަތްތަކާ ގުޅޭގޮތުން، ނަފްސާނީ ދުޅަހެޔޮކަމާއި ހިތުގެ ހަމަޖެހުމަށް ލިޔެވިފައިވާ ޚާއްޞަ ލިޔުންތައް."
            : "Gentle perspectives on mental wellness, unspoken grief, and finding calm in island communities. Take what resonates, and leave the rest."}
        </p>

        {/* 24/7 Helpline Quick Ribbon */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-coral/30 bg-coral/10 px-4 py-1.5 text-xs text-coral">
          <span>🤍</span>
          <span>In distress right now? Free 24h National Helpline: </span>
          <a href="tel:1677" className="font-bold underline hover:text-white">
            Call 1677
          </a>
        </div>
      </header>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-8">
        {ALL_TAGS.map((tag) => {
          const on = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                on
                  ? "bg-sand text-abyss font-semibold shadow-sm"
                  : "border border-white/10 bg-white/[0.04] text-mist hover:border-sand/30 hover:text-foam"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((art) => (
          <motion.article
            key={art.id}
            whileHover={{ y: -3 }}
            onClick={() => setActiveArticle(art)}
            className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#0c222e]/70 p-6 backdrop-blur-md transition-all hover:border-sand/40 hover:bg-[#0c222e]/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-mist">
                <span className="rounded-full bg-sand/15 px-2.5 py-0.5 font-medium text-sand">
                  {art.tag}
                </span>
                <span>{art.readTime}</span>
              </div>

              <h2 className="mt-4 font-display text-xl font-medium leading-snug text-foam group-hover:text-sand transition-colors">
                {art.title}
              </h2>

              <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-mist/85">
                {art.excerpt}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs font-semibold text-sand">
              <span className="group-hover:underline underline-offset-4">Read reflection →</span>
              <span className="text-mist/50 font-normal">{art.date}</span>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Full Article Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="absolute inset-0 bg-abyss/80 backdrop-blur-md"
            />

            {/* Reader Sheet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#081822] p-6 shadow-2xl sm:p-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveArticle(null)}
                aria-label="Close reflection"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-mist transition hover:bg-white/10 hover:text-foam"
              >
                ✕
              </button>

              {/* Tag and meta */}
              <div className="flex items-center gap-3 text-xs text-mist">
                <span className="rounded-full bg-sand/20 px-3 py-1 font-semibold text-sand">
                  {activeArticle.tag}
                </span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
                <span>•</span>
                <span>{activeArticle.date}</span>
              </div>

              {/* Title */}
              <h1 className="mt-4 font-display text-2xl font-normal leading-tight text-foam sm:text-3xl">
                {activeArticle.title}
              </h1>

              {/* Sections */}
              <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-mist">
                {activeArticle.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-3">
                    {sec.heading && (
                      <h2 className="font-display text-lg font-medium text-foam/90">
                        {sec.heading}
                      </h2>
                    )}

                    {sec.body.map((p, pIdx) => (
                      <p key={pIdx} className="text-mist/90">
                        {p}
                      </p>
                    ))}

                    {sec.quote && (
                      <blockquote className="my-4 border-l-2 border-sand/60 bg-white/[0.02] pl-4 py-2 font-display italic text-sand/90">
                        "{sec.quote}"
                      </blockquote>
                    )}

                    {sec.practice && (
                      <div className="my-5 rounded-2xl border border-sand/20 bg-sand/[0.04] p-5">
                        <div className="flex items-center gap-2 font-display text-sm font-semibold text-sand">
                          <span>🌊</span>
                          <span>{sec.practice.title}</span>
                        </div>
                        <ol className="mt-3 list-decimal list-inside space-y-2 text-xs leading-relaxed text-foam/80">
                          {sec.practice.steps.map((st, sIdx) => (
                            <li key={sIdx}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Takeaways */}
              {activeArticle.takeaways.length > 0 && (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-display text-sm font-medium text-foam">
                    Quiet Reminders for Today
                  </h3>
                  <ul className="mt-3 list-disc list-inside space-y-1.5 text-xs text-mist">
                    {activeArticle.takeaways.map((t, tIdx) => (
                      <li key={tIdx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prompt to release a letter */}
              <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-sand/30 bg-sand/10 p-5 text-center sm:flex-row sm:text-left">
                <div>
                  <h4 className="font-display text-sm font-medium text-foam">
                    Do you have unspoken thoughts about this?
                  </h4>
                  <p className="mt-0.5 text-xs text-mist">
                    Write them down in a letter. No accounts, no usernames.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveArticle(null);
                    openWriter();
                  }}
                  className="shrink-0 rounded-full bg-sand px-4 py-2 text-xs font-semibold text-abyss hover:bg-[#fae8c8] transition"
                >
                  Write to the sea ✍️
                </button>
              </div>

              {/* Helpline Footer */}
              <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-mist">
                <p>
                  Need confidential support right now? Call Maldives 24h Helpline:{" "}
                  <a href="tel:1677" className="font-bold text-coral underline">
                    1677
                  </a>
                  {" "}(Free) or{" "}
                  <Link href="/help" className="text-sand underline">
                    view all local helplines
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support directory bottom section */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-[#091a24] p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-coral">
              Always Free & Confidential
            </span>
            <h2 className="mt-1 font-display text-2xl font-light text-foam">
              Maldives Emergency & Mental Health Helplines
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-mist max-w-xl">
              Trained professionals are available 24 hours a day across the Maldives. You never have to explain or apologize for reaching out.
            </p>
          </div>
          <Link
            href="/help"
            className="shrink-0 rounded-full border border-sand/40 bg-sand/15 px-6 py-3 text-xs font-semibold text-sand hover:bg-sand hover:text-abyss transition-all"
          >
            Explore Helplines Directory →
          </Link>
        </div>
      </section>
    </div>
  );
}
