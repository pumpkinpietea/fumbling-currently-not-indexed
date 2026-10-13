# Japanese evidence and optional alert intake

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/100

## Requirements
Add Yahoo world/business official RSS and Japanese JETRO announcement headlines to independently validated daily evidence. Preserve Yahoo provider credits and canonical article URLs. Google discovery can suggest priority only when corroborated by eligible official RSS records. Original feed dates and text remain the sole evidence, with unchanged history/relevance/semantic/review gates. Do not republish Google snippets or fetch article bodies.

Optional owner-supplied Google Alerts feeds and exported UTF-8 email provide private original-link candidates. Store subscriptions only in protected private configuration, never Git/logs/public bundles. No owner feed has been supplied; do not claim live Alerts activation. Unmatched/unreviewed origins remain private. Missing optional configuration or failed optional feeds does not invalidate complete official collection; invalid configuration fails closed for intake.

## Acceptance criteria
1. Thirteen bounded official feeds are eligible; Yahoo tracking removal is narrowly defined, provider credit is mandatory and validated against the source title. JETRO supplies headline-only evidence.
2. Exact direct-link matches and unique normalized title hints prioritize already eligible official records; ambiguous hints and unresolved URLs never become evidence or verified identity claims.
3. Up to three HTTPS Google Alerts subscriptions (5 seconds/1 MiB/no retries/redirects each) and 50 private exported-email links are accepted. Unsafe/private/auth URLs and malformed/oversized XML are rejected. Feed timestamps remain discovery timestamps.
4. Four selected sources, two model calls, five events, 600 seconds, zero retries, private retention and no-empty-publication behavior remain bounded. Legacy bundle rendering is unchanged.
5. Tests/builds, real-browser attribution review, protected exact-head CI/merge/main delivery and immutable runtime metadata verification pass. Durable documentation distinguishes implemented code from pending owner activation.

## Cost and authority
The owner authorizes this integration and scoped protected publication, within total GCP USD10/month. Reuse existing resources/IAM. Worst-case added network waiting is 60s/day: 45s for three official feeds, 15s for optional Alerts. At 1vCPU/0.5GiB and 31 runs, incremental compute is approximately USD0.036 before shared free allowances at current us-central1 Jobs rates. Storage/operations/network/build/logging and existing usage are separate; no total-spend guarantee. No paid inference or new subscriptions. Pricing checked 2026-10-13: https://cloud.google.com/run/pricing .
