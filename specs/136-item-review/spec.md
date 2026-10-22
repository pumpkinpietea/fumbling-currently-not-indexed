## Problem
A single deterministic draft error or negative batch review prevents every healthy story across four topics from publication. Recent recoveries repeatedly patched numeric spellings rather than isolating failures. Semantic history is truncated to 40 newest hints.

## Authorized scope and acceptance
1. Isolate invalid drafts and independently rejected stories, retain private reason codes, and publish only unchanged individually reviewed and deterministically valid items.
2. Bind each review decision to a server-assigned candidate ID and SHA-256 content digest; missing, duplicate, unknown or malformed decisions fail the run. Consumer reconstructs the accepted subset and rendered files.
3. Keep source/provenance, malformed envelopes, collection, transport, storage and authentication failures fatal. All rejected is a failure, never no_news; truly empty generation remains no_news.
4. Preserve four-topic limits, two calls, zero retries, input/output/time caps, empty-page suppression and historical bundle compatibility. Include up to 560 distinct hints from the existing 14-day history, without silently truncating to 40; exceedance fails safely.
5. Regression-test mixed valid/invalid drafts, individual editorial rejection, observation dependencies, tampering, all-rejected and budgets. Replay retained recent real drafts privately without inference or publication. Required CI, protected PR merge and immutable runtime rollout; verify metadata on deployed runtime. Report unattended verification separately.

## Design
Schema 7 retains schema 6 content reconstruction plus a complete candidate/decision audit. Deterministic preflight removes only event-local errors. Review assesses each survivor separately and observes all surviving candidates/history for deduplication. Observation decisions depend on accepted referenced security events. No model rewrites, retries, paid fallback or new cloud resources/IAM changes. Existing prepared histories remain explicitly conservative duplicate suppression, not evidence of successful delivery.

## Validation and costs
Local fault injection and retained evidence replay use zero model calls. Existing public-repository CI and existing GCP runtime only; no resources, schedule, resource ceilings or model call frequency increase. One private rollout rehearsal permits at most two plan inference calls, zero retries, with no production/future publication; original recovery budgets remain exhausted. Existing total GCP budget remains USD 10/month and existing total spend remains unmeasured.
