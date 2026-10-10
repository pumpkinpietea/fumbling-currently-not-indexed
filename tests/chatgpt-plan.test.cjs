const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runPlan, completedText } = require('../scripts/chatgpt-plan.cjs');
const request = { model: 'test-model', instructions: 'Use only supplied evidence.', input: 'Synthetic fixture.' };
const terminal = { type: 'response.completed', response: { status: 'completed', output: [
  { type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Fixture result.' }] }
] } };
const stream = event => new Response(`data: ${JSON.stringify(event)}\n\n`, { headers: { 'content-type': 'text/event-stream' } });
function fixture(t, alteration = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-transport-'));
  fs.chmodSync(directory, 0o700);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const credentialFile = path.join(directory, 'session.json'), outputFile = path.join(directory, 'result.json');
  fs.writeFileSync(credentialFile, JSON.stringify({ issuer: 'https://auth.openai.com', subject: 'synthetic-account',
    client_id: 'oaiapp_fixture', scopes: ['resource.invoke', 'chatgpt.tokens.use.direct'],
    access_token: 'fixture-old-access', refresh_token: 'fixture-old-refresh', ...alteration }), { mode: 0o600 });
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/oauth/token')) return Response.json({ access_token: 'fixture-new-access',
      refresh_token: 'fixture-new-refresh', token_type: 'Bearer' });
    if (url.endsWith('/models')) return Response.json({ models: [{ slug: request.model, visibility: 'list' }] });
    return stream(terminal);
  };
  return { directory, credentialFile, outputFile, calls, fetch,
    run: (dependencies = {}) => runPlan(request, credentialFile, outputFile, { fetch, ...dependencies }) };
}
test('rotates tokens before inference and writes a completed private result', async t => {
  const f = fixture(t);
  assert.equal((await f.run()).valid, true);
  assert.equal(JSON.parse(fs.readFileSync(f.credentialFile)).refresh_token, 'fixture-new-refresh');
  assert.equal(JSON.parse(fs.readFileSync(f.outputFile)).text, 'Fixture result.');
  assert.equal(fs.statSync(f.outputFile).mode & 0o777, 0o600);
  assert.equal(f.calls.length, 3);
  assert.ok(f.calls.every(call => call.options.redirect === 'error'));
  assert.equal(f.calls[1].options.headers.authorization, 'Bearer fixture-new-access');
  assert.deepEqual(JSON.parse(f.calls[2].options.body), { ...request,
    input: [{ role: 'user', content: request.input }], store: false, stream: true });
  assert.equal(fs.existsSync(`${f.credentialFile}.lock`), false);
  assert.equal((await f.run()).valid, false);
  assert.equal(f.calls.length, 3);
});
test('denies concurrent credential refresh without stealing the existing lock', async t => {
  const f = fixture(t);
  fs.writeFileSync(`${f.credentialFile}.lock`, '', { mode: 0o600 });
  assert.equal((await f.run()).errors[0].code, 'credential_session_busy');
  assert.equal(f.calls.length, 0);
  assert.equal(fs.existsSync(`${f.credentialFile}.lock`), true);
});
test('rejects unsafe credentials, missing grants and symbolic links before networking', async t => {
  for (const alteration of [{ scopes: [] }, { client_id: 'dynamic_agent_client' }]) {
    const f = fixture(t, alteration);
    assert.equal((await f.run()).valid, false);
    assert.equal(f.calls.length, 0);
  }
  const f = fixture(t);
  fs.chmodSync(f.credentialFile, 0o644);
  assert.equal((await f.run()).errors[0].code, 'protected_credentials_required');
  fs.chmodSync(f.credentialFile, 0o600);
  const alias = path.join(f.directory, 'alias.json');
  fs.symlinkSync(f.credentialFile, alias);
  assert.equal((await runPlan(request, alias, f.outputFile, { fetch: f.fetch })).valid, false);
  assert.equal(f.calls.length, 0);
});
test('unavailable model preserves rotation but never calls inference', async t => {
  const f = fixture(t);
  const result = await f.run({ fetch: (url, options) => url.endsWith('/models')
    ? Response.json({ models: [] }) : f.fetch(url, options) });
  assert.equal(result.errors[0].code, 'model_unavailable');
  assert.equal(JSON.parse(fs.readFileSync(f.credentialFile)).refresh_token, 'fixture-new-refresh');
  assert.equal(fs.existsSync(f.outputFile), false);
  assert.equal(f.calls.length, 1);
});
test('upstream errors remain sanitized and have no retries or partial output', async t => {
  const f = fixture(t);
  let count = 0;
  const result = await f.run({ fetch: async () => { count++; return new Response('fixture-secret', { status: 429 }); } });
  assert.equal(count, 1);
  assert.equal(result.errors[0].code, 'upstream_request_failed');
  assert.ok(!JSON.stringify(result).includes('fixture-secret'));
  assert.equal(fs.existsSync(f.outputFile), false);
});
test('fragmented UTF-8 SSE succeeds while failed, incomplete and malformed streams fail', async () => {
  const bytes = Buffer.from(`data: ${JSON.stringify(terminal)}\r\n\r\n`);
  const body = new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  } });
  assert.equal(await completedText(new Response(body, { headers: { 'content-type': 'text/event-stream' } })), 'Fixture result.');
  for (const event of [{ type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } } },
    { type: 'response.incomplete' }, { type: 'response.output_text.delta', delta: 'partial' }])
    await assert.rejects(completedText(stream(event)), /inference_failed|incomplete_inference/);
  await assert.rejects(completedText(new Response('data: invalid\n\n', { headers: { 'content-type': 'text/event-stream' } })), /malformed_stream/);
});
test('input and stream caps reject oversized work', async t => {
  const f = fixture(t);
  assert.equal((await runPlan({ ...request, input: 'x'.repeat(16385) }, f.credentialFile, f.outputFile, { fetch: f.fetch })).valid, false);
  assert.equal(f.calls.length, 0);
  await assert.rejects(completedText(new Response('x'.repeat(1048577), { headers: { 'content-type': 'text/event-stream' } })), /stream_size_limit/);
});
test('a failure after text deltas never writes output', async t => {
  const f = fixture(t);
  const result = await f.run({ fetch: (url, options) => url.endsWith('/responses') ? new Response(
    'data: {"type":"response.output_text.delta","delta":"partial"}\n\ndata: {"type":"response.failed"}\n\n',
    { headers: { 'content-type': 'text/event-stream' } }) : f.fetch(url, options) });
  assert.equal(result.valid, false);
  assert.equal(fs.existsSync(f.outputFile), false);
});
test('failed remote rotation persistence prevents model discovery and inference', async t => {
  const f = fixture(t);
  const result = await f.run({ onCredentialsSaved: async saved => {
    assert.equal(saved.refresh_token, 'fixture-new-refresh');throw new Error('private-store-unavailable');
  } });
  assert.equal(result.valid, false);assert.equal(f.calls.length, 1);
  assert.equal(fs.existsSync(f.outputFile), false);
  assert.equal(JSON.parse(fs.readFileSync(f.credentialFile)).refresh_token, 'fixture-new-refresh');
});

