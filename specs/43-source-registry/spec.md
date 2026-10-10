# Broad source discovery registry

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/43
Status: Implementation

## Goal and context

Collect a broad candidate inventory for Southeast Asia IT/e-commerce and compare coverage. Site positioning remains flexible: the developer requests source breadth, not a permanent personal-use classification. Existing two-feed metadata trials are too narrow.

## Requirements and acceptance criteria

- AC-1: A repository-owned registry preserves requested Japanese, Chinese, Middle Eastern, Western, regional and institutional candidates, with role, discovery URL, review status and explicit feed/host configuration where available.
- AC-2: Existing version-1 requests remain compatible. Only registered private-trial feeds can be selected, with at most eight unique feeds per run, sequential bounded requests and at most 500 retained records.
- AC-3: Enforce each feed's own link hosts before combined URL deduplication, preserving original indices and feed provenance. No arbitrary network URLs from request/model data.
- AC-4: Incomplete retrieval and record-cap failures remain distinct from a healthy empty result. Preserve original publication dates, including stale institutional entries. Reports stay private and outside Git.
- AC-5: Regression tests cover mixed feeds, cross-feed host injection, unapproved IDs, resource caps and existing behavior. A bounded private official-feed trial records aggregate results separately.

## Boundaries

Registry status private_metadata_trial allows explicitly requested manual discovery only, not body retrieval, model input, public reuse or scheduled activation. Candidate-only entries remain selectable for future investigation, not fetchable. No paid service, model call, IAM or public article change.
