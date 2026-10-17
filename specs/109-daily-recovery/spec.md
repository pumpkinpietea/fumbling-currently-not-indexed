## Goal and authority
Recover missing October 15–17 EN/JP editions from their original retained RSS evidence, independently review each candidate, and publish through protected PR/main delivery. Owner explicitly authorized revalidation and publication on October 17.

## Confirmed failures
October 15 model catalog returned HTTP520. October16–17 generation succeeded but strict numeric-token checks rejected equivalent word/month/Japanese-scale/implicit-denominator/time representations. Scheduler continues to run.

## Requirements and acceptance criteria
1. Preserve original failed locks/status/evidence. Use saved original excerpts/date windows; no current-feed backfill or fabricated historical coverage.
2. Keep deterministic numeric/evidence checks and reject genuinely different values. Add bounded lexical normalization for explicit English/Indonesian number words, month names, million/billion and Japanese magnitude notation, on-hour times, and per-gram denominators. Normalize only schema4 event comparison; historical schemas1–3 remain unchanged. Clarify generator output contract: ASCII numeric quantities in both languages, numeric dates/times, comma-grouped values without Japanese magnitude abbreviations, explicit matching numeric denominators. Independent reviewer still checks units, factual meaning, membership, duplicate events and translation.
3. Recover October15 with one generation and one review; reuse retained October16/17 candidates with transparent numeric spelling corrections and one independent review each. Maximum four operator inference calls total, zero retries, authoritative rotating GCS credentials/global lease, existing per-call bounds, no paid fallback.
4. Validate exact source hashes, dates, grounding quotes, events and reconstructed populated EN/JP files. Inspect every candidate against saved evidence; reject unsupported items rather than weakening gates. Keep up to20/topic,40 overall and no empty-topic posts.
5. Regression tests, portable checks, browser screenshots for actual recovered articles, full staged privacy/identity review, exact-head CI, protected merge, main validation/Hosting and live checks. Record create-only published history after live verification.
6. Deploy clarified generation contract through the existing immutable runtime and verify metadata-only behavior. Preserve existing resource/cost caps, IAM and Scheduler.

## Design and tasks
Add explicit, regression-tested lexical numeric equivalences plus precise generation format instructions without changing historical schema behavior. Unit meaning, date meaning and semantic factual support remain independent-review requirements. Use an operator-only private recovery script based on the existing #103 recovery procedure. Record finite calls, corrected fields, source review and delivery evidence. Existing failed status remains an audit record; create-only runs history records operator recovery only after delivery.
