// Generates the Ihusaas logo pack into public/brand/ (+ the favicon / apple icon in src/app/).
//   npm run brand:build
// Everything is drawn in code, so colours and faces can be tweaked and re-exported in seconds.
// Wordmarks use real outlines from Fraunces (SIL OFL), downloaded at build time.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import * as fontkit from "fontkit";

const OUT = new URL("../public/brand/", import.meta.url);
const APP = new URL("../src/app/", import.meta.url);
for (const d of ["", "png", "stickers"]) mkdirSync(new URL(d, OUT), { recursive: true });
const write = (rel, data) => writeFileSync(new URL(rel, OUT), data);

// ---- palette (same tokens as tailwind.config.ts) ---------------------------------
const C = { abyss: "#0a1c26", deep: "#0f2733", glow: "#9fe3d0", sand: "#ecd9b5", foam: "#f5efe4", coral: "#f4a595", lantern: "#f7d58e", ink: "#24323d" };
const MOODS = {
  happy: C.glow, horror: "#e88b8b", sad: "#8fb6e8", vent: "#f0a870", secrets: "#b9a2e8",
  nostalgia: "#f1d58a", work: "#86cfd8", relationships: "#eba0c4",
};

/** Mix a hex colour toward white by t (0..1). */
const lighten = (hex, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + 255 * t).toString(16).padStart(2, "0")).join("");

// ---- tiny SVG helpers ------------------------------------------------------------
const heart = (cx, cy, s, fill) => `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 9 C-16 -3 -10 -17 0 -9 C10 -17 16 -3 0 9Z" fill="${fill}"/>`;
const sparkle = (cx, cy, r, fill, o = 1) => `<path d="M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z" fill="${fill}" opacity="${o}"/>`;
const line = (d, w = 3.6, c = C.ink) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const eye = (cx, cy, r = 7.5) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ink}"/><circle cx="${cx + r * 0.32}" cy="${cy - r * 0.36}" r="${r * 0.34}" fill="#fff"/><circle cx="${cx - r * 0.3}" cy="${cy + r * 0.32}" r="${r * 0.17}" fill="#fff" opacity=".8"/>`;
const cheeks = (c = "#ff9fb0", o = 0.55) => `<ellipse cx="64" cy="177" rx="10" ry="6" fill="${c}" opacity="${o}"/><ellipse cx="136" cy="177" rx="10" ry="6" fill="${c}" opacity="${o}"/>`;
const ring = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${C.ink}" stroke-width="2.8"/>`;

