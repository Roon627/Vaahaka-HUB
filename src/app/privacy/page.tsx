import type { Metadata } from "next";
import Link from "next/link";
import SuggestLink from "@/components/SuggestLink";

export const metadata: Metadata = {
  title: "Privacy & Anonymity",
  description:
    "How Ihusaas protects your identity. No accounts, no IP address storage, no tracking algorithms.",
};
export const dynamic = "force-static";

export default function Privacy() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      <header className="pb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sand/30 bg-sand/10 text-2xl text-sand shadow-inner">
          🔒
        </div>
        <h1 className="mt-4 font-display text-3xl font-light text-foam sm:text-4xl">
          Privacy & Anonymity
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-mist">
          Ihusaas was built as an anonymous sanctuary for Maldivians to set down what they are
          carrying. Here is exactly how your privacy is protected.
        </p>
      </header>

      <div className="space-y-6">
        {/* Core Principles */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-foam">1. Zero Accounts & No Personal Data</h2>
          <p className="mt-2 text-mist/90">
            There are no sign-ups, passwords, email requests, phone numbers, or social logins.
            When you visit Ihusaas, you do not have an account. We do not know who you are, and
            we never ask.
          </p>
        </div>

        {/* IP Addresses & Server Logging */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-foam">2. No IP Addresses in the Database</h2>
          <p className="mt-2 text-mist/90">
            Your letters and reactions in the sea are never associated with your IP address.
            When suggestions are submitted, your IP is passed through a one-way cryptographic SHA-256
            salt hash solely to prevent automated denial-of-service floods, and the raw IP is immediately
            discarded.
          </p>
        </div>

        {/* Device Memory */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-foam">3. Client-Side Device Token</h2>
          <p className="mt-2 text-mist/90">
            To prevent you from accidentally reacting to your own letters or spamming identical notes,
            your browser generates a random UUID stored only on your own device in{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-sand">localStorage</code>.
            This random token contains no personal, demographic, hardware, or geographic details and can
            be reset at any time by clearing your browser site data or turning off Device Memory in the Menu.
          </p>
        </div>

        {/* Live Shore Counter */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-foam">4. Live Shore Counter</h2>
          <p className="mt-2 text-mist/90">
            The counter showing visitors on the shore uses an ephemeral in-memory presence channel.
            Each open tab broadcasts only a timestamp (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-sand">at: timestamp</code>).
            No IP addresses, coordinates, or locations are ever broadcast or stored.
          </p>
        </div>

        {/* Content Moderation & Safety */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-foam">5. Content Safety & Abuse Prevention</h2>
          <p className="mt-2 text-mist/90">
            To ensure the sanctuary remains safe, compassionate, and legally sound:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-mist/85">
            <li>
              <strong>Automated Filters:</strong> Normalized lexical filters automatically block
              harassment, threats, CSAM/abuse, doxxing, phone numbers, email addresses, and racial/religious slurs.
            </li>
            <li>
              <strong>Community Reporting:</strong> Any visitor can flag a letter or note. Multiple
              flags automatically hide content from public view until human review.
            </li>
            <li>
              <strong>Rate Limiting:</strong> Enforced in the database to prevent bot flooding.
            </li>
          </ul>
        </div>

        {/* Support Link */}
        <div className="rounded-3xl border border-coral/20 bg-coral/[0.05] p-6 text-[14px] leading-relaxed text-mist">
          <h2 className="font-display text-lg font-medium text-coral">Crisis & Mental Health Support</h2>
          <p className="mt-2 text-mist/90">
            If you or someone you know is going through a difficult time, please reach out to free,
            confidential Maldivian support lines. You are never alone.
          </p>
          <div className="mt-4">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-coral/20 px-4 py-2 text-sm font-medium text-coral hover:bg-coral/30"
            >
              <span>View Maldives Helplines (1677, 1412, 911)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-[13px] text-mist">
        <p>Questions or security concerns? <br /><SuggestLink className="mt-3" /></p>
        <div className="mt-6">
          <Link href="/" className="text-sand/80 hover:text-sand hover:underline">
            ← Return to the Shore
          </Link>
        </div>
      </footer>
    </section>
  );
}
