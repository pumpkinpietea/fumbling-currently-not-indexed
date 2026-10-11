# Tasks

- [x] Record requirements and design before repository implementation.
- [x] Discover and test official Japanese feed candidates.
- [x] Save inventory and personal-reader OPML; record #74 rollout and branch setting.
- [ ] Validate, review privacy, pass exact-head CI and merge.

Bounded live trial: 22 URLs, 20 successful XML feeds, 569 metadata items and four title-only regional/topic matches before deduplication. OPML round-trip validation verifies 20 unique HTTPS subscription URLs. No daily model/input changes. Branch cleanup removed 32 remote tips matching merged PR heads; main and ambiguous/unmerged branches remain. #74 cloud Google reader is verified, but the subsequent metadata stage failed and needs diagnosis.
