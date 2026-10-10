# Design and tasks

1. Specify retrieval semantics, explicit trial policy, bounds and evaluation limits.
2. Implement pure normalized title features, deterministic pair selection and
   reason flags; never convert suggestions to event groups.
3. Implement strict labeled-pair evaluation with confusion counts, undefined
   metrics and category breakdowns. Preserve uncertainty separately.
4. Add private exclusive-output CLI modes and original synthetic benchmarks.
5. Test Unicode, input permutation, dates, thresholds, budgets, numeric/cross-language
   flags, false candidates, false negatives and CLI overwrite/redaction behavior.
6. Run a local trial using already collected RSS metadata without further network
   requests. Keep real titles, candidate pairs and reports outside Git; record
   only aggregate counts. Run portable CI and follow privacy/PR/merge checks.

A benchmark category does not change the algorithm. Case labels and rationale
are data, never instructions. Missing labels cannot silently become negatives.
Synthetic and local-labeled provenance must remain visible in reports. CLI success
means the evaluation ran, not that grouping quality meets release requirements.
The local output parent directory is trusted. A write failure may leave a partial
new report; use results only after successful file creation. Truncated shortlist
reports are diagnostic and must not be used as complete coverage.
