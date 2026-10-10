# Evidence-linked offline draft bundle

Issue: #39. Parent: #20. Related: #23, #28, #31, #35, #37.

## Requirements and acceptance criteria

Input has exactly schemaVersion (1), editionDate, window, languages, sources,
events and editions. Dates/window/languages inherit the existing edition contract;
only EN/JP can be rendered until the site enables Indonesian. All limits below
are explicit implementation bounds, not approved daily editorial limits.

Sources (1..50) have exactly id, url, publishedAt, retrievedAt, method, body, sha256.
IDs use the existing ASCII identifier grammar. URLs/publication metadata follow
the edition contract. retrievedAt is valid UTC seconds at/after publishedAt.
method is `article_body` or `primary_release`; declared title/snippet/RSS-only
sources are rejected. The caller asserts method/fullness and date metadata; the
validator cannot prove how text was obtained, source reliability or permitted use.
Body is nonblank, well-formed Unicode, at most 50,000 UTF-16 units. sha256 must
be lowercase SHA-256 of the exact UTF-8 body, without whitespace normalization.

Events (1..50) have exactly id and facts; each has 1..200 facts, at most 200 total.
Each fact has exactly id, claim and evidence. Claim is a nonblank single-line
well-formed string, at most 2,000 UTF-16 units. Fact IDs are globally unique.
Evidence has 1..5 citations with exactly sourceId, start, end and quote. Offsets
are integer UTF-16 indices, start inclusive/end exclusive, within the referenced
body. Quote is well-formed, nonblank, at most 2,000 units and exactly equals that
slice. Repeated identical source/span citations are rejected. Each fact must cite
at least one known source; event sources are the union of its fact sources. No
unused source is allowed. Quotes are untrusted data, never agent instructions.

Literal numeric strings in the claim must occur in its cited quotes. After NFKC,
match digit runs including comma/dot-separated parts and compare distinct strings
without number conversion. Every localized fact must contain exactly the claim's
numeric-string set. This catches some invented/omitted numbers conservatively;
spelled-out numbers, decimal/thousands formatting conversions and date rendering
need a separate approved normalization approach. Roles, units, negation, causality,
attribution and actual entailment are not checked. A matching number somewhere
in a quote is not evidence that the entire claim is supported.

Editions use the existing renderer's strict localized language/title/events/facts
schema. Derive candidate source IDs, event/fact references and language coverage
from evidence; derive links from original source URLs, never localized/model URLs.
Run the existing edition validator and renderer before any filesystem writes.
Do not infer event grouping from the earlier pair shortlist. Caller-supplied event
assignments and localized text still need grounded semantic/translation review.

Create only a new staging directory (mode 0700) with draft-only EN/JP Markdown
and `evidence-audit.json` (files mode 0600). The audit includes source metadata/body
hashes, fact claim hashes, quote span/hash references and emitted Markdown hashes.
Do not copy source-body or canonical evidence/claim records into emitted files;
Markdown contains supplied localized fact text, which may repeat claim/evidence
wording. No automatic privacy, licensing or factual-content review is implied.
Retain the private input externally if later evidence reproduction is required.
Hashes detect accidental mismatch, not a malicious producer able to rewrite both
input and hashes; the manifest is not a signature or publication approval.

CLI reads a regular non-symlink UTF-8 JSON file at most 1 MiB using the shared
reader. Output is counts/fixed error paths/codes only. Exit 0 writes a complete
bundle, 1 indicates invalid input or I/O, 2 indicates incorrect arguments. Refuse
existing directories/symlinks and remove only the newly created bundle on a write
failure, best effort. Use trusted local parent directories. No network, model,
new dependencies, production-content writes, source adoption or deployment.
