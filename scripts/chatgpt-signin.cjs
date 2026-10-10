const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { privateDirectory, privateWrite, boundedText, credentials } = require('./chatgpt-plan.cjs');
const ISSUER = 'https://auth.openai.com';
const API = 'https://api.openai.com/v1';
const fail = code => { throw new Error(code); };
const same = (a, b) => typeof a === 'string' && typeof b === 'string' &&
  Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function readPrivate(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.uid !== process.getuid() || (stat.mode & 0o077) || stat.size > 32768)
    fail('unsafe_auth_file');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function validateIdentity(token, keys, { client, nonce, subject, now = Date.now() / 1000 }) {
  if (typeof token !== 'string' || token.length > 16384) fail('invalid_identity');
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) fail('invalid_identity');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.crit !== undefined || !Array.isArray(keys))
    fail('invalid_identity');
  const matches = keys.filter(key => key.kid === header.kid && key.kty === 'RSA' &&
    (!key.use || key.use === 'sig') && (!key.alg || key.alg === 'RS256'));
  if (matches.length !== 1 || !crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`),
    crypto.createPublicKey({ key: matches[0], format: 'jwk' }), Buffer.from(parts[2], 'base64url')))
    fail('invalid_identity');
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== ISSUER || !audiences.includes(client) ||
      (audiences.length > 1 && claims.azp !== client) || (claims.azp !== undefined && claims.azp !== client) ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now)) ||
      (claims.iat !== undefined && (!Number.isFinite(claims.iat) || claims.iat > now + 60)) ||
      !same(claims.nonce, nonce) || typeof claims.sub !== 'string' || !claims.sub ||
      (subject && claims.sub !== subject)) fail('invalid_identity');
  return { issuer: ISSUER, subject: claims.sub };
}
function callback(url, attempt) {
  for (const key of ['state', 'code', 'client_id', 'error'])
    if (url.searchParams.getAll(key).length > 1) fail('invalid_callback');
  if (!same(url.searchParams.get('state'), attempt.state)) fail('invalid_callback');
  if (url.searchParams.has('error')) fail('consent_denied');
  const client = url.searchParams.get('client_id') || (attempt.client !== 'dynamic_agent_client' ? attempt.client : null);
  if (!client || !/^oaiapp_[A-Za-z0-9_-]+$/.test(client) ||
      (attempt.client !== 'dynamic_agent_client' && client !== attempt.client)) fail('invalid_callback');
  const code = url.searchParams.get('code');
  if (!code || code.length > 8192) fail('invalid_callback');
  return { client, code };
}
async function exchange(parameters, attempt, { fetch = global.fetch } = {}) {
  const send = (url, options = {}) => fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const tokens = JSON.parse(await boundedText(await send(`${ISSUER}/api/accounts/oauth/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: parameters.client,
      code: parameters.code, code_verifier: attempt.verifier, redirect_uri: attempt.redirect, resource: API })
  }), 32768));
  const jwks = JSON.parse(await boundedText(await send(`${ISSUER}/.well-known/jwks.json`), 65536));
  const identity = validateIdentity(tokens.id_token, jwks.keys,
    { client: parameters.client, nonce: attempt.nonce, subject: attempt.subject });
  const scopes = typeof tokens.scope === 'string' ? tokens.scope.split(/\s+/) : [];
  if (!['openid', 'offline_access', 'resource.invoke', 'chatgpt.tokens.use.direct'].every(scope => scopes.includes(scope)) ||
      typeof tokens.access_token !== 'string' || !tokens.access_token ||
      typeof tokens.refresh_token !== 'string' || !tokens.refresh_token || tokens.token_type?.toLowerCase() !== 'bearer')
    fail('plan_permission_missing');
  return { ...identity, client_id: parameters.client, ext_agent_host_id: attempt.host,
    id_token: tokens.id_token, access_token: tokens.access_token, refresh_token: tokens.refresh_token,
    token_type: 'Bearer', scopes, saved_at: new Date().toISOString(),
    ...(Number.isFinite(tokens.expires_in) ? { expires_in: tokens.expires_in } : {}) };
}
async function startSignin(directory, { port = 1456, fetch = global.fetch, notify = () => {}, timeoutMs = 300000 } = {}) {
  directory = path.resolve(directory);
  privateDirectory(directory);
  const session = path.join(directory, 'session.json'), hostFile = path.join(directory, 'host.json');
  const registration = path.join(directory, 'registration.json'), lockFile = `${session}.lock`;
  let lock;
  try { lock = fs.openSync(lockFile, 'wx', 0o600); } catch { fail('credential_session_busy'); }
  let server;
  try {
    let host;
    try { host = readPrivate(hostFile).id; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      host = `urn:uuid:${crypto.randomUUID()}`; privateWrite(hostFile, { id: host });
    }
    if (typeof host !== 'string' || !/^urn:uuid:[a-f0-9-]{36}$/.test(host)) fail('unsafe_host_identity');
    let selected = null, pending = null;
    try { selected = credentials(session); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { pending = readPrivate(registration); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (pending && (typeof pending.client_id !== 'string' || !/^oaiapp_[A-Za-z0-9_-]+$/.test(pending.client_id)))
      fail('unsafe_auth_file');
    const attempt = { host, client: selected?.client_id || pending?.client_id || 'dynamic_agent_client',
      subject: selected?.subject, state: crypto.randomBytes(32).toString('base64url'),
      nonce: crypto.randomBytes(32).toString('base64url'), verifier: crypto.randomBytes(32).toString('base64url') };
    let consumed = false, settled = false, timer, resolveResult;
    const result = new Promise(resolve => { resolveResult = resolve; });
    const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolveResult(value); } };
    let authorize;
    server = http.createServer(async (req, res) => {
      res.setHeader('cache-control', 'no-store'); res.setHeader('referrer-policy', 'no-referrer');
      res.setHeader('content-security-policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      res.setHeader('content-type', 'text/html; charset=utf-8');
      if (req.method !== 'GET' || req.headers.host !== `127.0.0.1:${server.address().port}` || req.url.length > 16384) {
        res.writeHead(400); res.end('Invalid request.'); return;
      }
      const url = new URL(req.url, attempt.redirect);
      if (url.pathname === '/') {
        res.end('<!doctype html><meta charset="utf-8"><title>News Publishing</title><h1>ニュース公開用AIの認証</h1><p>この操作では記事生成や追加課金を開始しません。</p><a href="/login">Continue with ChatGPT</a>'); return;
      }
      if (url.pathname === '/login' && !consumed && !settled) { res.writeHead(302, { location: authorize }); res.end(); return; }
      if (url.pathname !== '/auth/callback' || consumed || settled) { res.writeHead(404); res.end('Unavailable.'); return; }
      let parameters;
      try { parameters = callback(url, attempt); }
      catch (error) {
        res.writeHead(400); res.end('認証を完了できませんでした。');
        if (error.message === 'consent_denied') { consumed = true; finish({ valid: false, code: 'consent_denied' }); }
        return;
      }
      consumed = true;
      try {
        if (!selected) privateWrite(registration, { client_id: parameters.client }, !!pending);
        const saved = await exchange(parameters, attempt, { fetch });
        if (settled) fail('signin_expired');
        privateWrite(session, saved, !!selected);
        res.end('認証が完了しました。この画面を閉じて戻ってください。'); finish({ valid: true });
      } catch {
        res.writeHead(400); res.end('認証を完了できませんでした。元の認証情報は変更していません。');
        finish({ valid: false, code: 'signin_failed' });
      }
    });
    server.requestTimeout = 10000; server.headersTimeout = 10000;
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    attempt.redirect = `http://127.0.0.1:${server.address().port}/auth/callback`;
    const query = new URLSearchParams({ client_id: attempt.client, ext_agent_host_id: host,
      response_type: 'code', redirect_uri: attempt.redirect,
      scope: 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct', resource: API,
      state: attempt.state, nonce: attempt.nonce, code_challenge_method: 'S256',
      code_challenge: crypto.createHash('sha256').update(attempt.verifier).digest('base64url') });
    if (attempt.client === 'dynamic_agent_client') query.set('agent_name_hint', 'Southeast Asia News Publishing');
    authorize = `${ISSUER}/api/accounts/authorize?${query}`;
    timer = setTimeout(() => finish({ valid: false, code: 'signin_expired' }), timeoutMs);
    notify(`http://127.0.0.1:${server.address().port}/`);
    return await result;
  } finally {
    server?.close(); server?.closeAllConnections();
    fs.closeSync(lock); fs.unlinkSync(lockFile);
  }
}
if (require.main === module) {
  (async () => {
    if (process.argv.length !== 3) return { valid: false, code: 'usage_private_directory_required' };
    return startSignin(process.argv[2], { notify: url => console.log(url) });
  })().catch(() => ({ valid: false, code: 'signin_failed' })).then(result => {
    console.log(JSON.stringify(result)); process.exitCode = result.valid ? 0 : 1;
  });
}
module.exports = { validateIdentity, callback, exchange, startSignin };
