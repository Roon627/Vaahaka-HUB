import { handle } from "@/lib/fodibey/router";

// Node runtime (node:crypto) and never cached: every call is authenticated and live.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { path?: string[] } };
const h = (req: Request, { params }: Ctx) => handle(req, params.path);

export const GET = h;
export const POST = h;
export const PATCH = h;
export const DELETE = h;
export const OPTIONS = h;
