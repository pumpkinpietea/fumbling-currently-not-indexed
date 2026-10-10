const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

function filesUnder(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(file, extension);
    return entry.isFile() && file.endsWith(extension) ? [file] : [];
  });
}

function checkDocs(root) {
  const errors = [];
  const guides = ['README.md', 'AGENTS.md', 'CLAUDE.md']
    .map(file => path.join(root, file)).filter(file => fs.existsSync(file));
  const documents = [...guides, ...filesUnder(path.join(root, 'docs'), '.md'),
    ...filesUnder(path.join(root, 'specs'), '.md')];
  for (const file of documents) {
    const text = fs.readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].trim().replace(/^<|>$/g, '');
      if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const local = target.split('#')[0];
      if (!fs.existsSync(path.resolve(path.dirname(file), local))) {
        errors.push(`${path.relative(root, file)}: missing local link target ${target}`);
      }
    }
  }
  const forms = filesUnder(path.join(root, '.github', 'ISSUE_TEMPLATE'), '.yml');
  for (const file of forms) {
    const name = path.relative(root, file);
    if (path.basename(file) === 'config.yml') continue;
    try {
      const doc = YAML.parse(fs.readFileSync(file, 'utf8'));
      if (!doc || typeof doc.name !== 'string' || !doc.name.trim() ||
          typeof doc.description !== 'string' || !doc.description.trim() ||
          !Array.isArray(doc.body) || doc.body.length === 0) {
        throw new Error('name, description and a nonempty body are required');
      }
      const ids = new Set();
      for (const field of doc.body) {
        if (!field || !['markdown', 'input', 'textarea', 'dropdown', 'checkboxes'].includes(field.type)) {
          throw new Error('unsupported or missing field type');
        }
        if (field.type === 'markdown') {
          if (typeof field.attributes?.value !== 'string') throw new Error('markdown value is required');
          continue;
        }
        if (typeof field.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(field.id) || ids.has(field.id)) {
          throw new Error('field IDs must be valid and unique');
        }
        ids.add(field.id);
        if (typeof field.attributes?.label !== 'string' || !field.attributes.label.trim()) {
          throw new Error('field label is required');
        }
        if (field.validations?.required !== undefined && typeof field.validations.required !== 'boolean') {
          throw new Error('required must be a boolean');
        }
        if (['dropdown', 'checkboxes'].includes(field.type) &&
            (!Array.isArray(field.attributes.options) || field.attributes.options.length === 0)) {
          throw new Error('selection options are required');
        }
      }
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
    }
  }
  return { errors, documents: documents.length, forms: forms.length };
}

if (require.main === module) {
  const result = checkDocs(path.resolve(process.argv[2] || '.'));
  for (const error of result.errors) console.error(error);
  if (result.errors.length) process.exitCode = 1;
  else console.log(`Documentation checks passed (${result.documents} documents, ${result.forms} forms).`);
}
module.exports = { checkDocs };
