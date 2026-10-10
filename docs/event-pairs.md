# Offline event-pair evaluation

The [specification](../specs/37-event-pairs/spec.md) and
[plan](../specs/37-event-pairs/plan.md) define an experimental title-based
retrieval baseline. It suggests pairs for evidence review, never event groups.
Run after freshness/source selection and successful collection-health checks.

Prepare a request outside Git, for example:

```json
{
  "schemaVersion": 1,
  "policy": {"minimumSimilarity": 0.55, "maxGapHours": 36, "maxPairs": 100},
  "articles": [
    {"id": "a", "title": "Synthetic Aruna bridge opens", "language": "en", "publishedAt": "2026-01-14T09:00:00Z"},
    {"id": "b", "title": "Aruna opens synthetic bridge", "language": "en", "publishedAt": "2026-01-14T10:00:00Z"}
  ]
}
```

```bash
node scripts/event-candidates.cjs shortlist /tmp/event-input.json /tmp/event-shortlist.json
node scripts/event-candidates.cjs evaluate tests/fixtures/event-pairs-synthetic.json /tmp/event-evaluation.json
```

The npm aliases are `shortlist:events` and `evaluate:events`. Destinations must
not exist and are created with owner-only permissions. The Node CLI prints
aggregate counts/metrics or fixed error codes; npm also echoes arguments.
Exit 0 means complete processing, 1 means invalid input/I/O or a truncated
shortlist, and 2 means incorrect arguments. Evaluation scores do not control
exit status: no release quality target has been approved.

Titles use NFKC/lowercase normalization and Unicode character-bigram Dice
similarity. Publication gaps are filters, not event timestamps. Every suggested
pair requires review; numeric/language flags only describe literal differences.
The algorithm does not translate, detect negation, resolve entities, verify facts,
identify wire independence or cluster pairs transitively. Keep a mapping from
input article IDs to the original collection report and source evidence.
Indices from a saved RSS report identify records in that report only, not stable
article/event identities across collection runs. Do not feed incomplete or
truncated reports into unattended publishing.

## Initial evaluation evidence

The 15 original synthetic cases include invented appointments, bridge milestones,
earthquakes, separate daily alerts, opposite decisions, paraphrases and translations.
Labels and rationale are explicit in the fixture; they were created alongside
this implementation and are not an independently reviewed real-news dataset.
At the example trial policy above:

| Pair retrieval result | Count |
| --- | ---: |
| Same-event pair shortlisted (TP) | 4 |
| Different-event pair shortlisted (FP) | 5 |
| Different-event pair omitted (TN) | 2 |
| Same-event pair missed (FN) | 3 |
| Uncertain, excluded from metrics | 1 |

Shortlist precision is 4/9 and recall is 4/7 on these supplied synthetic labels.
These are not production accuracy estimates or actual false merges: this tool
merges nothing. Scores expose why lexical similarity cannot be a publication gate.
A local trial on the 27 accepted records from the earlier RSS experiment produced
two candidate pairs from 351 possible pairs, without additional network requests.
Those real pairs remain unlabeled; no event-level accuracy claim follows.
All real titles and reports stayed outside Git.

## Next evaluation work

Prepare a locally labeled real-news sample with original source references and
evidence for actor/place/event time/status/figures. Include difficult different
events, substantive updates, syndication, numeric revisions and cross-language
coverage; use `uncertain` where evidence is insufficient. `local_labeled`
provenance is a caller assertion, not proof of independent review. Keep copied
publisher text and private reports outside Git, and review any exported aggregates.
Separate examples used for tuning from a held-out evaluation sample. Choose
quality targets and a bounded semantic review approach under #23/#20 before
using candidate decisions for automated content selection. No model API,
cloud service, scheduler or publication flow is activated by these commands.
