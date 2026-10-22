# Design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/136

Add a shared item-selection module. Stable server IDs identify daily, specialist and observation candidates by kind and ordinal; SHA-256 binds the exact JSON draft to each decision. Validate all source envelopes before isolation. Run existing validators on individual candidates and incrementally on accepted aggregates to enforce shared source/event/page limits. Quarantine only explicitly enumerated local draft failures. Unknown failures remain fatal.

The second and final model call returns exactly one approved/rejected decision per preflight survivor, including its ID, digest and a short reason. Validate exact coverage and strict types. Build the accepted subset in stable order; dependent cyber observations survive only when every referenced security item is accepted. Schema 7 carries the original drafts, preflight results and complete review decisions. Consumer repeats selection, verifies exact equality of accepted content and uses schema 6 rendering/provenance validation. Historical schemas remain unchanged.

Use the full unique existing 14-day event-hint context, at most 560 hints, retaining existing transport input caps. Preserve prepared histories as conservative deduplication hints; do not label them actual delivery evidence. Do not change publication authority, scheduler, credentials, model or billing.
