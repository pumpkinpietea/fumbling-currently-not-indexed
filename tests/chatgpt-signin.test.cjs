const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateIdentity, callback, exchange, startSignin } = require('../scripts/chatgpt-signin.cjs');
const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...pair.publicKey.export({ format: 'jwk' }), kid: 'fixture-key', alg: 'RS256', use: 'sig' };
const claims = { iss: 'https://auth.openai.com', aud: 'oaiapp_fixture', sub: 'fixture-subject', nonce: 'fixture-nonce', exp: 2000 };
function token(changes = {}, headerChanges = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: jwk.kid, ...headerChanges })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ...claims, ...changes })).toString('base64url');
  return `${header}.${payload}.${crypto.sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), pair.privateKey).toString('base64url')}`;
}
const identity = { client: claims.aud, nonce: claims.nonce, now: 1000 };
test('verifies signature and exact claims while rejecting identity confusion', () => {
  assert.deepEqual(validateIdentity(token(), [jwk], identity), { issuer: claims.iss, subject: claims.sub });
  for (const change of [{ iss: 'https://example.com' }, { aud: 'other' }, { nonce: 'wrong' }, { exp: 1000 },
    { nbf: 1001 }, { iat: 1061 }, { sub: '' }, { aud: [claims.aud, 'other'] }, { azp: 'other' }])
    assert.throws(() => validateIdentity(token(change), [jwk], identity));
  assert.throws(() => validateIdentity(token(), [jwk], { ...identity, subject: 'different' }));
  assert.throws(() => validateIdentity(token({}, { alg: 'none' }), [jwk], identity));
  assert.throws(() => validateIdentity(token({}, { crit: [] }), [jwk], identity));
  assert.throws(() => validateIdentity(`${token().slice(0, -8)}AAAAAAAA`, [jwk], identity));
  assert.throws(() => validateIdentity(token(), [jwk, jwk], identity));
});
test('rejects wrong states, duplicate parameters and client changes before token exchange', () => {
  const attempt = { state: 'fixture-state', client: 'dynamic_agent_client' };
  const valid = 'http://127.0.0.1/auth/callback?state=fixture-state&code=fixture-code&client_id=oaiapp_fixture';
  assert.deepEqual(callback(new URL(valid), attempt), { client: 'oaiapp_fixture', code: 'fixture-code' });
  for (const value of [valid + '&state=fixture-state', valid.replace('fixture-state', 'wrong'),
    valid + '&code=second', valid.replace('&client_id=oaiapp_fixture', '')])
    assert.throws(() => callback(new URL(value), attempt));
  assert.throws(() => callback(new URL(valid), { ...attempt, client: 'oaiapp_other' }));
  assert.throws(() => callback(new URL('http://127.0.0.1/auth/callback?state=fixture-state&error=access_denied'), attempt), /consent_denied/);
});
test('code exchange uses fixed endpoints and validates plan scopes without inference', async () => {
  const attempt = { verifier: 'fixture-verifier', redirect: 'http://127.0.0.1:1456/auth/callback',
    nonce: claims.nonce, host: 'urn:uuid:fixture-host' };
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return url.endsWith('/jwks.json') ? Response.json({ keys: [jwk] }) : Response.json({
      id_token: token({ exp: Date.now() / 1000 + 300 }), access_token: 'fixture-access', refresh_token: 'fixture-refresh',
      token_type: 'Bearer', scope: 'openid offline_access resource.invoke chatgpt.tokens.use.direct' });
  };
  const saved = await exchange({ client: claims.aud, code: 'fixture-code' }, attempt, { fetch });
  assert.equal(saved.subject, claims.sub);
  assert.equal(saved.client_id, claims.aud);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://auth.openai.com/api/accounts/oauth/token');
  assert.equal(calls[0].options.body.get('redirect_uri'), attempt.redirect);
  assert.ok(calls.every(call => call.options.redirect === 'error'));
  await assert.rejects(exchange({ client: claims.aud, code: 'fixture-code' }, attempt, { fetch: async url =>
    url.endsWith('/jwks.json') ? Response.json({ keys: [jwk] }) : Response.json({ id_token: token({ exp: Date.now() / 1000 + 300 }),
      access_token: 'fixture-access', refresh_token: 'fixture-refresh', token_type: 'Bearer', scope: 'openid' }) }), /plan_permission_missing/);
});
function directory(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'signin-fixture-'));
  fs.chmodSync(d, 0o700);
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}
async function listener(t, d, fetch) {
  let ready;
  const shown = new Promise(resolve => { ready = resolve; });
  const result = startSignin(d, { port: 0, fetch, notify: ready, timeoutMs: 10000 });
  const local = await shown;
  t.after(async () => { await global.fetch(new URL('/auth/callback?invalid', local)).catch(() => {}); });
  const redirect = await global.fetch(new URL('/login', local), { redirect: 'manual' });
  return { result, local, oauth: new URL(redirect.headers.get('location')) };
}
test('loopback consent persists only verified credentials and stable host identity', async t => {
  const d = directory(t);
  let nonce, callCount = 0;
  const f = await listener(t, d, async url => {
    callCount++;
    if (url.endsWith('/jwks.json')) return Response.json({ keys: [jwk] });
    return Response.json({ id_token: token({ nonce, exp: Date.now() / 1000 + 300 }), access_token: 'fixture-access',
      refresh_token: 'fixture-refresh', token_type: 'Bearer', scope: 'openid offline_access resource.invoke chatgpt.tokens.use.direct' });
  });
  nonce = f.oauth.searchParams.get('nonce');
  assert.equal(f.oauth.searchParams.get('client_id'), 'dynamic_agent_client');
  assert.equal(f.oauth.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(f.oauth.searchParams.get('agent_name_hint'), 'Southeast Asia News Publishing');
  const bad = new URL('/auth/callback?state=wrong&code=fixture-code&client_id=oaiapp_fixture', f.local);
  assert.equal((await global.fetch(bad)).status, 400);
  assert.equal(callCount, 0);
  const good = new URL('/auth/callback', f.local);
  good.search = new URLSearchParams({ state: f.oauth.searchParams.get('state'), code: 'fixture-code', client_id: claims.aud });
  assert.equal((await global.fetch(good)).status, 200);
  assert.equal((await f.result).valid, true);
  const saved = JSON.parse(fs.readFileSync(path.join(d, 'session.json')));
  assert.equal(saved.ext_agent_host_id, JSON.parse(fs.readFileSync(path.join(d, 'host.json'))).id);
  assert.equal(fs.statSync(path.join(d, 'session.json')).mode & 0o777, 0o600);
  assert.equal(callCount, 2);
  assert.equal(fs.existsSync(path.join(d, 'session.json.lock')), false);
});
test('failed reauthorization preserves the selected session and does not send token hints', async t => {
  const d = directory(t), session = path.join(d, 'session.json');
  const original = JSON.stringify({ issuer: claims.iss, subject: claims.sub, client_id: claims.aud,
    scopes: ['resource.invoke', 'chatgpt.tokens.use.direct'], refresh_token: 'fixture-old-refresh' });
  fs.writeFileSync(session, original, { mode: 0o600 });
  const f = await listener(t, d, async () => new Response('fixture-private-body', { status: 400 }));
  assert.equal(f.oauth.searchParams.get('client_id'), claims.aud);
  assert.equal(f.oauth.searchParams.has('agent_name_hint'), false);
  assert.equal(f.oauth.searchParams.has('id_token_hint'), false);
  const good = new URL('/auth/callback', f.local);
  good.search = new URLSearchParams({ state: f.oauth.searchParams.get('state'), code: 'fixture-code' });
  assert.equal((await global.fetch(good)).status, 400);
  assert.deepEqual(await f.result, { valid: false, code: 'signin_failed' });
  assert.equal(fs.readFileSync(session, 'utf8'), original);
});
test('denied consent sends no network request; stale session locks are preserved', async t => {
  const d = directory(t);
  let calls = 0;
  const f = await listener(t, d, async () => { calls++; throw new Error('unreachable'); });
  const denied = new URL('/auth/callback', f.local);
  denied.search = new URLSearchParams({ state: f.oauth.searchParams.get('state'), error: 'access_denied' });
  await global.fetch(denied);
  assert.deepEqual(await f.result, { valid: false, code: 'consent_denied' });
  assert.equal(calls, 0);
  assert.equal(fs.existsSync(path.join(d, 'session.json')), false);
  fs.writeFileSync(path.join(d, 'session.json.lock'), '', { mode: 0o600 });
  await assert.rejects(startSignin(d), /credential_session_busy/);
  assert.equal(fs.existsSync(path.join(d, 'session.json.lock')), true);
});
test('expired sign-in releases its lock and does not create a session', async t => {
  const d = directory(t);
  assert.deepEqual(await startSignin(d, { port: 0, timeoutMs: 10 }), { valid: false, code: 'signin_expired' });
  assert.equal(fs.existsSync(path.join(d, 'session.json')), false);
  assert.equal(fs.existsSync(path.join(d, 'session.json.lock')), false);
});
