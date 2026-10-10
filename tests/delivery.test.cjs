const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const YAML = require('yaml');
const workflow = YAML.parse(fs.readFileSync('.github/workflows/deploy.yml', 'utf8'));

test('delivery accepts only successful same-repository main push or explicit validation', () => {
  assert.deepEqual(workflow.on.workflow_run, {
    workflows: ['Validate'], types: ['completed'], branches: ['main'],
  });
  for (const guard of ["vars.HOSTING_DEPLOY_ENABLED == 'true'",
    "github.event.workflow_run.conclusion == 'success'",
    "(github.event.workflow_run.event == 'push' || github.event.workflow_run.event == 'workflow_dispatch')",
    "github.event.workflow_run.head_branch == 'main'",
    'github.event.workflow_run.head_repository.id == github.event.repository.id']) {
    assert.ok(workflow.jobs.deploy.if.includes(guard));
  }
  assert.equal(workflow.permissions.contents, 'read');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
});

test('delivery authenticates after checks and deploys exact current revision', () => {
  const job = workflow.jobs.deploy;
  assert.equal(job.permissions['id-token'], 'write');
  assert.equal(job['timeout-minutes'], 15);
  const steps = job.steps;
  assert.equal(steps[0].with.ref, '${{ github.event.workflow_run.head_sha }}');
  assert.equal(steps[0].with['persist-credentials'], false);
  const auth = steps.findIndex(step => step.uses?.startsWith('google-github-actions/auth@'));
  const build = steps.findIndex(step => step.run?.includes('npm run check:ci'));
  assert.ok(auth > build && build > 0);
  assert.match(steps[auth].uses, /@[a-f0-9]{40}$/);
  const publish = steps.at(-1).run;
  assert.ok(publish.indexOf('current_sha') < publish.indexOf('firebase deploy'));
  assert.ok(publish.includes('--only hosting --project blog-pumpkinpie'));
  assert.ok(publish.indexOf('firebase deploy') < publish.indexOf('Published Git revision:'));
  for (const step of steps.slice(3)) assert.equal(step.if, "steps.current.outputs.deploy == 'true'");
});
