# Offline event-pair shortlist and evaluation

Issue: #37. Parent: #23. Related: #20, #33, #35.

## Requirements and acceptance criteria

Input contains exactly `schemaVersion: 1`, `policy`, `articles`. Policy contains
`minimumSimilarity` (finite number in [0, 1]), `maxGapHours` (finite number in
[0, 168]) and `maxPairs` (integer 1..1000). These are explicit experimental
retrieval settings, not approved production confidence thresholds.

Articles (0..200) each contain exactly `id`, `title`, `language`, `publishedAt`.
IDs start with an ASCII letter/digit, otherwise use ASCII letters/digits/underscore/
hyphen, have length 1..64, and are unique.
Language is en/jp/id. Titles are nonblank, single-line strings of at most 500
UTF-16 units, without control characters, containing at least a letter/number.
Publication timestamps use strict valid UTC seconds. Invalid requests fail as a
whole; callers must first apply freshness/source policy and check collection health.

Normalize titles with NFKC, lowercase and removal of all non-letter/non-number
characters. Compare sets of adjacent Unicode code-point bigrams with Dice
similarity (a single-character title uses that character as its feature). No
stemming, stopword policy, translation, embeddings, entity extraction or meaning
inference. Only pairs within the explicit publication gap and at/above threshold
are eligible. Sort by descending unrounded similarity, then ASCII article IDs;
retain at most maxPairs. Output rounded six-decimal display scores but select
using the original score. Reordering input articles must not change results.

Every pair retains article IDs, publication gap, `reviewRequired: true` and
literal flags for differing numeric strings, differing languages or identical
normalized titles. Numeric strings include decimals and are compared as sets, without checking
quantity roles, units or repetition; flags are inspection aids,
not claims of disagreement or event identity. Similarity is not confidence.
Return total compared/eligible pair counts and `truncated`; never silently omit
budget overflow. Do not produce event groups or automatic merge decisions.

The evaluation input contains exactly schemaVersion, policy, `provenance` and
`cases`. Provenance is either `synthetic_original` or `local_labeled` and records
a caller assertion, not verified independence of labels. Each of 1..500 cases has
unique id, category, rationale, left/right article records and label
`same_event`, `different_event` or `uncertain`. Same-event cases are positives;
distinct occurrences/substantive updates that should remain separate are
negatives. Uncertain cases are counted separately, excluded from metrics.
Report TP/FP/TN/FN, precision and recall; zero denominators produce null. These
measure pair retrieval against supplied labels, not actual merges or end-to-end
news quality. Aggregate by category and preserve indexed case decisions in the
private report, without printing titles or rationale. Include challenging
original synthetic examples and visible misses/false candidates; do not tune
thresholds to promise a perfect benchmark result.

CLI modes `shortlist` and `evaluate` both read at most 1 MiB through the shared
reader and write only an explicit new owner-only report file. Print counts,
metrics and fixed error codes only. Usage exits 2, invalid requests/I/O/truncated
shortlists exit 1, complete processing exits 0. Low evaluation scores do not fail
the CLI: no quality acceptance threshold has been agreed. No external calls,
new dependencies, article deletion, site writes or publication.

## Limits and remaining decisions

Identical titles can describe separate occurrences. Related headlines may differ
in location, event time, status or negation. Cross-language same-event pairs may
have no lexical overlap. Publication time is not event time. No transitive
connected-component clustering is allowed by this feature. Wire independence,
substantive updates and factual equivalence require separate evidence.

The committed benchmark is original synthetic regression data authored alongside
the implementation, not an independently labeled real-news evaluation or a
representative accuracy estimate. Real-data labels, policy selection, source
rights, semantic review and acceptance targets remain pending under #23/#20.
