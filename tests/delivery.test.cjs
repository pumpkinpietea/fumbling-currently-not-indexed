const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const YAML = require('yaml');
const workflow = YAML.parse(fs.readFileSync('.github/workflows/deploy.yml', 'utf8'));

test('delivery accepts only successful same-repository main push or explicit validation', () => {
  assert.deepEqual(workflow.on.workflow_run, {
    workflows: ['Validate'], types: ['completed'], branches: ['main'],
  });
  assert.equal(workflow.on.workflow_dispatch.inputs.validation_run.required, true);
  assert.ok(workflow.jobs.deploy.if.includes("vars.HOSTING_DEPLOY_ENABLED == 'true'"));
  assert.ok(workflow.jobs.deploy.if.includes("github.ref == 'refs/heads/main'"));
  const verify = workflow.jobs.deploy.steps[0].run;
  for (const guard of ['.workflow_id == $workflow', '.path == ".github/workflows/validate.yml"',
    '.head_repository.id == $repo', '.head_branch == "main"', '.status == "completed"', '.conclusion == "success"',
    '.event == "push" or .event == "workflow_dispatch"']) assert.ok(verify.includes(guard));
  assert.equal(workflow.permissions.contents, 'read');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
});

test('delivery authenticates after checks and deploys exact current revision', () => {
  const job = workflow.jobs.deploy;
  assert.equal(job.permissions['id-token'], 'write');
  assert.equal(job['timeout-minutes'], 15);
  const steps = job.steps;
  assert.equal(steps[1].with.ref, '${{ steps.validation.outputs.sha }}');
  assert.equal(steps[1].with['persist-credentials'], false);
  const auth = steps.findIndex(step => step.uses?.startsWith('google-github-actions/auth@'));
  const build = steps.findIndex(step => step.run?.includes('npm run check:ci'));
  assert.ok(auth > build && build > 0);
  assert.match(steps[auth].uses, /@[a-f0-9]{40}$/);
  const publish = steps.at(-1).run;
  assert.ok(publish.indexOf('current_sha') < publish.indexOf('firebase deploy'));
  assert.ok(publish.includes('--only hosting --project blog-pumpkinpie'));
  assert.ok(publish.indexOf('firebase deploy') < publish.indexOf('Published Git revision:'));
  for (const step of steps.slice(4)) assert.equal(step.if, "steps.current.outputs.deploy == 'true'");
});

test('actual delivery predicate rejects unvalidated, unrelated and PR revisions', () => {
  const { execFileSync } = require('node:child_process');
  const filter = workflow.jobs.deploy.steps[0].run.match(/--argjson workflow "\$workflow_id" '([\s\S]*?)' > \/dev\/null/)[1];
  const valid = { workflow_id: 42, path: '.github/workflows/validate.yml', head_repository: { id: 9 },
    head_branch: 'main', event: 'workflow_dispatch', status: 'completed', conclusion: 'success', head_sha: 'a'.repeat(40) };
  const evaluate = value => execFileSync('jq', ['--exit-status', '--argjson', 'repo', '9', '--argjson', 'workflow', '42', filter],
    { input: JSON.stringify(value), stdio: ['pipe', 'pipe', 'pipe'] });
  assert.doesNotThrow(() => evaluate(valid));
  for (const change of [{ workflow_id: 41 }, { path: '.github/workflows/unrelated.yml' }, { head_repository: { id: 8 } },
    { head_branch: 'feature' }, { event: 'pull_request' }, { conclusion: 'failure' }, { status: 'queued' }, { head_sha: 'invalid' }])
    assert.throws(() => evaluate({ ...valid, ...change }));
});
