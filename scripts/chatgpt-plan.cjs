const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const REPOSITORY = path.resolve(__dirname, '..');
const API = 'https://api.openai.com/v1';
const TOKEN = 'https://auth.openai.com/api/accounts/oauth/token';
const fail = code => { throw new Error(code); };
const inside = file => file === REPOSITORY || file.startsWith(`${REPOSITORY}${path.sep}`);
function privateDirectory(directory) {
  const real = fs.realpathSync(directory);
  const stat = fs.lstatSync(directory);
  if (real !== path.resolve(directory) || inside(real) || !stat.isDirectory() ||
      stat.uid !== process.getuid() || (stat.mode & 0o077)) fail('private_directory_required');
  return real;
}
function credentials(file) {
  privateDirectory(path.dirname(file));
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.uid !== process.getuid() || (stat.mode & 0o077) || stat.size > 32768)
    fail('protected_credentials_required');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value.issuer !== 'https://auth.openai.com' || typeof value.subject !== 'string' || !value.subject ||
      typeof value.client_id !== 'string' || !/^oaiapp_[A-Za-z0-9_-]+$/.test(value.client_id) ||
      typeof value.refresh_token !== 'string' || !value.refresh_token ||
      !Array.isArray(value.scopes) || !['resource.invoke', 'chatgpt.tokens.use.direct'].every(s => value.scopes.includes(s)))
    fail('invalid_plan_credentials');
  return value;
}
function privateWrite(file, value, replace = false) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    if (replace) fs.renameSync(temporary, file);
    else fs.linkSync(temporary, file);
  } finally { try { fs.unlinkSync(temporary); } catch { /* Already renamed or unavailable. */ } }
}
async function boundedText(response, limit) {
  if (!response.ok || !response.body) fail('upstream_request_failed');
  let size = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > limit) fail('response_size_limit');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function completedText(response) {
  if (!response.ok || !response.body || !response.headers.get('content-type')?.startsWith('text/event-stream'))
    fail('inference_response_rejected');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '', size = 0, result = null;
  function frame(raw) {
    const data = raw.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') return;
    let event;
    try { event = JSON.parse(data); } catch { fail('malformed_stream'); }
    if (['response.failed', 'response.incomplete', 'error'].includes(event.type)) fail('inference_failed');
    if (event.type !== 'response.completed') return;
    if (result !== null || event.response?.status !== 'completed' || !Array.isArray(event.response.output))
      fail('incomplete_inference');
    const output = event.response.output;
    const messages = output.filter(item => item.type === 'message');
    if (!messages.length || output.some(item => !['message', 'reasoning'].includes(item.type)) ||
        messages.some(item => item.role !== 'assistant' || item.status !== 'completed' || !Array.isArray(item.content) ||
          !item.content.length || item.content.some(part => part.type !== 'output_text' || typeof part.text !== 'string')))
      fail('unsupported_model_output');
    result = messages.flatMap(item => item.content.map(part => part.text)).join('\n');
    if (!result.trim() || Buffer.byteLength(result) > 262144) fail('output_size_limit');
  }
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 1048576) fail('stream_size_limit');
    pending += decoder.decode(chunk, { stream: true });
    pending = pending.replace(/\r\n/g, '\n');
    let end;
    while ((end = pending.indexOf('\n\n')) >= 0) {
      frame(pending.slice(0, end)); pending = pending.slice(end + 2);
    }
  }
  pending += decoder.decode();
  if (pending.trim()) frame(pending);
  if (result === null) fail('incomplete_inference');
  return result;
}
function requestValid(value) {
  return value && Object.keys(value).sort().join(',') === 'input,instructions,model' &&
    ['model', 'instructions', 'input'].every(key => typeof value[key] === 'string' && value[key].trim()) &&
    value.model.length <= 128 && Buffer.byteLength(value.instructions) + Buffer.byteLength(value.input) <= 16384;
}
async function runPlan(request, credentialFile, outputFile, { fetch = global.fetch } = {}) {
  let lock, lockFile;
  try {
    if (!requestValid(request)) fail('invalid_plan_request');
    credentialFile = path.resolve(credentialFile); outputFile = path.resolve(outputFile);
    privateDirectory(path.dirname(outputFile));
    if (fs.existsSync(outputFile) || fs.lstatSync(path.dirname(outputFile)).isSymbolicLink()) fail('new_output_required');
    let saved = credentials(credentialFile);
    lockFile = `${credentialFile}.lock`;
    try { lock = fs.openSync(lockFile, 'wx', 0o600); } catch { fail('credential_session_busy'); }
    // Re-read after locking so a previous invocation's rotation cannot be lost.
    saved = credentials(credentialFile);
    const signal = AbortSignal.timeout(120000);
    const send = (url, options = {}) => fetch(url, { ...options, redirect: 'error', signal });
    const refreshed = JSON.parse(await boundedText(await send(TOKEN, { method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: saved.client_id,
        refresh_token: saved.refresh_token, resource: API }) }), 32768));
    const scopes = typeof refreshed.scope === 'string' ? refreshed.scope.split(/\s+/) : saved.scopes;
    if (typeof refreshed.access_token !== 'string' || !refreshed.access_token ||
        (refreshed.refresh_token !== undefined && (typeof refreshed.refresh_token !== 'string' || !refreshed.refresh_token)) ||
        refreshed.token_type?.toLowerCase() !== 'bearer' ||
        !['resource.invoke', 'chatgpt.tokens.use.direct'].every(s => scopes.includes(s))) fail('refresh_rejected');
    saved = { ...saved, ...refreshed, scopes, saved_at: new Date().toISOString() };
    privateWrite(credentialFile, saved, true);
    const headers = { authorization: `Bearer ${saved.access_token}` };
    const models = JSON.parse(await boundedText(await send(`${API}/models`, { headers }), 262144));
    if (!Array.isArray(models.models) || !models.models.some(model => model.visibility === 'list' && model.slug === request.model))
      fail('model_unavailable');
    const text = await completedText(await send(`${API}/responses`, { method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ model: request.model, instructions: request.instructions,
        input: [{ role: 'user', content: request.input }], store: false, stream: true }) }));
    privateWrite(outputFile, { schemaVersion: 1, model: request.model, text });
    return { valid: true, outputBytes: Buffer.byteLength(text) };
  } catch (error) {
    const known = ['private_directory_required', 'protected_credentials_required', 'invalid_plan_credentials',
      'invalid_plan_request', 'new_output_required', 'credential_session_busy', 'upstream_request_failed',
      'response_size_limit', 'inference_response_rejected', 'malformed_stream', 'inference_failed',
      'incomplete_inference', 'unsupported_model_output', 'output_size_limit', 'stream_size_limit',
      'refresh_rejected', 'model_unavailable'];
    return { valid: false, errors: [{ code: known.includes(error.message) ? error.message : 'plan_request_failed' }] };
  } finally {
    if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(lockFile); }
  }
}
if (require.main === module) {
  (async () => {
    if (process.argv.length !== 5) return { valid: false, errors: [{ code: 'usage_request_credentials_new_output_required' }] };
    const stat = fs.statSync(process.argv[2]);
    if (stat.size > 32768) return { valid: false, errors: [{ code: 'invalid_plan_request' }] };
    return runPlan(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), process.argv[3], process.argv[4]);
  })().catch(() => ({ valid: false, errors: [{ code: 'plan_request_failed' }] })).then(result => {
    console.log(JSON.stringify(result)); process.exitCode = result.valid ? 0 : 1;
  });
}
module.exports = { runPlan, completedText };
