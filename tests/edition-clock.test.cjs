const test = require('node:test');
const assert = require('node:assert/strict');
const { editionClock } = require('../scripts/edition-clock.cjs');
const settings = require('../config/news-publishing.json');
const at = value => editionClock(new Date(value));
test('normal publication begins exactly 07:30 Jakarta on the confirmed first day', () => {
  assert.equal(at('2026-10-11T00:29:59Z').valid, false);
  assert.equal(at('2026-10-10T12:00:00Z').valid, false);
  const result = at('2026-10-11T00:30:00Z');
  assert.equal(result.valid, true);
  assert.equal(result.enabled, false);
  assert.equal(result.editionDate, '2026-10-11');
  assert.equal(result.scheduledAt, '2026-10-11T00:30:00Z');
  assert.deepEqual(result.window, { start: '2026-10-09T17:00:00Z', end: '2026-10-10T17:00:00Z' });
});
test('UTC date change does not change the edition until the Jakarta timing gate', () => {
  assert.equal(at('2026-10-11T17:00:00Z').valid, false);
  assert.equal(at('2026-10-12T00:30:00Z').editionDate, '2026-10-12');
  assert.equal(at('2026-10-11T16:59:59Z').editionDate, '2026-10-11');
});
test('month, year and leap-day windows use complete previous local days', () => {
  for (const [instant, start, end] of [
    ['2026-11-01T00:30:00Z', '2026-10-30T17:00:00Z', '2026-10-31T17:00:00Z'],
    ['2027-01-01T00:30:00Z', '2026-12-30T17:00:00Z', '2026-12-31T17:00:00Z'],
    ['2028-03-01T00:30:00Z', '2028-02-28T17:00:00Z', '2028-02-29T17:00:00Z']])
    assert.deepEqual(at(instant).window, { start, end });
});
test('explicit replay is distinguishable and cannot select invalid or future dates', () => {
  const instant = new Date('2026-10-10T12:00:00Z');
  const result = editionClock(instant, { replayDate: '2026-10-10' });
  assert.equal(result.valid, true);
  assert.equal(result.replay, true);
  for (const replayDate of ['2026-10-11', '2026-02-30', '2026-2-01', '2019-12-31', null])
    assert.equal(editionClock(instant, { replayDate }).valid, false);
});
test('invalid configuration and instants never produce a runnable edition', () => {
  const instant = new Date('2026-10-11T00:30:00Z');
  for (const change of [{ timezone: 'UTC' }, { publishTime: '07:15' }, { enabled: 'true' },
    { firstEditionDate: '2026-02-30' }, { languages: ['en'] }, { limits: { ...settings.limits, maxRetries: 1 } }])
    assert.equal(editionClock(instant, { config: { ...settings, ...change } }).valid, false);
  assert.equal(editionClock(new Date('invalid')).valid, false);
  assert.equal(editionClock('2026-10-11T00:30:00Z').valid, false);
});
