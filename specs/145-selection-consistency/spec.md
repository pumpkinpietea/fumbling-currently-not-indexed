# Selection consistency

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/145

## Requirements and acceptance

1. New schema 8 daily validation recognizes ordinal strategy/policy/plan milestones, including English `1st national semiconductor strategy` and Japanese `初の国家半導体戦略`. Actual ordinal/quantity conflicts and unsupported values remain rejected. Schemas 1–7 retain their numeric interpretation.
2. Every schema 8 item decision has an explicit nullable `duplicateOf`. A non-null value must match one exact prior event hint and must accompany rejection of a story, never approval or an observation. History is private contextual evidence, not publication proof.
3. Persist distinct evidence fingerprints only for these explicit historical duplicate rejections, at most 40 per prepared run. Use URL, original publication timestamp and exact excerpt hash; changed evidence is eligible again. Read at most 14 preceding edition dates and validate identities before use. Non-duplicate rejection never blacklists its source.
4. Suppress matching evidence before model allocation and independently quarantine matching generated stories if a model fabricates a reference to a suppressed candidate. Consumer reconstruction binds the review, previous event hints, duplicate history and output files; tampering fails.
5. Keep existing limits, two calls, zero retries, all-rejected failure and no-empty-topic behavior. Retain historical bundle compatibility. Do not revise already-public editions, failed markers, source policy, IAM or repository protections.

## Verification

Regression tests cover the JETRO example, ordinal contradictions, unsupported extra counts, legacy behavior, forged/missing duplicate decisions, same-evidence suppression, changed-evidence eligibility, non-duplicate rejection and schema 8 consumer tampering. Replay available retained schema 7 bundles offline. Run portable validation and required exact-head/main CI. Roll out the immutable main image to the existing Cloud Run job and verify a zero-model metadata execution. Next scheduled generation remains a separate observation; no extra inference is authorized.
