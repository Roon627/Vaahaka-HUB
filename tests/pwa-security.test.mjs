import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest'));
test('install URLs stay on the canonical origin', () => {
  const base = 'https://www.ihusaas.online/manifest.webmanifest';
  assert.equal(new URL(manifest.start_url, base).href, 'https://www.ihusaas.online/');
  for (const icon of manifest.icons) {
    assert.equal(new URL(icon.src, base).origin, new URL(base).origin);
    assert.ok(readFileSync('public' + icon.src.split('?')[0]).length > 0);
  }
});
test('worker never intercepts API, credentials, or install metadata', () => {
  const handlers = {};
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://www.ihusaas.online' }, addEventListener: (k,v) => handlers[k] = v }, URL,
  });
  for (const path of ['/api/fodibey/v1/openapi.json', '/api/private.png', '/manifest.webmanifest', '/apple-touch-icon.png?v=8', '/apple-icon.png', '/brand/png/icon-opaque-192.png?v=8']) {
    handlers.fetch({ request: new Request('https://www.ihusaas.online' + path), respondWith: () => assert.fail('intercepted ' + path) });
  }
  handlers.fetch({ request: new Request('https://www.ihusaas.online/data/a.json', { headers: { authorization: 'Bearer test' } }), respondWith: () => assert.fail('cached credentials') });
});
