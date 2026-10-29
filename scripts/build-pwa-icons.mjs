// Match Badhige's iOS install workaround: put the actual PNG in the HTML head.
// The PNG stays the source of truth; no runtime file reads or hand-maintained base64.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const png = readFileSync(new URL('public/pwa/ihusaas-install-180.png', root));
if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Touch icon must be PNG');
const appleTouchIcon = `data:image/png;base64,${png.toString('base64')}`;
const generated = new URL('src/lib/generated/', root);
mkdirSync(generated, { recursive: true });
writeFileSync(new URL('pwa-icons.json', generated), JSON.stringify({ appleTouchIcon }) + '\n');
const installFile = new URL('public/install.html', root);
const html = readFileSync(installFile, 'utf8');
const links = html.match(/<link\b[^>]*\brel="apple-touch-icon"[^>]*>/g) || [];
if (links.length !== 1) throw new Error('Install page must have exactly one touch icon');
writeFileSync(installFile, html.replace(links[0], `<link rel="apple-touch-icon" sizes="180x180" href="${appleTouchIcon}">`));
console.log(`Embedded ${png.length} PNG bytes in the app and Safari install page.`);
