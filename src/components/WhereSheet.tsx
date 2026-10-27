"use client";
import { ATOLLS, ATOLL_BY_CODE } from "@/lib/constants";
import Combobox, { type Opt } from "./Combobox";
import Sheet from "./Sheet";

const OPTS: Opt[] = ATOLLS.map((a) => ({ key: a.code, label: a.name, badge: a.code, hint: a.aka[0], also: [a.code, ...a.aka] }));

/** "Where?": search any atoll by name, code or the older names people actually use. Picking one applies it and closes. */
export default function WhereSheet({ atoll, onAtoll, onClose }: { atoll: string | null; onAtoll: (code: string | null) => void; onClose: () => void }) {
  return (
    <Sheet title="Where?" onClose={onClose}>
      <h2 className="font-display text-2xl text-foam">Where?</h2>
      <p className="font-hand text-xl text-sand/80">See what's washed up near one atoll.</p>
      <div className="mt-4 min-h-[19rem]">
        <Combobox
          tone="sea" label="Atoll" placeholder="Search. Try Kaafu, Ari or Addu…"
          options={OPTS} value={atoll ? ATOLL_BY_CODE[atoll]?.name ?? "" : ""}
          onSelect={(o) => { onAtoll(o?.key ?? null); if (o) onClose(); }} emptyHint="Try the atoll's code or an older name."
        />
      </div>
      {atoll && <button onClick={() => { onAtoll(null); onClose(); }} className="min-h-12 w-full rounded-full border border-white/15 text-sm text-foam transition hover:bg-white/10">Show every atoll</button>}
    </Sheet>
  );
}
