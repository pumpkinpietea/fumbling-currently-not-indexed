# Increasing eligible news coverage

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/115

## Current strategy

Collect16 reviewed official RSS feeds hourly and merge original-date evidence into the previous Jakarta calendar day. Add specialist coverage before increasing model usage: Viet Nam News Sci-Tech, Yahoo IT and Cabinet Secretariat of Indonesia headlines supplement existing news sources. Yahoo remains a distributor grouped by its credited provider; cabinet announcements are government primary statements, not independent reporting. No source-country or story-count quota changes editorial scope.

The same40-source/20-events-per-topic/two-call caps remain. A source slot requires usable cleaned evidence first. Private counters distinguish policy, original date, history/duplicate, evidence and relevance exclusions. Extracted text, rather than HTML attributes/image paths, supplies scope keywords. Yahoo provider credit cannot itself supply the subject country/topic: “ケータイ Watch” is not a reference to Thailand.

Schema5 permits complete Japanese institutional headlines with at least20 cleaned characters, Japanese script and an explicitly Japanese-language feed. The exact quote still needs20 characters. Non-Japanese titles and all excerpt descriptions retain40; no title padding or inferred details. Schemas1–4 retain the40-character evidence minimum and existing numeric contracts. Semantic sufficiency still requires independent review;20 characters are not proof of adequate facts.

Precise quantum-computing terms, regional city names and Unicode dash normalization improve discovery. They are a candidate filter, not permission to publish general foreign science, industrial marketing or incidental technology mentions. The skeptical editor must reject weak, unrelated, speculative or duplicate candidates.

## New source review (2026-10-17)

| Feed | Official evidence and handling |
| --- | --- |
| Viet Nam News Sci-Tech | https://vietnamnews.vn/rss/sci-tech.rss — official same-host title/excerpt, UTF-16 adapter; exact `Sci-Tech` article route admitted. Same personal/nonprofit RSS factual-note scope as existing economy feeds. https://vietnamnews.vn/rss and https://vietnamnews.vn/privacy.html retain copyright; no body/image reproduction or blanket license. |
| Yahoo IT | https://news.yahoo.co.jp/rss/categories/it.xml — official category feed under existing Yahoo policy; original-provider credit mandatory and distribution time preserved. Only exact `?source=rss` removed. Official directory/help: https://news.yahoo.co.jp/rss and https://support.yahoo-net.jp/PccNews/s/article/H000011243 . |
| Cabinet Secretariat of Indonesia | https://setkab.go.id/en/feed/ — official same-origin RSS verified against https://setkab.go.id/en/ . Headline-only short original factual notes, original link/time and institutional attribution. Descriptions/bodies/images/copied paragraphs excluded. Copyright retained; general republication rights are not established or claimed. |

Actual bounded collection retrieved all16 feeds and481 records: the added feeds supplied20,50 and10 records respectively. Some entries are stale, future-dated, irrelevant or duplicates. Retrieval counts do not equal publishable news. A government feed is not a substitute for independent corroboration. Restricted CNA/ITmedia/Al Jazeera/Nikkei candidates remain inactive.

## Archive compatibility and time

Old snapshots remain immutable. Validation accepts only nonempty strictly ordered subsets of the current reviewed daily feeds, with exact feed URLs/counts and record membership/raw-date checks. A13-feed snapshot is usable after16-feed expansion, while its three missing feeds appear in `missingFeeds`; it does not establish complete coverage of the expanded registry. Unknown/duplicate/reordered feeds and orphan records fail. Missing/read-failed/incomplete slots remain explicit. Current live collection must include the full requested feed set and succeed independently.

Archive and current live retrieval use four concurrent8-second requests, unchanged500-record/1MiB-hour/32-slot bounds. The500-record collection ceiling can still fail closed if publishers expand their feeds; it is not silently increased. No wider daily time window, backdating or automatic replay is introduced. Hourly retention cannot recover every item lost before activation.

## Editorial publication history

After verifying a manual supplement is live, an operator may create exactly one `evidence/editorial-published-YYYY-MM-DD.json` per Jakarta publication day. Required fields: `schemaVersion:1`, `status:"published"`, `editionDate`, `publishedAt`, unique `sourceUrls` (1–40 HTTPS URLs without query/fragment/credentials), and `eventHints` (up to40 bounded titles). Aggregate multiple notes before the create-only write; do not overwrite an existing marker or daily run. Unpublished drafts must never create a marker.

The daily producer validates up to14 dated markers alongside daily run history. Invalid/future/misdated markers fail; source URLs suppress repeats. Generator and reviewer receive up to40 newest event hints, prioritizing same-day editorial hints before normal run hints. The prior oldest-tail truncation is removed. Private markers expire under existing evidence retention; this is not a permanent all-history semantic duplicate index. Only #113's already-live supplement is migrated for this rollout.

## Verification and limits

Offline replay uses original retained October12–17 reports and the same earlier-publication URL history for both revisions. Non-ANTARA lexical candidates increase from5 to15 across the six runs; total candidates72 to82. Per-edition non-ANTARA counts: October12 0→1,13 0→1,14 2→7,15 1→1,16 1→4,17 1→1. These are candidates, including potentially duplicate/background events, not ten approved additional articles. Inspected examples include JETRO's Thailand registration headline, the Pasqal quantum proposal, Hanoi mobile speeds and AI applications. Broad business cooperation/technology-background pieces still require rejection when not substantive tech events.

Current16-feed collection for the October17 previous-day window adds Viet Nam News Sci-Tech evidence about Hanoi's reported digital-economy contribution and semiconductor supply chains. The incidental-technology airline ESG story is still unsuitable for the tech edition. Zero-AI cloud checks establish source/provenance/date/selection wiring, not factual approval by the model or complete next-day coverage. Exact CI/rollout/browser evidence belongs in the issue/PR and specification tasks.

Reuse existing infrastructure and model limits; see the specification's current-price cost calculation (about USD0–0.12/month marginal feed compute under bounded assumptions, within the prior RSS scenario, before shared allowances). Existing total GCP spend remains unmeasured; USD10 is the total approved monthly budget.