test('large live catalogs are accepted within one MiB and oversized catalogs fail before inference', async t => {
  for (const size of [300000, 1048577]) {
    const f = fixture(t);let inference = 0;
    const result = await f.run({ fetch: async (url, options) => {
      if (url.endsWith('/models')) return Response.json({ models: [{ slug: request.model, visibility: 'list' }], metadata: 'x'.repeat(size) });
      if (url.endsWith('/responses')) inference++;
      return f.fetch(url, options);
    } });
    assert.equal(result.valid, size === 300000);
    assert.equal(inference, size === 300000 ? 1 : 0);
    if (!result.valid) assert.equal(result.errors[0].code, 'response_size_limit');
  }
});

test('missing stream header still requires strict completed SSE; explicit non-SSE types are rejected', async () => {
  const bytes = new TextEncoder().encode(`data: ${JSON.stringify(terminal)}\n\n`);
  const body = () => new ReadableStream({ start(controller) { controller.enqueue(bytes);controller.close(); } });
  assert.equal(await completedText(new Response(body())), 'Fixture result.');
  await assert.rejects(completedText(new Response(body(), { headers: { 'content-type': 'application/json' } })), /inference_response_rejected/);
  const invalid = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"status":"completed"}'));controller.close(); } });
  await assert.rejects(completedText(new Response(invalid)), /incomplete_inference/);
});

test('completed item streams require terminal completion and reject gaps, duplicates and unfinished messages', async () => {
  const done = { type: 'response.output_item.done', output_index: 0, item: terminal.response.output[0] };
  const end = { type: 'response.completed', response: { status: 'completed', output: [] } };
  const response = events => new Response(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } });
  assert.equal(await completedText(response([done, end])), 'Fixture result.');
  for (const events of [[done], [end], [done, done, end], [{ ...done, output_index: 1 }, end],
    [{ ...done, item: { ...done.item, status: 'in_progress' } }, end],
    [done, { type: 'response.failed' }]]) await assert.rejects(completedText(response(events)));
});
