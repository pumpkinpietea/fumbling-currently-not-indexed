# Quality design and evaluation plan

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/23

## Proposed pipeline

Collect -> preserve metadata -> normalize article identity -> filter freshness/relevance -> group event candidates -> validate evidence/facts -> select events -> translate the shared event set -> validate -> stage for publication.

Use stable internal article/event IDs independent of headline translation and display anchors. Normalize tracking URLs without deleting identity-bearing query fields; verify canonical publisher links. Redirects/discovered feeds need bounded HTTP(S) retrieval, allowed-source checks and rejection of local/private endpoints. A model cannot decide which URLs the job may fetch.

Deduplicate exact canonical URLs and content hashes first. Use inexpensive title/body similarity with entity, place and time features to shortlist possible event matches. Cross-language or ambiguous candidates may use a bounded model call. Keep the group decision and rationale. Do not group all earthquakes, all fuel policy stories or all comments about one government into a single event.

Track event updates with fingerprints of supported facts and timestamps. Use a small versioned manifest or database selected in the publishing design; preserve state across scheduled executions. Concurrency and idempotency must prevent duplicate publication and overwriting a verified edition with a partial result.

Create one language-neutral fact record with claim-to-source references, then render every language from it. Preserve actor, place, event time, figures/currency/unit, status (proposal vs enacted), attribution and disagreement. Do not average conflicting magnitudes or infer that older publication dates imply new developments. Treat fetched article text as untrusted data, never as agent instructions.

## Source candidates and access evaluation

| Candidate | Role | Evaluation before adoption |
| --- | --- | --- |
| ANTARA category RSS | Domestic discovery | Current feed/body availability, category relevance, original vs syndicated reporting |
| CNA official RSS | Regional context and comparison | Indonesia relevance, origin of wire reports, extraction availability |
| BPS releases | Official statistical evidence | Release time, reference period, revised values, units and permitted use |
| Bank Indonesia releases | Monetary-policy evidence | Official announcement vs commentary, timestamps and retrieval method |
| BMKG open earthquake data | Disaster parameters | Event ID, location/time, preliminary vs revised data, attribution requirements |
| Existing local publishers | Additional viewpoints | Verify feeds, independent origin, quality and access conditions; avoid all-section feeds by default |
| Google News / optional GDELT | Discovery only | Resolve original publisher; no inference that an aggregator is an independent source |

Official announcements establish what an institution states, not independent proof of every asserted outcome. RSS availability does not automatically license article-body republication. Do not bypass paywalls. Record feed health, freshness, original-link/body success and accepted-event yield, then choose a small source set using evidence rather than publisher count.

## Evaluation

Use the 15 saved daily outputs locally. Build an independently reviewed sample of article pairs/groups, supported fact records and expected language coverage. Keep copied raw article bodies, API inputs, credentials and debug logs out of Git. Store only sanitized metadata, original fixture text created for tests and aggregate evaluation results after privacy review.

Include same-event different-media pairs, same-wire copies, cross-language coverage, distinct events with similar titles, updates on later days, date ambiguity/missing dates, archived articles, unrelated keyword matches, model missing/duplicate/unknown IDs, changed URLs, snippet-only input, numeric conflicts and translation negation/unit errors.

Report grouping precision/recall and false merges against labels; accepted/blocked counts and reasons; source mix and extraction rate; event coverage parity; supported numeric/date claims; model calls/tokens and estimated monthly cost. Exact ID/URL contract violations must be zero for published output. Semantic thresholds need a labeled baseline and developer-approved targets, not an arbitrary confidence number.

Regression examples: the 2026-01-11 presidency/Grok groups should each be one event unless evidence identifies a distinct substantive update. The differing earthquake magnitudes require checking event identity and revision timestamps before merging. Related refinery/fuel-policy articles require a fact-level distinction, not automatic consolidation.

## Cost strategy and references

Run the initial evaluation offline without cloud or model calls. Prefer conventional normalization/similarity and caching; add embeddings only if measured quality requires them. Select the execution platform and cost estimate in #20 once expected load is known.

- [ANTARA RSS](https://www.antaranews.com/rss?mobile=true)
- [CNA RSS](https://www.channelnewsasia.com/rss)
- [BPS official releases](https://www.bps.go.id/en/pressrelease)
- [Bank Indonesia publications](https://www.bi.go.id/id/publikasi/Default.aspx)
- [BMKG open data](https://data.bmkg.go.id/gempabumi/)
- [GDELT discovery API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
