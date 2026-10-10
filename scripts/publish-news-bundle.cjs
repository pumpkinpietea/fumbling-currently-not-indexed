const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { calendarDate, editionClock } = require('./edition-clock.cjs');
const { cloudState } = require('./news-state.cjs');
const { validateBundle } = require('./daily-news.cjs');
const REPO = 'pumpkinpietea/fumbling-currently-not-indexed';
const AUTHOR = 'News Publishing Bot';
const EMAIL = '41898282+github-actions[bot]@users.noreply.github.com';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function github(endpoint, method = 'GET', body) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${endpoint}`, { method, redirect: 'error',
    signal: AbortSignal.timeout(30000), headers: { authorization: `Bearer ${process.env.GH_TOKEN}`,
      accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw new Error('github_request_failed');
  return r.status === 204 ? null : r.json();
}
async function validateRef(ref, sha) {
  await github('actions/workflows/validate.yml/dispatches', 'POST', { ref });
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const result = await github(`actions/workflows/validate.yml/runs?event=workflow_dispatch&head_sha=${sha}&per_page=10`);
    const run = result.workflow_runs.find(r => r.head_sha === sha && r.head_branch === ref);
    if (!run || run.status !== 'completed') continue;
    if (run.conclusion !== 'success') throw new Error('validation_failed');
    return run.html_url;
  }
  throw new Error('validation_timeout');
}
function inspectStaged(files) {
  const expected = Object.keys(files).sort();
  const names = git('diff', '--cached', '--name-only', '--diff-filter=A').split('\n').filter(Boolean).sort();
  if (JSON.stringify(names) !== JSON.stringify(expected) || git('diff', '--cached', '--name-only').split('\n').length !== 2)
    throw new Error('unexpected_staged_paths');
  // Inspect the complete staged diff and each staged blob, rather than a search-only gate.
  const diff = git('diff', '--cached', '--no-ext-diff', '--unified=1000');
  if (!diff || diff.includes('GIT binary patch')) throw new Error('invalid_staged_diff');
  for (const name of expected) {
    const content = git('show', `:${name}`) + '\n';
    if (content !== files[name] || /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|-----BEGIN|\b(?:sk-|gh[pousr]_|AIza)[A-Za-z0-9_-]{16,}|\/(?:home|workspaces)\/)/i.test(content))
      throw new Error('staged_privacy_rejected');
  }
  if (!git('var', 'GIT_AUTHOR_IDENT').startsWith(`${AUTHOR} <${EMAIL}>`) ||
      !git('var', 'GIT_COMMITTER_IDENT').startsWith(`${AUTHOR} <${EMAIL}>`)) throw new Error('unsafe_git_identity');
}
function rehearsalFiles(bundle, date) {
  const originals = validateBundle(bundle, date), files = {};
  for (const [name, content] of Object.entries(originals)) {
    const destination = name.replace(`${date}-southeast-asia-tech.md`, `${date}-southeast-asia-tech-rehearsal.md`);
    files[destination] = content.replace('draft: false', 'draft: true')
      .replace(`slug: southeast-asia-tech-${date}`, `slug: southeast-asia-tech-${date}-rehearsal`)
      .replace(`translationKey: southeast-asia-tech-${date}`, `translationKey: southeast-asia-tech-${date}-rehearsal`);
  }
  return files;
}
async function publish() {
  const rehearsal = process.env.NEWS_REHEARSAL_DATE || '';
  if (process.env.GITHUB_REF !== 'refs/heads/main' ||
      (rehearsal ? process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
        process.env.NEWS_PUBLISH_ENABLED !== 'false' || !calendarDate(rehearsal) :
        process.env.NEWS_PUBLISH_ENABLED !== 'true')) throw new Error('publication_not_active');
  const clock = editionClock(new Date());
  if (!rehearsal && (!clock.valid || !clock.enabled)) throw new Error('publication_not_due');
  const date = rehearsal || clock.editionDate, state = cloudState(process.env.GOOGLE_ACCESS_TOKEN);
  const object = await state.read(`bundles/${rehearsal ? 'rehearsal-' : ''}${date}.json`);
  if (!object) return { status: 'no_bundle', editionDate: date };
  if (!process.env.NEWS_RUNTIME_REVISION || object.value.revision !== process.env.NEWS_RUNTIME_REVISION)
    throw new Error('unapproved_runtime_revision');
  const files = rehearsal ? rehearsalFiles(object.value, date) : validateBundle(object.value, date), original = git('rev-parse', 'HEAD');
  if ((await github('git/ref/heads/main')).object.sha !== original || git('status', '--porcelain')) throw new Error('clean_current_main_required');
  const existing = Object.keys(files).filter(file => fs.existsSync(file));
  if (existing.length) {
    if (existing.length === 2 && existing.every(file => fs.readFileSync(file, 'utf8') === files[file]))
      return { status: 'already_published', editionDate: date };
    throw new Error('existing_edition_conflict');
  }
  const branch = `news/${rehearsal ? 'rehearsal-' : ''}${date}`;
  if ((await github(`pulls?state=open&head=pumpkinpietea:${branch}`)).length) throw new Error('existing_news_pr');
  git('switch', '-c', branch);git('config', 'user.name', AUTHOR);git('config', 'user.email', EMAIL);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });fs.writeFileSync(file, content, { flag: 'wx' });
  }
  git('add', '--', ...Object.keys(files));inspectStaged(files);
  git('diff', '--cached', '--check');git('commit', '-m', `${rehearsal ? 'Rehearse' : 'Publish'} Southeast Asia tech notes for ${date}`);
  const head = git('rev-parse', 'HEAD');
  if (git('diff', '--name-only', `${original}...HEAD`).split('\n').sort().join('\n') !== Object.keys(files).sort().join('\n'))
    throw new Error('outgoing_scope_rejected');
  const askpass = path.join(process.env.RUNNER_TEMP, 'news-git-askpass.sh');
  fs.writeFileSync(askpass, '#!/bin/sh\nprintf \'%s\\n\' "$GH_TOKEN"\n', { mode: 0o700, flag: 'wx' });
  try { execFileSync('git', ['push', `https://x-access-token@github.com/${REPO}.git`, `HEAD:refs/heads/${branch}`],
    { env: { ...process.env, GIT_ASKPASS: askpass, GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }); }
  finally { fs.unlinkSync(askpass); }
  const pr = await github('pulls', 'POST', { title: `${rehearsal ? 'Draft rehearsal: ' : ''}Southeast Asia tech notes — ${date}`, head: branch, base: 'main',
    body: 'Automated factual EN/JP edition from the private bounded news pipeline. Source dates, exact grounding quotes, translation numbers and skeptical model review passed. The complete staged content and scope were checked before commit. Only the two new edition files are included.\n\nTracked in #55.' });
  const validation = await validateRef(branch, head);
  const current = await github(`pulls/${pr.number}`), changes = await github(`pulls/${pr.number}/files`);
  if (current.head.sha !== head || current.base.sha !== original ||
      changes.length !== 2 || changes.some(c => c.status !== 'added' || !Object.hasOwn(files, c.filename)) ||
      (await github('git/ref/heads/main')).object.sha !== original) throw new Error('pr_scope_or_base_changed');
  // GitHub enforces required checks and up-to-date main; no administrator bypass is used.
  const merged = await github(`pulls/${pr.number}/merge`, 'PUT', { sha: head, merge_method: 'squash',
    commit_title: `${rehearsal ? 'Rehearse' : 'Publish'} Southeast Asia tech notes for ${date}`,
    commit_message: `Validated content-only edition. ${validation}` });
  if (!merged.merged) throw new Error('merge_failed');
  await github('actions/workflows/validate.yml/dispatches', 'POST', { ref: 'main' });
  return { status: 'merged_awaiting_delivery', editionDate: date, pr: pr.html_url, revision: merged.sha };
}
if (require.main === module) publish().then(result => console.log(JSON.stringify(result))).catch(() => {
  console.log(JSON.stringify({ status: 'failed', code: 'news_publication_failed' }));process.exitCode = 1;
});
module.exports = { inspectStaged, rehearsalFiles };
