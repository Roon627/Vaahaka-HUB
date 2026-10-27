"use client";
import { useEffect, useState } from "react";

export interface Island { name: string; atoll: string }

let cache: Promise<Island[]> | null = null;

/** ~14KB of island names keyed by atoll code (public/data/maldives-islands.json). Fetched once, then cached. */
export function loadIslands(): Promise<Island[]> {
  cache ??= fetch("/data/maldives-islands.json")
    .then((r) => r.json())
    .then((d: Record<string, string[]>) => Object.entries(d).flatMap(([atoll, list]) => list.map((name) => ({ name, atoll }))))
    .catch(() => { cache = null; return []; });
  return cache;
}

export function useIslands() {
  const [islands, setIslands] = useState<Island[]>([]);
  useEffect(() => { loadIslands().then(setIslands); }, []);
  return islands;
}