// ---- the mascot's expressions (face area is roughly x 60-140, y 140-195) ---------
const FACES = {
  happy: () => eye(80, 158, 8) + eye(120, 158, 8) + cheeks() +
    `<path d="M91 172 Q100 191 109 172 Z" fill="#8c3347"/><path d="M95.5 181 Q100 186 104.5 181 Q100 177.5 95.5 181Z" fill="#ff8fa3"/>`,
  horror: () => ring(80, 156, 11) + ring(120, 156, 11) +
    `<circle cx="80" cy="157" r="3.2" fill="${C.ink}"/><circle cx="120" cy="157" r="3.2" fill="${C.ink}"/>` +
    line("M68 138 Q80 131 92 137", 3) + line("M108 137 Q120 131 132 138", 3) +
    `<ellipse cx="100" cy="184" rx="6.5" ry="9" fill="${C.ink}"/><path d="M150 138 q6 10 0 16 q-6 -6 0 -16z" fill="#bfe6ff" stroke="#fff" stroke-width="1.2"/>`,
  sad: () => eye(80, 160, 9) + eye(120, 160, 9) + line("M66 148 L91 141", 3.2) + line("M109 141 L134 148", 3.2) +
    cheeks("#ff9fb0", 0.35) + line("M91 187 Q100 177 109 187", 3.6) +
    `<path d="M72 172 q7 11 0 17 q-7 -6 0 -17z" fill="#8fd3ff" stroke="#fff" stroke-width="1.4"/>`,
  vent: () => eye(80, 160, 6.5) + eye(120, 160, 6.5) + line("M66 144 L91 152", 5) + line("M109 152 L134 144", 5) +
    cheeks("#ff6b6b", 0.7) + line("M90 186 Q100 177 110 186", 3.8) +
    `<circle cx="152" cy="62" r="7" fill="#fff" opacity=".85"/><circle cx="164" cy="46" r="9" fill="#fff" opacity=".8"/><circle cx="154" cy="30" r="6" fill="#fff" opacity=".75"/>`,
  secrets: () => ring(80, 158, 9.5) + ring(120, 158, 9.5) +
    `<circle cx="84" cy="156" r="4.6" fill="${C.ink}"/><circle cx="124" cy="156" r="4.6" fill="${C.ink}"/>` +
    line("M68 144 Q80 139 92 144", 3) + line("M108 140 Q120 134 132 141", 3) + cheeks("#ff9fb0", 0.45) +
    line("M88 182 H112", 3.4) + line("M92 178.5 v7 M97 178.5 v7 M102 178.5 v7 M107 178.5 v7", 2.2),
  nostalgia: () => line("M71 161 Q80 150 89 161", 4.2) + line("M111 161 Q120 150 129 161", 4.2) + cheeks("#ff9fb0", 0.6) +
    line("M91 175 Q100 185 109 175", 3.8) + sparkle(150, 110, 7, C.lantern) + sparkle(44, 128, 5, C.lantern, 0.9),
  work: () => line("M71 160 H89", 4.4) + line("M111 160 H129", 4.4) +
    `<ellipse cx="80" cy="169" rx="9" ry="3.2" fill="#6f7fa8" opacity=".4"/><ellipse cx="120" cy="169" rx="9" ry="3.2" fill="#6f7fa8" opacity=".4"/>` +
    cheeks("#ff9fb0", 0.25) + line("M90 183 Q95 178.5 100 183 T110 183", 3.4) +
    `<rect x="95.5" y="190" width="9" height="7" rx="2.5" fill="#4a78c9"/><path d="M96 196 L104 196 L106.5 214 L100 220 L93.5 214Z" fill="#4a78c9"/>`,
  relationships: () => heart(80, 157, 0.95, "#ff5c8a") + heart(120, 157, 0.95, "#ff5c8a") + cheeks("#ff9fb0", 0.65) +
    `<path d="M92 174 Q100 187 108 174 Z" fill="#8c3347"/>` + heart(152, 76, 0.7, "#ff8fb0") + heart(46, 92, 0.5, "#ff8fb0"),
};

// ---- the mascot: a chubby glass bottle with a face and a heart-scroll inside -----
const BODY = "M82 38 L82 76 C82 96 34 104 34 156 C34 204 62 226 100 226 C138 226 166 204 166 156 C166 104 118 96 118 76 L118 38 Z";
/** Returns { defs, art } in a 200x240 box. `id` keeps gradient ids unique when several mascots share one SVG. */
function mascot(id, color, face = "happy", { waves = false, puddle = false, glowBlob = true, solid = false } = {}) {
  const defs = `
    <clipPath id="${id}c"><path d="${BODY}"/></clipPath>
    <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
    <radialGradient id="${id}l" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity=".14"/></radialGradient>
    <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`;
  const art = `
    ${glowBlob ? `<ellipse cx="100" cy="170" rx="82" ry="72" fill="${color}" opacity=".3" filter="url(#${id}b)"/>` : ""}
    ${waves ? `<path d="M-10 212 Q15 198 40 212 T90 212 T140 212 T190 212 T240 212 V250 H-10Z" fill="#7fd0d2" opacity=".5"/>` : ""}
    ${puddle ? `<ellipse cx="100" cy="230" rx="70" ry="9" fill="#2a7a86" opacity=".45"/>` : ""}
    ${solid ? `<path d="${BODY}" fill="${lighten(color, 0.55)}"/>` : ""}
    <g clip-path="url(#${id}c)"><rect x="20" y="36" width="160" height="210" fill="url(#${id}l)"/></g>
    <g transform="rotate(-7 100 80)"><rect x="90" y="56" width="20" height="46" rx="5" fill="#f6e9cc"/>${heart(100, 82, 0.62, color)}</g>
    <g><rect x="84" y="4" width="32" height="30" rx="8" fill="#d9a96a"/><rect x="84" y="4" width="32" height="11" rx="5.5" fill="#ecc78f"/><circle cx="94" cy="25" r="2" fill="#b98748"/><circle cx="107" cy="20" r="1.8" fill="#b98748"/></g>
    <path d="${BODY}" fill="url(#${id}g)" stroke="#fff" stroke-opacity=".8" stroke-width="4" stroke-linejoin="round"/>
    <rect x="75" y="28" width="50" height="16" rx="8" fill="#fff" fill-opacity=".3" stroke="#fff" stroke-opacity=".8" stroke-width="3.5"/>
    <path d="M52 138 C49 160 54 184 67 200" stroke="#fff" stroke-opacity=".75" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="56" cy="124" r="3.5" fill="#fff" fill-opacity=".75"/>
    ${FACES[face]()}
    ${waves ? `<path d="M-10 224 Q15 212 40 224 T90 224 T140 224 T190 224 T240 224 V250 H-10Z" fill="#2a7a86"/>` : ""}`;
  return { defs, art };
}

