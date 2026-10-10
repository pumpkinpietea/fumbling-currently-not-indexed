const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkDocs } = require('../scripts/check-docs.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-docs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.github', 'ISSUE_TEMPLATE'), { recursive: true });
  return root;
}
const form = 'name: Work\ndescription: Scoped work\nbody:\n  - type: textarea\n    id: goal\n    attributes:\n      label: Goal\n    validations:\n      required: true\n';

test('valid local links and issue form pass without inspecting imported secrets', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Instructions\n');
  fs.writeFileSync(path.join(root, 'README.md'), '[Instructions](AGENTS.md)\n[Web](https://example.com)\n');
  fs.writeFileSync(path.join(root, '.github', 'ISSUE_TEMPLATE', 'work.yml'), form);
  fs.mkdirSync(path.join(root, 'temp-script'));
  fs.writeFileSync(path.join(root, 'temp-script', 'private.md'), '[Missing](absent.md)');
  assert.deepEqual(checkDocs(root).errors, []);
});

test('missing local document prevents a passing check', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'README.md'), '[Instructions](absent.md)');
  assert.match(checkDocs(root).errors.join('\n'), /missing local link target/);
});

test('malformed YAML prevents a passing check', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '.github', 'ISSUE_TEMPLATE', 'work.yml'), 'name: [');
  assert.equal(checkDocs(root).errors.length, 1);
});

test('duplicate IDs and absent required form structure are rejected', t => {
  const root = fixture(t);
  const file = path.join(root, '.github', 'ISSUE_TEMPLATE', 'work.yml');
  fs.writeFileSync(file, form + '  - type: input\n    id: goal\n    attributes:\n      label: Another goal\n');
  assert.match(checkDocs(root).errors.join('\n'), /unique/);
  fs.writeFileSync(file, 'name: Work\ndescription: Scoped work\n');
  assert.match(checkDocs(root).errors.join('\n'), /nonempty body/);
});
