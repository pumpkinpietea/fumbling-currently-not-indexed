# Tasks and evidence

- [x] Record scope, personal/noncommercial use and private reader boundary before implementation.
- [x] Implement reader, scope/isolation checks and October 10 title correction.
- [x] Verify local tests/builds and live private reader.
- [ ] Merge exact-head CI, deploy immutable runtime and verify cloud metadata/reader.

Existing ECNS/Mehr selection uses the same region-and-topic conjunction as every other publisher. The current lexical shortlist is conservative candidate selection, followed by model review; it does not prove semantic accuracy. October 10 EN/JP titles use localized date text while generated October 11 titles use YYYY-MM-DD; this is the formatting discrepancy being corrected. Google RSS feed statement and https://policies.google.com/terms were reviewed on 2026-10-11; no claim is made that noncommercial public republication is permitted.

Local evidence: 130 tests, documentation validation and EN/JP builds passed. Two real Google RSS searches returned 100 records each; scope-filtered, deduplicated private reader contains 119 candidates. Private output remains outside Git. Tests prove reader data is absent from inference requests and public bundles; unsafe links, HTML injection and partial discovery failures are covered. October 10 title dates now use YYYY-MM-DD in both languages.
