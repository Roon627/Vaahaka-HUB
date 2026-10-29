import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest'));
test('install URLs stay on the canonical origin', () => {
  const base = 'https://ihusaas.online/manifest.webmanifest';
  assert.equal(new URL(manifest.start_url, base).href, 'https://ihusaas.online/');
  for (const icon of manifest.icons) {
    assert.equal(new URL(icon.src, base).origin, new URL(base).origin);
    assert.ok(readFileSync('public' + icon.src.split('?')[0]).length > 0);
  }
});
test('worker never intercepts API, credentials, or install metadata', () => {
  const handlers = {};
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://ihusaas.online' }, addEventListener: (k,v) => handlers[k] = v }, URL,
  });
  for (const path of ['/pwa/ihusaas-install-180.png', '/install.html', '/api/fodibey/v1/openapi.json', '/api/private.png', '/manifest.webmanifest', '/apple-touch-icon.png?v=8', '/apple-icon.png', '/brand/png/icon-opaque-192.png?v=8']) {
    handlers.fetch({ request: new Request('https://ihusaas.online' + path), respondWith: () => assert.fail('intercepted ' + path) });
  }
  handlers.fetch({ request: new Request('https://ihusaas.online/data/a.json', { headers: { authorization: 'Bearer test' } }), respondWith: () => assert.fail('cached credentials') });
});

test('Safari install page declares one real touch icon before its body', () => {
  const html = readFileSync('public/install.html', 'utf8');
  assert.equal((html.match(/rel="apple-touch-icon"/g) || []).length, 1);
  assert.ok(html.indexOf('rel="apple-touch-icon"') < html.indexOf('</head>'));
  assert.ok(readFileSync('public/pwa/ihusaas-install-180.png').length > 0);
  assert.match(html, /location.replace\('\/'\)/);
});

test('iOS touch icons embed the exact PNG bytes, without a network fetch', () => {
  const source = readFileSync('public/pwa/ihusaas-install-180.png');
  const generated = JSON.parse(readFileSync('src/lib/generated/pwa-icons.json'));
  const install = readFileSync('public/install.html', 'utf8');
  const head = install.slice(0, install.indexOf('</head>'));
  const link = head.match(/<link\b[^>]*rel="apple-touch-icon"[^>]*>/)?.[0];
  const href = link?.match(/href="([^"]+)"/)?.[1];
  assert.equal(href, generated.appleTouchIcon);
  assert.ok(href.startsWith('data:image/png;base64,'));
  assert.deepEqual(Buffer.from(href.split(',')[1], 'base64'), source);
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /href=\{appleTouchIcon\}/);
  assert.match(layout, /@\/lib\/generated\/pwa-icons.json/);
});