const svgDoc = (w, h, vb, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`;

// ---- the Tide Bottle: the app's logo glyph. A clean message-in-a-bottle: cork, glass, a wave of sea inside, a heart. ----
const TIDE_BODY = "M24 20 H36 V34 C36 44 52 50 52 68 V104 C52 113 46 118 38 118 H22 C14 118 8 113 8 104 V68 C8 50 24 44 24 34 Z";
/** { defs, art } in a 60x124 box (cork top y=5, base y=118). `id` keeps gradient ids unique when several share one SVG. */
function tide(id) {
  const defs = `<clipPath id="${id}c"><path d="${TIDE_BODY}"/></clipPath>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4f5e6"/><stop offset="1" stop-color="#46b09b"/></linearGradient>
    <linearGradient id="${id}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7d58e"/><stop offset="1" stop-color="#c79b62"/></linearGradient>`;
  const art = `<g clip-path="url(#${id}c)"><path d="M0 74 C8 67 14 67 20 72.5 S34 79 40 72.5 S54 67 60 74 V124 H0 Z" fill="url(#${id}l)"/></g>
    <path d="${TIDE_BODY}" fill="#f5efe4" fill-opacity=".07" stroke="#f5efe4" stroke-width="3.6" stroke-linejoin="round"/>
    <rect x="23" y="5" width="14" height="17" rx="3.4" fill="url(#${id}k)"/>
    <path d="M30 106 C20 98 20 88 26 87 C28.5 86.6 30 89 30 89 C30 89 31.5 86.6 34 87 C40 88 40 98 30 106 Z" fill="#f5efe4"/>`;
  return { defs, art };
}
/** Place the Tide Bottle so its centre line is at (cx) and its top at (top), scaled by s. */
const tideAt = (id, cx, top, s) => { const t = tide(id); return { defs: t.defs, art: `<g transform="translate(${(cx - 30 * s).toFixed(2)} ${(top - 5 * s).toFixed(2)}) scale(${s})">${t.art}</g>` }; };

/** The logo mark alone, transparent background (nav, favicon-ish uses, ads). */
const markSVG = () => { const t = tide("m"); return svgDoc(76, 126, "-8 -1 76 126", `<defs>${t.defs}</defs>${t.art}`); };
/** The cute faced mascot alone: kept for stickers, moods and playful moments. */
const mascotSVG = (face = "happy", color = MOODS.happy, opts = { puddle: true }) => {
  const m = mascot("m", color, face, opts);
  return svgDoc(200, 240, "0 0 200 240", `<defs>${m.defs}</defs>${m.art}`);
};

/** Sticker: white die-cut outline + soft shadow around the silhouette. */
const stickerSVG = (face) => {
  const m = mascot("s", MOODS[face], face, { puddle: true, glowBlob: false, solid: true });
  return svgDoc(240, 280, "-20 -14 240 280", `<defs>${m.defs}
    <filter id="die" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>
      <feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="o0"/><feComposite in="o0" in2="SourceAlpha" operator="out" result="o"/>
      <feGaussianBlur in="d" stdDeviation="4" result="sh"/><feOffset in="sh" dy="4" result="sh2"/>
      <feFlood flood-color="#06141c" flood-opacity=".35"/><feComposite in2="sh2" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs><g filter="url(#die)">${m.art}</g>`);
};

// ---- app icon: night-sea tile with the Tide Bottle, a crescent moon and a few stars -------
function iconSVG({ maskable = false } = {}) {
  const s = maskable ? 5.4 : 6.4; // maskable keeps everything inside the central safe zone (80%)
  const t = tideAt("i", 512, 520 - 56.5 * s, s);
  const rx = maskable ? 0 : 232;
  const stars = (maskable ? [[262, 330, 4.5], [806, 430, 5.5], [190, 570, 4]] : [[196, 214, 7], [262, 330, 4.5], [806, 420, 5.5], [170, 560, 4]])
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.foam}" opacity=".7"/>`).join("");
  const moon = `<path d="M812 176a74 74 0 1 0 54 130a60 60 0 0 1-54-130z" fill="${C.lantern}"/>`;
  return svgDoc(1024, 1024, "0 0 1024 1024", `<defs>${t.defs}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15506a"/><stop offset="1" stop-color="#051722"/></linearGradient>
    <radialGradient id="halo" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#9fe3d0" stop-opacity=".42"/><stop offset="1" stop-color="#9fe3d0" stop-opacity="0"/></radialGradient></defs>
    <rect width="1024" height="1024" rx="${rx}" fill="url(#bg)"/>
    <circle cx="512" cy="560" r="${maskable ? 330 : 400}" fill="url(#halo)"/>
    ${stars}
    ${maskable ? `<g transform="translate(722 292) scale(.8) translate(-840 -240)">${moon}</g>` : moon}
    ${t.art}`);
}

