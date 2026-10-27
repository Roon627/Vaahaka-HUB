import type { Metadata } from "next";
import HelplineCard from "@/components/HelplineCard";
import { HELPLINES, HELPLINES_CHECKED } from "@/lib/helplines";

export const metadata: Metadata = { title: "Get help now", description: "Free and confidential helplines in the Maldives, including the 24-hour national mental health line (1677)." };
export const dynamic = "force-static"; // precached by the service worker so it opens offline

export default function Help() {
  const [emergency, mental, ...rest] = HELPLINES;
  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12 pt-2">
      <header className="pb-6 text-center">
        <img src="/brand/stickers/happy.svg" alt="" width={84} height={100} className="mx-auto animate-bob" />
        <h1 className="mt-4 font-display text-3xl font-light text-foam sm:text-4xl">You don't have to carry it alone</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-mist">
          These lines are free to call, and the people on them want to hear from you. Reaching out is not a burden. It's what they're there for.
        </p>
      </header>

      <div className="space-y-4">
        <HelplineCard h={emergency} />
        <HelplineCard h={mental} />
        <h2 className="pt-3 text-xs font-medium uppercase tracking-widest text-sand/80">More support</h2>
        {rest.map((h) => <HelplineCard key={h.id} h={h} />)}
      </div>

      <aside className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-[13px] leading-relaxed text-mist">
        <p><strong className="font-medium text-foam">If you're worried about someone you've read here:</strong> use the flag on their letter and choose “Someone may be in danger”. It won't hide their words; it lets a moderator know support may be needed.</p>
        <p className="mt-3">Numbers last checked on {HELPLINES_CHECKED} against official Maldivian government pages (linked on each card). If one doesn't connect, try 911 or the Ministry of Health. Ihusaas is a community space, not a crisis service.</p>
      </aside>
    </section>
  );
}
