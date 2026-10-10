# Local quality baseline

Inspection date: 2026-10-10. No network/model execution was performed on the temporary generator. Imported source, copied article bodies and debug logs remain outside Git.

## Observations

| Sample | Observed baseline | Limit of the finding |
| --- | --- | --- |
| Published 2026-01-11 Japanese digest | 39 detail sections; four headlines about the Human Rights Council presidency; three about Grok restrictions | Same-event grouping candidates identified by headline review, not independently verified source-level labels |
| Saved 2026-01-14 output | English: 35 sections/35 unique parsed IDs. Japanese: 32 sections/32 unique IDs, missing 28, 29 and 31 | The current model contract allows silent omissions; missing output is not evidence that the underlying source is invalid |
| Saved 2026-01-14 output | Three article URLs contain 2017 dates | Publication metadata must be confirmed before labeling an article stale; URL dates alone are insufficient |
| Fifteen saved URL status reports | 352 snippet fallbacks, 219 article-body successes, 1,990 skipped as unrelated | Approximately 61.6% of accepted extraction records used snippets. These are per-run records, not distinct events or fact-accuracy measurements |
| Sampled January 2026 digests | No repeated exact source URL within the sampled editions | Exact URL uniqueness does not prevent repeated coverage of an event |

## Candidate regression cases

1. Group the presidency and Grok coverage only after validating event identity and whether any item contains a distinct substantive update.
2. Compare earthquake coverage with differing reported magnitudes using location, event timestamp, original source and revision time. Do not average values or assume distinct earthquakes.
3. Keep refinery opening, diesel self-sufficiency and a future import policy as distinct supported claims, even if selected under one event heading.
4. Reject an archived article from the current-news window unless it is clearly labeled historical context for a current event.
5. Reject unrelated keyword matches and unrelated links discovered from a navigation/RSS directory page.
6. Block rendering/publication when a language edition omits or duplicates an accepted event ID.
7. Preserve proposal/enacted distinctions, numeric units and negation across translations.

## Metrics not yet available

No grouping precision/recall, false-merge rate, supported-claim accuracy or source-quality ranking is claimed. Those require source-backed labels and a held-out evaluation sample. Do not tune and evaluate on the same small sample without reporting that limitation. These observations guide the next implementation issue; they do not prove that the proposed design solves the failures.
