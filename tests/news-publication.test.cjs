const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { inspectStaged, rehearsalFiles, validatePr, validateMain } = require('../scripts/publish-news-bundle.cjs');
const YAML = require('yaml');
test('publication privacy gate inspects exactly four new staged articles with pseudonymous identities', () => {
  const cwd = process.cwd(), directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-gate-'));
  const files = { 'content/en/article/2026-10-11-southeast-asia-tech.md': 'Synthetic original English news summary.\n',
    'content/jp/article/2026-10-11-southeast-asia-tech.md': '合成テスト用の日本語ニュース要約です。\n' };
  files['content/en/article/2026-10-11-indonesia-news.md']='Synthetic Indonesia general news summary.\n';
  files['content/jp/article/2026-10-11-indonesia-news.md']='インドネシア全般の合成ニュース要約です。\n';
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
  assert.ok(source.includes("current.head.sha !== head"));assert.ok(source.includes("changes.length !== Object.keys(files).length"));
  assert.ok(source.includes("object.value.revision !== process.env.NEWS_RUNTIME_REVISION"));
  assert.equal(YAML.parse(fs.readFileSync('.github/workflows/validate.yml', 'utf8')).on.workflow_dispatch, null);
  const ignore = fs.readFileSync('.dockerignore', 'utf8');assert.ok(ignore.startsWith('**\n'));
  assert.ok(ignore.includes('!data/news_sources.json\n') && ignore.includes('!data/news_labels.json\n'));
  assert.ok(!ignore.includes('!data/**')); 
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

test('PR validation approves only associated exact-head CI after scope verification and requires success', async () => {
  const sha = 'a'.repeat(40), ref = 'news/2026-10-11';
  const run = { id: 101, event: 'pull_request', head_sha: sha, head_branch: ref,
    path: '.github/workflows/validate.yml', pull_requests: [{ number: 7 }], status: 'completed',
    conclusion: 'action_required', html_url: 'https://github.com/synthetic/validation' };
  let polls = 0, scope = 0;const approvals = [];
  const result = await validatePr(ref, sha, 7, async () => { scope++; }, { delay: async () => {},
    api: async (endpoint, method) => {
      if (method === 'POST') { assert.equal(scope, 1);approvals.push(endpoint);return null; }
      polls++;
      const unrelated = [{ ...run, id: 201, head_sha: 'b'.repeat(40) },
        { ...run, id: 202, pull_requests: [{ number: 8 }] }, { ...run, id: 203, event: 'workflow_dispatch' }];
      return { workflow_runs: polls === 1 ? unrelated : [...unrelated, { ...run, conclusion: polls >= 4 ? 'success' : 'action_required' }] };
    } });
  assert.equal(result, run.html_url);assert.deepEqual(approvals, ['actions/runs/101/approve']);assert.equal(scope, 1);
  await assert.rejects(validatePr(ref, sha, 7, async () => { throw new Error('scope_changed'); }, {
    delay: async () => {}, api: async (_endpoint, method) => { assert.notEqual(method, 'POST');return { workflow_runs: [run] }; }
  }), /scope_changed/);
  await assert.rejects(validatePr(ref, sha, 7, async () => {}, { delay: async () => {},
    api: async () => ({ workflow_runs: [{ ...run, conclusion: 'failure' }] }) }), /validation_failed/);
});

test('bot main delivery dispatch waits for exact merged-main successful validation', async () => {
  const sha = 'c'.repeat(40), calls = [];let polls = 0;
  const run = { id: 301, event: 'workflow_dispatch', head_sha: sha, head_branch: 'main',
    path: '.github/workflows/validate.yml', status: 'completed', conclusion: 'success', html_url: 'https://github.com/synthetic/main-validation' };
  const result = await validateMain(sha, { delay: async () => {}, api: async (endpoint, method, body) => {
    if (method === 'POST') { calls.push({ endpoint, body });return null; }
    return { workflow_runs: ++polls === 1 ? [{ ...run, head_sha: 'd'.repeat(40) }] : [run] };
  } });
  assert.equal(result, run.html_url);
  assert.deepEqual(calls, [{ endpoint: 'actions/workflows/validate.yml/dispatches', body: { ref: 'main' } },
    { endpoint: 'actions/workflows/deploy.yml/dispatches', body: { ref: 'main', inputs: { validation_run: '301' } } }]);
  let posted = 0;
  await assert.rejects(validateMain(sha, { delay: async () => {}, api: async (_endpoint, method) => {
    if (method === 'POST') { posted++;return null; }
    return { workflow_runs: [{ ...run, conclusion: 'failure' }] };
  } }), /main_validation_failed/);
  assert.equal(posted, 1);
});

test('retained schema two empty-page rehearsal produces no drafts',()=>{
  const {renderDailyEditions}=require('../scripts/daily-news.cjs');
  const date='2026-10-11';
  const bundle={schemaVersion:2,editionDate:date,revision:'a'.repeat(40),sources:[],events:[],review:{approved:true,checkedIds:[]},files:renderDailyEditions(date,[],[],{includeEmpty:true})};
  assert.deepEqual(rehearsalFiles(bundle,date),{});
});
