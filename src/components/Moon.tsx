import { litPath } from "@/lib/moon";

/**
 * Tonight's real moon. The lit side is drawn from the actual phase; the dark side keeps a faint earthshine.
 * The surface has maria, a few craters, Tycho's rays and grain, and darkens toward the limb, so it reads as the moon and not a yellow disc.
 */
export default function Moon({ phase, size }: { phase: number; size: number }) {
  const r = 50;
  const surface = (
    <>
      {/* maria: the dark seas */}
      <g filter="url(#moonblur)" fill="#8d897b" opacity=".62">
        <path d="M30 24c7-6 17-5 21 1 3 6-2 12-9 14-7 2-15 0-17-6-1-4 1-7 5-9z" />{/* Imbrium */}
        <ellipse cx="57" cy="37" rx="7" ry="6" />{/* Serenitatis */}
        <ellipse cx="62" cy="49" rx="9" ry="6.5" />{/* Tranquillitatis */}
        <ellipse cx="80" cy="38" rx="4.5" ry="3.5" />{/* Crisium */}
        <path d="M14 38c4-5 9-3 11 3 2 7-1 15-6 19-5 3-9-2-9-9 0-5 1-9 4-13z" />{/* Procellarum */}
        <ellipse cx="38" cy="64" rx="8" ry="5.5" />{/* Nubium */}
        <ellipse cx="24" cy="66" rx="5" ry="4" />{/* Humorum */}
        <ellipse cx="53" cy="55" rx="5" ry="3.5" opacity=".7" />{/* Vapores */}
      </g>
      {/* craters */}
      <g fill="none" stroke="#6f6b60" strokeWidth=".7" opacity=".5">
        <circle cx="41" cy="45" r="2.4" /><circle cx="48" cy="29" r="1.8" /><circle cx="31" cy="53" r="2" /><circle cx="70" cy="62" r="2.6" /><circle cx="58" cy="72" r="2" /><circle cx="26" cy="79" r="2.2" />
      </g>
      {/* Tycho and its rays */}
      <g opacity=".8">
        <g stroke="#fffdf4" strokeWidth=".9" strokeLinecap="round" opacity=".5"><path d="M44 83L30 62M44 83L58 62M44 83L66 76M44 83L22 76M44 83L44 60" /></g>
        <circle cx="44" cy="83" r="2.1" fill="#fffdf4" />
      </g>
      {/* fine grain */}
      <rect width="100" height="100" filter="url(#moongrain)" opacity=".35" style={{ mixBlendMode: "multiply" }} />
    </>
  );
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="moonlit" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#f6f3ea" /><stop offset=".7" stopColor="#e6e1d2" /><stop offset="1" stopColor="#bfb9a6" /></radialGradient>
        <radialGradient id="moonlimb" cx=".5" cy=".5" r=".5"><stop offset=".62" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#1b1a16" stopOpacity=".5" /></radialGradient>
        <clipPath id="moonclip"><path d={litPath(phase, 50, 50, r)} /></clipPath>
        <clipPath id="moondisc"><circle cx="50" cy="50" r={r} /></clipPath>
        <filter id="moonblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id="moongrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      {/* the unlit side: earthshine, a ghost of the same surface */}
      <g clipPath="url(#moondisc)">
        <circle cx="50" cy="50" r={r} fill="#1d2c36" opacity=".78" />
        <g opacity=".1">{surface}</g>
      </g>
      {/* the lit side */}
      <g clipPath="url(#moonclip)">
        <circle cx="50" cy="50" r={r} fill="url(#moonlit)" />
        <g clipPath="url(#moondisc)">{surface}</g>
        <circle cx="50" cy="50" r={r} fill="url(#moonlimb)" />
      </g>
    </svg>
  );
}
