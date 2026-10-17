# Eligible news and source coverage

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/115

## Requirements

Increase supported distinct news in Indonesia general and Southeast Asia IT/e-commerce/digital economy, including non-ANTARA sources. Preserve factual grounding, translation agreement, original dates, semantic event review, no-empty pages and existing publication history. A larger candidate pool is not a guaranteed daily quota.

## Acceptance criteria

1. Actual retained JETRO short Japanese headline and Viet Nam News Pasqal quantum proposal reach selection. Unsupported/short/markup-only evidence cannot consume a source slot or fail the whole run later. Private diagnostics separate evidence, relevance and history exclusions.
2. Add three fixed official RSS endpoints: Viet Nam News Sci-Tech, Yahoo IT with credited original providers, and Cabinet Secretariat of Indonesia announcement titles. Verify live access/format/dates and keep institutional versus news-distribution/reporting labels explicit.
3. New schema5 accepts Japanese-script title evidence of at least20 cleaned characters only from explicitly Japanese-language institutional feeds. Other titles/excerpts retain40. Historical schemas1–4 keep40. Exact20-character quotes, evidence hashes/provenance, dates, independent review and exact rendering remain mandatory.
4. Archive snapshots from the prior13-feed registry survive16-feed expansion as strictly ordered nonempty known-feed subsets, with missing feed coverage reported. Unknown/duplicate/reordered feeds, orphaned records and malformed metadata still fail. Original date conflicts quarantine URLs; current live collection remains complete.
5. Read at most14 daily editorial publication markers alongside normal history. Validated, already-live supplements suppress URL/event repeats without overwriting original daily runs.
6. Keep40 source/event,20 per topic,2 model call,600-second/1CPU/512Mi,zero retry,500-record/1MiB hourly,32 archive-slot and14-day retention limits. Four parallel8-second live feed requests bound collection time. No new service/IAM/paid inference or publisher quota.
7. Test and replay retained October12–17 reports, compare per-publisher candidate counts, inspect actual new-feed candidates and run portable CI. Deliver exact-head PR/main CI, immutable runtime and zero-AI cloud metadata verification; preserve all original daily markers and public pages.

## Source adoption decision

- Viet Nam News Sci-Tech: official same-host RSS, same bounded personal/nonprofit factual excerpt use as existing economy feeds. Actual article paths use `Sci-Tech`, so admit that exact reviewed case as well as historical lowercase. No arbitrary case-insensitive host/path broadening.
- Yahoo IT: official category RSS under the existing Yahoo policy; require original provider, strip only exact `?source=rss`, no bodies/images or inference from private discovery.
- Cabinet Secretariat of Indonesia: official same-origin English RSS verified against the official homepage. Headline-only institutional factual notes; credit the government source and do not present official assertions as independently established results. Copyright retained; no blanket republication/adaptation license claimed. No descriptions, article bodies, images, verbatim paragraphs or inferred details enter model/public evidence. Homepage/feed access does not establish general reuse rights. If access restrictions arise, fail rather than bypass them.
- Previously restricted ITmedia/CNA/Al Jazeera/Nikkei sources remain inactive. More feed URLs are not proof of independent ownership or different perspectives.

## Cost decision

Reuse existing Scheduler/job/bucket with no increased instance or model limits. Three additional feed requests/hour: maximum extra8 seconds of one4-request batch, if charged in full, adds5,952vCPU-seconds and2,976GiB-seconds per31-day month. At current us-central1 job rates USD0.000018/vCPU-second and0.000002/GiB-second, about USD0.12/month before shared free allowances. If the existing one-minute minimum absorbs it, marginal compute can be zero. Same1MiB hourly cap/14-day retention bounds retained hourly storage to336MiB; no new objects/hour. Allow existing USD0–2/month incremental RSS scenario; total existing spend remains unmeasured and USD10 covers all GCP. Daily2-call quota and192KiB/256KiB transport bounds stay fixed; no extra inference trial is needed for rollout.

Prices checked2026-10-17: https://cloud.google.com/run/pricing and https://cloud.google.com/storage/pricing. Shared allowances, startup, network, logs and build usage make this an estimate rather than a cap.
