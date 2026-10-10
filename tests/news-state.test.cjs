const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cloudState } = require('../scripts/news-state.cjs');
test('private state binds credential rotation and lock deletion to object generation', async () => {
  const requests = [];
  const state = cloudState('synthetic', { fetch: async (url, options) => {
    requests.push({ url, options });
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    if (options.method === 'POST') return Response.json({ generation: '42' });
    return new Response('{"fixture":true}', { headers: { 'x-goog-generation': '41' } });
  } });
  assert.equal((await state.read('auth/session.json')).generation, '41');
  assert.equal(await state.write('auth/session.json', { rotated: true }, '41'), '42');
  assert.ok(requests[1].url.endsWith('ifGenerationMatch=41'));
  await state.remove('locks/runtime.json', '42');
  assert.ok(requests[2].url.endsWith('ifGenerationMatch=42'));
  await assert.rejects(state.remove('auth/session.json', '42'));
  await assert.rejects(state.write('../unexpected', {}, '0'));
});
test('existing daily marker cannot be overwritten and a missing bundle is explicit', async () => {
  const state = cloudState('synthetic', { fetch: async (url, options) =>
    new Response(null, { status: options.method === 'POST' ? 412 : 404 }) });
  assert.equal(await state.read('bundles/2026-10-11.json'), null);
  await assert.rejects(state.write('locks/2026-10-11.json', {}), /state_already_exists/);
});
