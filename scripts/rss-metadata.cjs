const { SaxesParser } = require('saxes');
const MAX_FEED_BYTES = 1024 * 1024;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function publicationTime(value, { allowFullMonthNames = false } = {}) {
  if (typeof value !== 'string') return null;
  if (allowFullMonthNames) {
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    value = value.replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/,
      month => MONTHS[fullMonths.indexOf(month)]);
  }
  const match = /^(?:(Sun|Mon|Tue|Wed|Thu|Fri|Sat), )?(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) (GMT|UT|[+-]\d{4})$/.exec(value);
  if (!match) return null;
  const [, weekday, dayText, monthText, yearText, hourText, minuteText, secondText, zone] = match;
  const [day, year, hour, minute, second] = [dayText, yearText, hourText, minuteText, secondText].map(Number);
  const month = MONTHS.indexOf(monthText);
  if (year < 1970 || hour > 23 || minute > 59 || second > 59) return null;
  const local = new Date(Date.UTC(year, month, day, hour, minute, second));
  if (local.getUTCFullYear() !== year || local.getUTCMonth() !== month || local.getUTCDate() !== day ||
      (weekday && DAYS[local.getUTCDay()] !== weekday)) return null;
  let offset = 0;
  if (zone !== 'GMT' && zone !== 'UT') {
    const hours = Number(zone.slice(1, 3)), minutes = Number(zone.slice(3));
    if (hours > 23 || minutes > 59 || zone === '-0000') return null;
    offset = (hours * 60 + minutes) * (zone[0] === '+' ? 1 : -1);
  }
  const result = new Date(local.getTime() - offset * 60000);
  if (result.getUTCFullYear() < 1970 || result.getUTCFullYear() > 9999) return null;
  return result.toISOString().replace('.000Z', 'Z');
}

function parseRss(buffer, options = {}) {
  try {
    if (!Buffer.isBuffer(buffer) || buffer.length > MAX_FEED_BYTES) throw new Error();
    const utf16 = options.allowUtf16 === true && ((buffer[0] === 0xff && buffer[1] === 0xfe) ||
      buffer.subarray(0, 10).equals(Buffer.from('<\0?\0x\0m\0l\0')));
    const text = new TextDecoder(utf16 ? 'utf-16le' : 'utf-8', { fatal: true }).decode(buffer);
    const parser = new SaxesParser({ xmlns: true });
    const stack = [], records = [];
    let nodes = 0, channels = 0, item, field;
    const fail = () => { throw new Error(); };
    parser.on('error', fail);
    parser.on('doctype', fail);
    parser.on('opentag', tag => {
      const name = tag.local === 'creator'
        ? options.includeCreator && tag.uri === 'http://purl.org/dc/elements/1.1/' ? 'creator' : `namespace:${tag.name}`
        : tag.uri ? `namespace:${tag.name}` : tag.name;
      stack.push(name);
      if (++nodes > 10000 || stack.length > 32 || field) fail();
      if (stack.length === 1 && (name !== 'rss' || tag.attributes.version?.value !== '2.0')) fail();
      if (stack.length === 2 && name === 'channel') {
        if (++channels !== 1) fail();
      }
      if (stack.join('/') === 'rss/channel/item') {
        if (records.length >= 200) fail();
        item = { title: [], link: [], pubDate: [], description: [], creator: [] };
      }
      if (item && stack.length === 4 && ['title', 'link', 'pubDate', ...(options.includeDescription ? ['description'] : []), ...(options.includeCreator ? ['creator'] : [])].includes(name)) {
        field = { name, text: '' };
      }
    });
    const append = value => {
      if (!field) return;
      field.text += value;
      if (field.text.length > ({ title: 500, link: 4096, pubDate: 100, description: 10000, creator: 160 })[field.name]) fail();
    };
    parser.on('text', append);
    parser.on('cdata', append);
    parser.on('closetag', () => {
      if (field && stack.length === 4) {
        item[field.name].push(field.text.trim());
        field = undefined;
      }
      if (stack.join('/') === 'rss/channel/item') {
        const one = key => item[key].length === 1 && item[key][0] ? item[key][0] : null;
        records.push({ itemIndex: records.length, title: one('title'), url: one('link'),
          publicationDatesRaw: [...item.pubDate], publishedAt: publicationTime(one('pubDate'), options),
          ...(options.includeDescription ? { description: one('description') } : {}),
          ...(options.includeCreator ? { creator: one('creator') } : {}) });
        item = undefined;
      }
      stack.pop();
    });
    parser.write(text).close();
    if (channels !== 1) fail();
    return { valid: true, records };
  } catch { return { valid: false, code: 'invalid_or_oversized_rss' }; }
}
module.exports = { parseRss, publicationTime, MAX_FEED_BYTES };
