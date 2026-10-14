const settings = require('../config/news-publishing.json');
const DAY = 86400000;
const OFFSET = 7 * 3600000;
function calendarDate(value) {
  return typeof value === 'string' && /^20\d\d-\d\d-\d\d$/.test(value) &&
    value >= '2020-01-01' && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function editionClock(instant, { replayDate, config = settings } = {}) {
  const invalid = code => ({ valid: false, errors: [{ code }] });
  if (!config || config.schemaVersion !== 1 || typeof config.enabled !== 'boolean' ||
      config.timezone !== 'Asia/Jakarta' || config.publishTime !== '07:30' ||
      !calendarDate(config.firstEditionDate) ||
      JSON.stringify(config.languages) !== JSON.stringify(['en', 'jp']) ||
      !config.limits || config.limits.maxConcurrentRuns !== 1 || config.limits.maxRetries !== 0 ||
      !Number.isInteger(config.limits.maxEvents) || config.limits.maxEvents < 1 || config.limits.maxEvents > 40 ||
      (config.limits.maxEvents > 5 && (config.limits.maxEventsPerEdition !== 20 || config.limits.maxSources !== 40)) ||
      !Number.isInteger(config.limits.maxModelCalls) || config.limits.maxModelCalls < 1 || config.limits.maxModelCalls > 2 ||
      !Number.isInteger(config.limits.maxRunSeconds) || config.limits.maxRunSeconds < 1 || config.limits.maxRunSeconds > 600)
    return invalid('invalid_publishing_configuration');
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) return invalid('invalid_run_instant');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(instant).map(part => [part.type, part.value]));
  const localDate = `${parts.year}-${parts.month}-${parts.day}`;
  if (!calendarDate(localDate)) return invalid('invalid_run_instant');
  const date = replayDate === undefined ? localDate : replayDate;
  if (!calendarDate(date) || date > localDate) return invalid('invalid_replay_date');
  if (replayDate === undefined && (date < config.firstEditionDate || `${parts.hour}:${parts.minute}` < config.publishTime))
    return invalid('before_publication_start');
  const end = Date.parse(`${date}T00:00:00Z`) - OFFSET;
  const timestamp = value => new Date(value).toISOString().replace('.000Z', 'Z');
  return { valid: true, schemaVersion: 1, enabled: config.enabled, editionDate: date,
    timezone: config.timezone, scheduledAt: timestamp(end + 7.5 * 3600000),
    window: { start: timestamp(end - DAY), end: timestamp(end) }, languages: [...config.languages],
    replay: replayDate !== undefined };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const result = args.length === 0 ? editionClock(new Date()) :
    args.length === 2 && args[0] === '--date' ? editionClock(new Date(), { replayDate: args[1] }) :
      { valid: false, errors: [{ code: 'usage_optional_date_required' }] };
  console.log(JSON.stringify(result)); process.exitCode = result.valid ? 0 : 1;
}
module.exports = { editionClock, calendarDate };
