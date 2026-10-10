# Daily production start

The confirmed target is 2026-10-11 at 07:30 Asia/Jakarta, corresponding to 00:30 UTC and 09:30 Asia/Tokyo. The 2026-10-10 EN/JP article is a separately source-reviewed manual bootstrap, merged in PR #48 and published from validated main 9fd6df5 at 2026-10-10T12:29:50.387Z. Both live article HTML responses matched the built hashes. This manual release used existing Google authentication through the official Hosting REST API with an explicit quota project; no IAM change was needed. It does not establish unattended operation.

## Clock and activation

config/news-publishing.json records the first edition, timezone, publication time, languages and finite run limits. enabled is false until authentication, the private live generation trial, source/evidence validation, content-only merge and main delivery are verified. The clock command computes metadata only; it installs no scheduler.

```bash
node scripts/edition-clock.cjs
node scripts/edition-clock.cjs --date 2026-10-10
```

Normal execution before the first start or before local 07:30 returns before_publication_start. Explicit operator replay can choose a real nonfuture date and is marked replay: true. A valid result with enabled: false is an offline plan, never activation authority.

For the first daily edition on October 11, the previous Jakarta day maps to [2026-10-09T17:00:00Z, 2026-10-10T17:00:00Z). Capture the run instant once. Do not use the machine's UTC date as the edition date. A delayed run after the next Jakarta midnight requires an explicit replay decision; it must not silently replace a different day's publication. Schedule time is the requested run start; actual article publication follows generation, PR CI and validated main delivery. GitHub-hosted cron can be delayed and cannot promise a precise publication instant.

## Runtime decision and expected costs

Two options remain: keep the existing local runtime available at the scheduled time, or use a bounded GCP job with protected persistent credential storage. The developer's USD 10 ceiling covers all GCP usage, including existing resources. Separate AI subscriptions are not authorized. The GCP option was presented for selection; no job, scheduler, secret, image registry or OIDC resource has been provisioned.

A candidate GCP configuration uses one Cloud Run Job in us-central1, one task, 1 vCPU/512 MiB, no retries, at most 600 seconds/day; one Scheduler job; two retained active secret versions; one small retained container image; and small private run manifests. For 30 runs, worst configured compute is 18,000 vCPU-seconds and 9,000 GiB-seconds/month. At published default rates before free allowances, this is approximately USD 0.324 CPU plus USD 0.018 RAM. A Scheduler job is USD 0.10/month after its shared free allowance. Two active secret versions are USD 0.12/month before allowance, with fewer than 1,000 accesses. Budget for image storage, private manifests, network and logs conservatively within an additional USD 1/month for this small workload. Expected incremental operation is approximately USD 0–2/month under these assumptions; build frequency, regional prices, traffic and shared free-tier usage can change it.

Free allowances are billing-account shared: Cloud Run's published free tier is based on us-central1 pricing; Scheduler includes three jobs; Secret Manager includes six active versions and 10,000 accesses. Disabled secret versions still count as active for pricing. Retention must actually bound version count; do not accumulate a version per daily refresh indefinitely. Secrets and mutable refresh tokens cannot be baked into the image or put in public Actions artifacts.

This is an incremental estimate, not evidence that total GCP costs are below USD 10. Existing Hosting traffic, storage, logging and other project/billing-account usage still need measurement. Budget alerts are not hard spending caps. Stop rather than invoke a paid model fallback; account-side credit preferences must also disallow credit use.

Pricing checked 2026-10-10:

- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloud Scheduler pricing](https://cloud.google.com/scheduler/pricing)
- [Secret Manager pricing](https://cloud.google.com/secret-manager/pricing)
- [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing)
- [Firebase Hosting usage](https://firebase.google.com/docs/hosting/usage-quotas-pricing)

## Required rollout evidence

Complete app-specific browser OAuth and verify credit preferences; choose an account-visible model; run a bounded private source/evidence generation trial and independently review facts; verify repeated/no-news/partial-failure behavior; restrict article writes and merges to the approved edition paths; configure the selected persistent runtime; and verify its first scheduled run and actual live URLs. A successful clock test or initial manual release cannot substitute for these checks.
