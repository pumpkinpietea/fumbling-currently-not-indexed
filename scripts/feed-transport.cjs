const https = require('node:https');
const dns = require('node:dns');
const { BlockList, isIP } = require('node:net');
const { MAX_FEED_BYTES } = require('./rss-metadata.cjs');
const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3]
]) blocked.addSubnet(address, prefix, 'ipv4');
const publicIpv4 = address => typeof address === 'string' && isIP(address) === 4 && !blocked.check(address, 'ipv4');

function fetchFeed(url, { request = https.request, resolve = dns.resolve4,
  timeoutMs = 15000, maxBytes = MAX_FEED_BYTES,
  contentTypes = ['application/rss+xml', 'application/xml', 'text/xml'] } = {}) {
  return new Promise((resolveResult, reject) => {
    let req, response, finished = false;
    const finish = (error, data) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (error) {
        reject(new Error(error));
        response?.destroy();
        req?.destroy();
      } else resolveResult(data);
    };
    const timer = setTimeout(() => finish('feed_timeout'), timeoutMs);
    let parsed;
    try {
      parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || parsed.hash) throw new Error();
      resolve(parsed.hostname, (error, addresses) => {
        if (finished) return;
        if (error || !Array.isArray(addresses) || !addresses.length || !addresses.every(publicIpv4)) {
          finish('feed_dns_rejected'); return;
        }
        const lookup = (hostname, options, callback) => {
          if (hostname !== parsed.hostname) { callback(new Error('feed_dns_rejected')); return; }
          if (options.all) callback(null, [{ address: addresses[0], family: 4 }]);
          else callback(null, addresses[0], 4);
        };
        try {
          req = request(parsed, { method: 'GET', agent: false, family: 4, lookup,
            rejectUnauthorized: true, servername: parsed.hostname,
            headers: { Accept: contentTypes.join(', '),
              'Accept-Encoding': 'identity', 'User-Agent': 'NewsMetadataTrial/1.0' } }, res => {
            response = res;
            res.on('error', () => finish('feed_network_error'));
            res.on('aborted', () => finish('feed_network_error'));
            const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
            const encoding = res.headers['content-encoding'];
            if (res.statusCode !== 200 || !contentTypes.includes(type) ||
                (encoding && encoding !== 'identity')) { finish('feed_response_rejected'); return; }
            if (res.headers['content-length'] && (!/^\d+$/.test(res.headers['content-length']) ||
                Number(res.headers['content-length']) > maxBytes)) { finish('feed_size_limit'); return; }
            let length = 0;
            const chunks = [];
            res.on('data', chunk => {
              length += chunk.length;
              if (length > maxBytes) { finish('feed_size_limit'); return; }
              if (!finished) chunks.push(chunk);
            });
            res.on('end', () => finish(null, Buffer.concat(chunks)));
          });
          req.on('error', () => finish('feed_network_error'));
          req.end();
        } catch { finish('feed_network_error'); }
      });
    } catch { finish('feed_request_rejected'); }
  });
}
module.exports = { fetchFeed, publicIpv4 };
