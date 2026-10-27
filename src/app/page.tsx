import { Suspense } from "react";
import DumpingGround from "@/components/DumpingGround";

// useSearchParams() in the feed requires a Suspense boundary.
export default function Home() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-mist">Listening…</p>}>
      <DumpingGround />
    </Suspense>
  );
}
