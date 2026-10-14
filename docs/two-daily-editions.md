# Two daily editions

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/89

The confirmed scope is Indonesia general news across all topics, plus Southeast Asia IT, e-commerce and digital economy INCLUDING Indonesia. Indonesia technology events can appear in both pages. The shared event is generated and reviewed once, then rendered with identical localized title/summary in both editions. General foreign/world news without SEA technology relevance is excluded. Geography and topic keyword matching only shortlists candidates; skeptical source review still has to establish actual relevance.

The existing Jakarta 07:30 collector runs once; the protected publication workflow follows it at 07:45 (Actions scheduling/deployment can delay availability). A successful complete run prepares the EN/JP pair only for topics with eligible events: date-indonesia-news.md and/or date-southeast-asia-tech.md. Each page uses its own translation key and stable dated slug. The first unattended October 12 collection succeeded at 07:31 Jakarta; the GitHub scheduled consumer started late at 13:31 and Hosting completed at 13:33. Actions scheduling is not a punctual delivery guarantee.

Historical Indonesia digests informed the structure: up to three linked highlights followed by detailed factual notes and original sources with publisher-country badges. Highlights reuse the same approved summaries, rather than a second model-written interpretation. Explicit news-N anchors keep directory and home links pointed at the news item rather than the highlights heading. The new pages do not reproduce speculative impact/confidence boilerplate or unrelated old world news. Existing historical articles are preserved.

The owner confirmed under #95 that empty topics must not produce articles. A topic with no eligible events produces no page, even when the other topic has news. A complete collection with no sources records no_news with zero AI calls and no publication bundle. If generation returns no events, skeptical review must still succeed before recording no_news. Failed collection, invalid generation or failed review remains a failure. Existing date/file conflicts prevent overwrites, and replay/date locks remain unchanged. October 12 empty SEA-tech EN/JP pages are removed by #95; Indonesia general news is retained.

## Bounds and publication contract

One generation and one skeptical review cover both topics, at most five unique events, at most four selected sources, zero retries and the existing 600-second/one-task job. Reserve two candidate slots per topic, prefer publisher diversity for remaining slots, then fill unused capacity with distinct eligible URLs from already reviewed publishers (#98). A single publisher can fill all four slots when the other topic or other publishers have no eligible evidence. Four sources are a maximum, not a minimum approved event count. Reviewed excerpts are capped at 1200 characters / 1600 bytes, except unchanged title-only institutional evidence. Send only grounding fields to the model, retaining full provenance privately; short summaries and one quote per source keep requests within the existing 16 KiB transport limit, which fails closed on oversized requests. No paid inference fallback or new cloud resources are added. The existing maximum runtime/resource spending envelope is unchanged; total GCP spending still depends on other project/account usage.

New bundle schema 3 binds the exact nonempty topic file set (two or four files), review, dates, original evidence and shared events. Retained schemas 1 and 2 are validated with their original rendering. After full validation, the consumer omits only schema 2 empty-topic pages; wholly empty retained bundles produce no Git mutations or PR. Consumer staging, already-published checks, PR scope verification and draft rehearsals use the exact reconstructed file set, not a general path allowance. Publication remains feature/content branch, required exact-head CI, protected squash merge, main validation and Hosting delivery.

Google personal discovery now runs five bounded queries: SEA tech, Chinese/Middle Eastern coverage of Indonesia general or SEA tech, Indonesia general, explicit Japanese Yahoo Indonesia discovery, and one rotating local-language tech query. Each gets up to 30 candidates, with 150 total, preventing earlier queries from exhausting all capacity. Yahoo results remain private Google-discovered links; Yahoo article bodies are not fetched or automatically used as public evidence. Public notes still use the reviewed official RSS source registry, including ANTARA general top news. Other private discovery uses the same inclusive scope.

## Browser verification

npm run check:ui -- --preview-bundle /absolute/private/bundle.json validates a bundle, overlays its reconstructed files into a temporary content copy, enables future dates only in that local preview, and covers populated daily layouts across EN/JP, three widths and light/dark (48 checks for one topic, 60 for both). It does not modify repository content or publish fixtures/trials. Inspect the captures through the image viewer; test success alone is not visual approval. After publication, run the ordinary live smoke check and inspect the shared production templates; verify the first actual dated pages after their scheduled publication.

Under #100, [Japanese intake](japanese-intake.md) adds official Yahoo world/business RSS and Japanese JETRO headlines. Private Google/Alerts candidates can rank independently accepted RSS originals only; they never supply factual text or original dates. Yahoo distribution dates and provider credits are distinct from the original publisher's article/event dates.

## Generation diagnostics and recovery

Schema4 events declare `editions` explicitly. The independent factual review checks actual topic membership; a background mention of AI does not automatically place cultural advocacy in the technology edition. ANTARA Indonesian grouping and decimal punctuation is normalized for numeric validation without changing exact source evidence or grounding quotes. Historical schemas1–3 keep their rendering contract.

Bounded model output and allowlisted phase/transport failures remain in private dated evidence for the existing retention period. Production writes a redacted failed/no_news status under the bundle prefix. When no bundle exists, the publication consumer fails on a known generation failure and succeeds without a post on no_news. Missing historical status remains distinguishable as no_bundle. No raw output or arbitrary upstream message is logged publicly; no automatic model retry or paid fallback is introduced.

Recover a failed date from retained evidence using a separately reviewed operator candidate and a protected content PR. Preserve original locks and evidence. Record source history only after live delivery, using a create-only write. See [the recovery contract](../specs/103-generation-recovery/spec.md).

## Daily capacity

Each topic page permits up to twenty independently reviewed events (forty unique events and sources across both pages). Shared Indonesia technology stories count toward both page caps. Candidate selection reserves twenty per topic, prefers publisher diversity, then uses eligible distinct stories from existing reviewed sources. Counts are ceilings, not quotas; unsupported, duplicate or irrelevant items are omitted and empty topics remain unpublished.

Normal execution remains two model calls, zero retries and600 seconds on the existing job. Combined model instructions/input are bounded at192KiB per call, private output envelope at256KiB, transport text at256KiB and stream at1MiB. Each inference timeout is240seconds within the job ceiling. More text can consume more plan usage or time; no paid fallback is enabled. See [capacity contract and cost assumptions](../specs/105-twenty-stories/spec.md).

## Source balance

Candidate reservations prefer one story from each original publisher, then fill up to five each, then exceed five when suitable candidate alternatives are exhausted. This preference is independent per topic. The supplemental forty-source evidence pool may contain additional dominant-publisher alternatives; it does not create extra publication slots. Generation and independent editorial review also receive the original-publisher grouping and soft-five policy. Final counts depend on supported distinct events; five is not a hard veto and no country minimum is imposed.

Yahoo is grouped by its credited original provider rather than by the distribution platform. NFKC/case/spacing normalization matches reviewed publisher names/IDs; explicit ANTARA Japanese labels also share the direct ANTARA group. Unknown labels remain separate. This is not a universal media-ownership or cross-language alias database. Public country badges and provider attribution retain their existing meanings.
