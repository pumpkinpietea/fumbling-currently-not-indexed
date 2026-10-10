# Event-level news quality

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/23
Parent: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/20
Status: Proposed design; runtime implementation not started

## Goal

Publish an accurate, concise daily Indonesia digest with distinct events, traceable facts and consistent Japanese, English and Indonesian editions at low ongoing cost.

## Confirmed context

The developer confirms collection and article generation ran locally, not in an existing cloud collector. The temporary scripts are read-only migration inputs and must not be committed. Existing site configuration serves English/Japanese only. The highest-numbered supplied script is news_digest_v8.py; the actual last-used version is unconfirmed.

Local review found four headlines about the Human Rights Council presidency and three about Grok restrictions in the published 2026-01-11 Japanese digest. The saved 2026-01-14 generation has 35 English entries versus 32 Japanese entries; Japanese parsed output omits input IDs 28, 29 and 31. Three source URLs in that generation contain 2017 dates. A historical URL alone is an age warning, not verified publication metadata. Saved extraction logs contain 352 snippet fallbacks and 219 body successes across 15 reports; these counts do not establish factual accuracy.

## Acceptance criteria for the future implementation

- AC-1: Preserve original publisher, canonical URL, publication/update/collection times, extraction method and evidence provenance separately from aggregator URLs.
- AC-2: Apply an explicitly configured target interval/timezone. Unknown or conflicting dates are quarantined rather than treated as current. A genuine new update may reference older context with that distinction preserved.
- AC-3: Distinguish article identity from event identity. Group coverage of the same occurrence across publishers/languages, without merging separate occurrences merely sharing a topic, entity or date.
- AC-4: Identify syndicated/reposted coverage; multiple copies of one report do not count as independent corroboration. Preserve disagreements and source/update timestamps.
- AC-5: Use one accepted event/fact set for all languages. Validate exactly-once event coverage, input/output IDs, source references, numbers, units, dates and negation. Unknown IDs, missing events or invented source links block publication.
- AC-6: Summaries include only facts supported by cited evidence. Distinguish confirmed facts, attributed claims and analysis. Snippet-only input cannot support a detailed summary or confident impact claim.
- AC-7: Compare against previously published events: suppress unchanged repeats, allow explicitly labeled substantive updates, and support corrections with provenance.
- AC-8: Bound candidates, articles per event, model input/output, calls, retries and storage retention. Use deterministic filters and caching before model calls. No paid news API, vector database or persistent compute is mandatory for the initial design.
- AC-9: Evaluate duplicate grouping, false merges, freshness, relevance, evidence support and multilingual consistency on a labeled offline sample before live rollout; report uncertainty and unresolved errors.

## Scope and non-goals

This issue specifies quality policy and evaluation. It does not import temporary source, execute Gemini, select a final model, enable cloud APIs, implement unattended publication or assert that proposed heuristics already work.

## Product decisions still required

Topic/category priorities, daily item limit, timezone/window, handling of snippet-only short briefs, source reuse conditions, model/budget, multilingual rollout, and unattended publication/merge authority. Economic/policy emphasis is a proposal inferred from the existing prompt, not an approved exclusion of sports or other coverage. Do not assume every story needs two sources: a primary-source announcement can be attributed as such, while disputed claims need a separate evidentiary policy.