// ---- wordmarks as true outlines ----------------------------------------------------
// Fraunces is a variable font; pin a soft, friendly instance for the logo.
// (fontkit, not opentype.js: opentype.js emits NaN coordinates for this font's composite glyphs.)
async function loadFont(file) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/${encodeURIComponent(file)}`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  return fontkit.create(buf).getVariation({ opsz: 72, wght: 460, SOFT: 70, WONK: 0 });
}
const reg = await loadFont("Fraunces[SOFT,WONK,opsz,wght].ttf");
const ita = await loadFont("Fraunces-Italic[SOFT,WONK,opsz,wght].ttf");

/** Text as true vector outlines: one <path> per glyph, scaled from font units (y-up) to the page. */
function textPath(font, text, x, y, size, fill) {
  const run = font.layout(text);
  const s = size / font.unitsPerEm;
  let pen = 0, out = "";
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d.includes("NaN")) throw new Error(`NaN in outline for "${text}"`);
    if (d) out += `<path transform="translate(${(x + (pen + pos.xOffset) * s).toFixed(2)} ${(y - pos.yOffset * s).toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${d}"/>`;
    pen += pos.xAdvance;
  });
  return `<g fill="${fill}">${out}</g>`;
}
const width = (font, text, size) => (font.layout(text).positions.reduce((a, p) => a + p.xAdvance, 0) * size) / font.unitsPerEm;

function wordmarkSVG(kind) {
  const dark = kind !== "light";
  const raalhu = dark ? C.foam : "#17323f", feels = dark ? C.glow : "#1f8a7d"; // main word / italic accent
  if (kind === "stacked") {
    const W = 800, size = 150, a = width(reg, "Ihusaas", size), b = width(ita, "online", size);
    const t = tideAt("w", W / 2, 16, 3.0);
    return svgDoc(W, 760, `0 0 ${W} 760`, `<defs>${t.defs}</defs>${t.art}
      ${textPath(reg, "Ihusaas", (W - a) / 2, 600, size, raalhu)}
      ${textPath(ita, "online", (W - b) / 2, 740, size, feels)}`);
  }
  const size = 120, gap = 28, tile = 180;
  const lead = dark ? 96 : tile + 36;
  const a = width(reg, "Ihusaas", size), b = width(ita, "online", size);
  const total = lead + a + gap + b;
  const mark = dark
    ? (() => { const t = tideAt("w", 44, 18, 1.28); return `<defs>${t.defs}</defs>${t.art}`; })()
    : (() => { const i = iconSVG().replace(/<svg[^>]*>/, "").replace("</svg>", ""); return `<g transform="scale(${tile / 1024})">${i}</g>`; })();
  return svgDoc(Math.ceil(total), tile, `0 0 ${Math.ceil(total)} ${tile}`, `${mark}
    ${textPath(reg, "Ihusaas", lead, 128, size, raalhu)}${textPath(ita, "online", lead + a + gap, 128, size, feels)}`);
}

// ---- social share image (1200x630) -------------------------------------------------
function ogSVG() {
  const t = tideAt("o", 330, 62, 4.4);
  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 197) % 1200, y = (i * 83) % 330;
    return `<circle cx="${x}" cy="${y}" r="${(i % 3) + 1}" fill="#f5efe4" opacity="${0.35 + (i % 4) * 0.15}"/>`;
  }).join("");
  return svgDoc(1200, 630, "0 0 1200 630", `<defs>${t.defs}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b5163"/><stop offset=".6" stop-color="#0f3140"/><stop offset="1" stop-color="#07182a"/></linearGradient>
    <radialGradient id="moon" cx=".35" cy=".32" r=".8"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f8e9bd"/><stop offset="1" stop-color="#ead08f"/></radialGradient>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe3d0" stop-opacity=".4"/><stop offset="1" stop-color="#9fe3d0" stop-opacity="0"/></radialGradient>
    <filter id="mb" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter></defs>
    <rect width="1200" height="630" fill="url(#bg)"/>${stars}
    <circle cx="1040" cy="130" r="120" fill="#f7d58e" opacity=".3" filter="url(#mb)"/><circle cx="1040" cy="130" r="64" fill="url(#moon)"/>
    <circle cx="330" cy="320" r="300" fill="url(#halo)"/>
    <path d="M0 540 Q150 500 300 540 T600 540 T900 540 T1200 540 V630 H0Z" fill="#7fd0d2" opacity=".25"/>
    <path d="M0 580 Q150 545 300 580 T600 580 T900 580 T1200 580 V630 H0Z" fill="#2a7a86" opacity=".95"/>
    ${t.art}
    ${textPath(reg, "Ihusaas", 540, 290, 140, C.foam)}${textPath(ita, "online", 548, 420, 110, C.glow)}
    ${textPath(ita, "Say it to the sea.", 548, 500, 44, C.sand)}${textPath(reg, "ihusaas.online", 1200 - width(reg, "ihusaas.online", 30) - 56, 600, 30, C.foam)}`);
}

// ---- export ------------------------------------------------------------------------
const png = (svg, rel, w) => sharp(Buffer.from(svg), { density: 300 }).resize({ width: w }).png().toFile(new URL(rel, OUT).pathname);

// SVG sources
const icon = iconSVG(), iconM = iconSVG({ maskable: true });
write("mark.svg", markSVG());
write("icon.svg", icon);
write("icon-maskable.svg", iconM);
write("wordmark-dark.svg", wordmarkSVG("dark"));
write("wordmark-light.svg", wordmarkSVG("light"));
write("wordmark-stacked.svg", wordmarkSVG("stacked"));
write("og.svg", ogSVG());
for (const face of Object.keys(FACES)) write(`stickers/${face}.svg`, stickerSVG(face));
write("mascot.svg", mascotSVG());
write("mark-noface.svg", markSVG());

// PNGs
const jobs = [];
for (const s of [16, 32, 48, 64, 128, 180, 192, 256, 384, 512, 1024]) jobs.push(png(icon, `png/icon-${s}.png`, s));
for (const s of [192, 512]) jobs.push(png(iconM, `png/icon-maskable-${s}.png`, s));
jobs.push(png(markSVG(), "png/mark-1024.png", 1024));
jobs.push(png(wordmarkSVG("dark"), "png/wordmark-dark-2000w.png", 2000));
jobs.push(png(wordmarkSVG("light"), "png/wordmark-light-2000w.png", 2000));
jobs.push(png(wordmarkSVG("stacked"), "png/wordmark-stacked-1600w.png", 1600));
jobs.push(png(ogSVG(), "og.png", 1200));
for (const face of Object.keys(FACES)) jobs.push(png(stickerSVG(face), `stickers/${face}.png`, 768));

// Sticker sheet (handy for previews and ads)
const names = Object.keys(FACES);
const cellW = 300, cellH = 360;
const sheetCells = names.map((n, i) => {
  const x = (i % 4) * cellW, y = Math.floor(i / 4) * cellH;
  const inner = stickerSVG(n).replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const label = n === "happy" ? "Ihusaas" : n[0].toUpperCase() + n.slice(1);
  const lw = width(ita, label, 34);
  return `<g transform="translate(${x + 30} ${y + 10})">${inner}</g>${textPath(ita, label, x + (cellW - lw) / 2, y + 340, 34, C.foam)}`;
}).join("");
const sheet = svgDoc(cellW * 4, cellH * 2, `0 0 ${cellW * 4} ${cellH * 2}`, `<rect width="100%" height="100%" fill="${C.abyss}"/>${sheetCells}`);
jobs.push(png(sheet, "stickers/_sheet.png", 2400));
await Promise.all(jobs);

// App-router conventions: favicon + apple touch icon
writeFileSync(new URL("icon.svg", APP), icon);
await sharp(Buffer.from(iconM), { density: 300 }).resize(180).flatten({ background: "#15506a" }).removeAlpha().png().toFile(new URL("apple-icon.png", APP).pathname); // iOS paints transparency black
await sharp(Buffer.from(icon), { density: 300 }).resize(96).png().toFile(new URL("icon.png", APP).pathname);

write("README.md", `# Ihusaas — logo pack

