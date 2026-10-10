# Evidence-linked offline drafts

The [requirements](../specs/39-evidence-drafts/spec.md) and
[plan](../specs/39-evidence-drafts/plan.md) connect prepared source evidence,
canonical claims and localized text to the existing edition validator/renderer.
No body retrieval, model generation or automatic publication is performed.

Try the original synthetic fixture with a new staging directory:

```bash
npm run render:evidence -- tests/fixtures/evidence-valid.json /tmp/evidence-preview-content
```

Success creates two draft-only Markdown files under en/article and jp/article,
plus a private root-level `evidence-audit.json`. Follow the
[Hugo draft preview guide](news-drafts.md), setting each language's contentDir to
its corresponding directory. Keep the audit outside public content and deployment
inputs; copying the whole staging directory into the site is not a release flow.
The real pipeline is not wired to enforce this command as a publication gate.

The input fixture shows the full contract. Prepare real source material only after
source access/reuse and publication metadata have been evaluated. Keep real bodies,
quotes, claims and reports outside Git. Source method/fullness and timestamps are
caller assertions, not independently verified by this command. Declared title,
snippet or RSS-only inputs fail; changing the label cannot make evidence reliable.

Use `article_body` or `primary_release` source records with id, original HTTPS URL,
publishedAt/retrievedAt, exact body and its lowercase SHA-256. Hash the UTF-8 body
without trimming or other normalization. Each event's fact has an id, canonical
claim and exact citations into known source bodies. Quote offsets use JavaScript
UTF-16 string indices: start inclusive, end exclusive. Compute them against the
same body used for hashing; Python character indices differ for astral characters.
Repeated identical source/span citations are rejected.

The adapter derives event/source/fact references and source links, then checks
localized editions with the existing renderer. Every language must contain the
same events and fact IDs. Missing references, stale body hashes, altered quotes,
unsupported literal claim numbers and different localized numeric sets block the
bundle. Spelled-out numbers, locale-specific numeric/date conversions, quantity
roles, units, negation and factual entailment are outside these checks. Titles and
translation meanings remain unverified. A claim can pass these checks and still
be false or unsupported in meaning; grounded semantic review is still necessary.

The audit preserves source metadata/body hashes, claim hashes, source quote spans/
hashes and Markdown hashes. It does not copy raw source-body, evidence or claim
records. Markdown contains the supplied localized text and can repeat evidence
wording. The tool does not perform copyright/privacy review or text redaction.
Retain the private input if evidence must be reproduced. A hash manifest is not a
signature, a factual endorsement or release approval.

New staging directories use mode 0700 and emitted files mode 0600. Existing paths
or symlinks are refused. Invalid input creates no bundle; a write failure removes
only the newly created bundle, best effort. The Node CLI prints only draft counts
and error paths/codes; npm also echoes arguments. Exit 0 means the bundle was
written, 1 indicates invalid input/I/O, 2 means incorrect arguments. Input must be
a regular non-symlink UTF-8 JSON file no larger than 1 MiB. Parent directories are
trusted local paths; do not rely on cleanup against hostile concurrent mutation.

## Validation and remaining work

The original fixture uses an invented reading-room opening. The CLI produced
EN/JP drafts and an audit; real Hugo builds included them only with draft preview
enabled, excluding them from a normal build. Tests cover body/hash/span changes,
UTF-16 boundaries, missing/unknown/duplicate references, declared snippet inputs,
numeric mismatches, audit/output hashes, private staging and CLI redaction.
Tests also explicitly demonstrate that literal numeric matching cannot establish
quantity roles or semantic support. No publisher text was imported into fixtures.

Next steps remain source/date evidence and permitted body acquisition, real-news
semantic grouping/review, a bounded model/provider integration, authenticated
main-only deployment and agreed scheduling/content merge activation under #20.
