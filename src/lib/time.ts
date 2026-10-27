/** "5m ago", "2d ago", else a locale date. */
export function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [[60, "s"], [3600, "m"], [86400, "h"], [604800, "d"]];
  let div = 1;
  for (const [limit, unit] of steps) {
    if (s < limit) return `${Math.floor(s / div)}${unit} ago`;
    div = limit;
  }
  return new Date(iso).toLocaleDateString();
}