Generated by \`npm run brand:build\` (scripts/build-brand.mjs). Edit the script, re-run, everything regenerates.

| File | Use |
|---|---|
| \`mark.svg\` | The mascot alone, transparent. For use on dark/teal backgrounds. |
| \`icon.svg\`, \`png/icon-*.png\` | App icon tile (rounded). 16 → 1024 px. |
| \`icon-maskable.svg\`, \`png/icon-maskable-*.png\` | Full-bleed icon for Android adaptive icons / PWA "maskable". |
| \`wordmark-dark.svg\` / \`.png\` | Mascot + "Ihusaas", for DARK backgrounds. |
| \`wordmark-light.svg\` / \`.png\` | Icon tile + dark text, for LIGHT backgrounds. |
| \`wordmark-stacked.svg\` / \`.png\` | Stacked lock-up for posters, avatars, covers. |
| \`og.png\` | 1200x630 social share image. |
| \`stickers/*.svg|png\` | 8 mascot expressions (happy + the 7 moods) as die-cut stickers. \`_sheet.png\` shows them all. |

## Colours
Abyss #0a1c26 · Deep #0f2733 · Seafoam #9fe3d0 · Sand #ecd9b5 · Pearl #f5efe4 · Peach #f4a595 · Lantern #f7d58e
Mood colours: horror #e88b8b · sad #8fb6e8 · vent #f0a870 · secrets #b9a2e8 · nostalgia #f1d58a · work #86cfd8 · relationships #eba0c4

## Type
Fraunces (headings, wordmark) and Nunito (UI), both SIL OFL via Google Fonts. Handwriting touches use Caveat.

## Usage
The logo is the Tide Bottle; the faced mascot is for stickers and playful moments only. Keep clear space around the logo equal to the cork's width. Don't recolour the glass, stretch, or add effects. Don't put the dark wordmark on dark backgrounds or the light one on light ones.
`);
console.log("brand pack written: public/brand/ + src/app/icon.svg + src/app/apple-icon.png");
