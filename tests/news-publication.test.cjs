const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { inspectStaged, rehearsalFiles } = require('../scripts/publish-news-bundle.cjs');
const YAML = require('yaml');
test('publication privacy gate inspects only two new staged articles with pseudonymous identities', () => {
  const cwd = process.cwd(), directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-gate-'));
  const files = { 'content/en/article/2026-10-11-southeast-asia-tech.md': 'Synthetic original English news summary.\n',
    'content/jp/article/2026-10-11-southeast-asia-tech.md': '合成テスト用の日本語ニュース要約です。\n' };
  const git = (...args) => execFileSync('git', args, { cwd: directory, stdio: 'pipe' });
  try {
    git('init', '-b', 'main');git('config', 'user.name', 'News Publishing Bot');
    git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
    fs.writeFileSync(path.join(directory, 'initial'), 'Fixture.');git('add', 'initial');git('commit', '-m', 'Initial fixture');
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });fs.writeFileSync(path.join(directory, file), content);
    }
    git('add', 'content');process.chdir(directory);inspectStaged(files);
    fs.writeFileSync('unrelated', 'Unexpected');git('add', 'unrelated');assert.throws(() => inspectStaged(files));
    git('reset', 'unrelated');git('config', 'user.email', 'synthetic@example.test');assert.throws(() => inspectStaged(files));
  } finally { process.chdir(cwd);fs.rmSync(directory, { recursive: true, force: true }); }
});
test('consumer is main-only, serialized, explicitly validates and keeps private auth out of build context', () => {
  const workflow = YAML.parse(fs.readFileSync('.github/workflows/publish-news.yml', 'utf8'));
  assert.equal(workflow.on.schedule[0].cron, '45 0 * * *');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.ok(workflow.jobs.publish.if.includes("github.ref == 'refs/heads/main'"));
  assert.equal(workflow.jobs.publish.steps[0].with['persist-credentials'], false);
  const auth = workflow.jobs.publish.steps.find(s => s.id === 'auth');
  assert.equal(auth.with.create_credentials_file, false);
  const source = fs.readFileSync('scripts/publish-news-bundle.cjs', 'utf8');
  assert.ok(source.includes("actions/workflows/validate.yml/dispatches"));
  assert.ok(source.includes("current.head.sha !== head"));assert.ok(source.includes("changes.length !== 2"));
  assert.ok(source.includes("object.value.revision !== process.env.NEWS_RUNTIME_REVISION"));
  assert.equal(YAML.parse(fs.readFileSync('.github/workflows/validate.yml', 'utf8')).on.workflow_dispatch, null);
  const ignore = fs.readFileSync('.dockerignore', 'utf8');assert.ok(ignore.startsWith('**\n'));
  assert.ok(!ignore.includes('!.git') && !ignore.includes('!content') && !ignore.includes('!temp-script'));
});

test('manual rehearsal reconstructs two isolated drafts from reviewed evidence and rejects tampering', () => {
  const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
  const { renderEdition } = require('../scripts/daily-news.cjs');
  const date = '2026-10-11';
  const source = extractRssEvidence({ url: 'https://www.antaranews.com/berita/1234567/digital-services',
    title: 'Indonesia announces digital services plans', publishedAt: '2026-10-10T04:00:00Z',
    description: 'The ministry announced plans for digital services in Indonesia.' });
  const event = { sourceIds: [source.id], quotes: [{ sourceId: source.id, text: source.excerpt.slice(-62) }],
    en: { title: 'Indonesia digital services plans', summary: 'The ministry announced digital services plans in Indonesia.' },
    jp: { title: 'インドネシアのデジタルサービス計画', summary: '同省はインドネシアのデジタルサービス計画を発表しました。' } };
  const bundle = { schemaVersion: 1, editionDate: date, revision: 'a'.repeat(40), sources: [source],
    events: [event], review: { approved: true, checkedIds: [source.id] }, files: renderEdition(date, [event], [source]) };
  const files = rehearsalFiles(bundle, date);
  assert.deepEqual(Object.keys(files), ['content/en/article/2026-10-11-southeast-asia-tech-rehearsal.md',
    'content/jp/article/2026-10-11-southeast-asia-tech-rehearsal.md']);
  for (const content of Object.values(files)) {
    const frontmatter = YAML.parse(content.split('---')[1]);
    assert.equal(frontmatter.draft, true);
    assert.equal(frontmatter.slug, 'southeast-asia-tech-2026-10-11-rehearsal');
    assert.equal(frontmatter.translationKey, frontmatter.slug);
  }
  assert.ok(Object.values(bundle.files).every(content => content.includes('draft: false')));
  bundle.review.approved = false;
  assert.throws(() => rehearsalFiles(bundle, date));
});
