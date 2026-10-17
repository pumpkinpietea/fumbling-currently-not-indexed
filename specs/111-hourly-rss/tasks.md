# Tasks and evidence

- [x] Implement bounded hourly official-RSS snapshots and daily merging with coverage diagnostics and strict original dates/provenance.
- [x] Improve precise multilingual relevance and publisher-stage diagnostics without publisher quotas or broader editorial scope.
- [x] Add meaningful regression/integration tests and run portable checks.
- [ ] Review exact staged privacy/identities before commit.
- [ ] Deliver through exact-head PR/main validation and immutable existing-runtime rollout.
- [ ] Verify one real capture and metadata-only daily archive merge, hourly Scheduler, unchanged resources/model caps and no credential/publication mutation.

No hourly captures exist before activation; historical feed losses cannot be recovered by this change. Generation remains previous-calendar-day, once daily, and subject to independent review. Cloud/API failures and feeds rotating faster than hourly can still cause explicitly reported gaps.

Local180 tests, documentation/form checks and EN/JP/sitemap builds pass. Tests cover actual millisecond timestamps, previous-Jakarta-day/late-observation windows, rotating feeds, latest whole evidence, differing-date quarantine, invalid raw dates/feed fields/JSON/size, missing/partial/failed read slots, noncredential capture idempotency, four-request concurrency, aggregate overflow, actual metadata-only producer wiring and language/scope positives/negatives.

Offline replay of retained October15–17 official records confirms new candidate counts10/15/11 (ANTARA9/14/10 plus one Viet Nam News/Global Voices/Viet Nam News respectively). These are lexical candidate counts with no historical source-history filtering or new model review, not new approved stories or proof of outlet balance. Legitimately out-of-scope JETRO/ECNS/Mehr records are not padded into editions. Existing published articles remain unchanged. Live capture/merge/cron/immutable image evidence will be recorded in issue111 after delivery.
