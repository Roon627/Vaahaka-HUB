import type { Metadata } from "next";
import SanctuaryView from "@/components/SanctuaryView";

export const metadata: Metadata = {
  title: "Sanctuary · Gentle Mental Health Reflections",
  description:
    "A quiet harbor for the heart. Perspectives on mental wellness, unspoken grief, and emotional peace for island life in the Maldives.",
};

export const dynamic = "force-static";

export default function SanctuaryPage() {
  return <SanctuaryView />;
}
