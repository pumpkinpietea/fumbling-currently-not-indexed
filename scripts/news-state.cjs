const { boundedText } = require('./chatgpt-plan.cjs');
const BUCKET = 'blog-pumpkinpie-news-private';
async function cloudToken() {
  const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' }, redirect: 'error', signal: AbortSignal.timeout(5000) });
  const data = JSON.parse(await boundedText(r, 16384));
  if (!data.access_token) throw new Error('runtime_auth_failed');
  return data.access_token;
}
function cloudState(token, { fetch: send = global.fetch } = {}) {
  const headers = { authorization: `Bearer ${token}` };
  const encoded = value => encodeURIComponent(value);
  return {
    async read(name, { timeoutMs = 15000 } = {}) {
      const r = await send(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encoded(name)}?alt=media`,
        { headers, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
      if (r.status === 404) return null;
      const generation = r.headers.get('x-goog-generation');
      return { value: JSON.parse(await boundedText(r, 1048576)), generation };
    },
    async remove(name, generation) {
      if (name !== 'locks/runtime.json' || !/^\d+$/.test(String(generation))) throw new Error('state_delete_rejected');
      const r = await send(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encoded(name)}?ifGenerationMatch=${generation}`,
        { method: 'DELETE', headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('state_delete_failed');
    },
    async write(name, value, generation = '0') {
      if (!/^(auth\/(?:session|alerts)\.json|(?:locks|runs|evidence|bundles)\/[a-zA-Z0-9._/-]+)$/.test(name))
        throw new Error('state_path_rejected');
      const body = JSON.stringify(value);
      if (Buffer.byteLength(body) > 1048576 || !/^\d+$/.test(String(generation))) throw new Error('state_value_rejected');
      const r = await send(`https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${encoded(name)}&ifGenerationMatch=${generation}`,
        { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body,
          redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (r.status === 412) throw new Error('state_already_exists');
      const result = JSON.parse(await boundedText(r, 16384));
      if (!/^\d+$/.test(result.generation)) throw new Error('state_generation_missing');
      return result.generation;
    },
  };
}
module.exports = { cloudState, cloudToken, BUCKET };
