# Daily production activation

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/55

## Goal and authority
Start unattended Southeast Asia IT/e-commerce editions at 07:30 Asia/Jakarta from 2026-10-11. On 2026-10-10 the developer approved GCP scheduled execution and dedicated GitHub-to-Firebase authentication within USD 10/month total GCP usage. No separate paid model/API fallback. Scoped PR merging after required CI is authorized.

## Acceptance criteria
1. Dedicated main-only GitHub WIF publisher deploys the validated main revision, with no long-lived Google key.
2. A bounded single-task, zero-retry Cloud Run job and Jakarta Scheduler execute a versioned pipeline independently of the container; persistent private rotating credentials survive executions.
3. Collect only reviewed feeds; select previous Jakarta-day Southeast Asia IT/e-commerce records; retrieve bounded source evidence, preserve provenance, conservative event deduplication, and generate short consistent EN/JP notes with attribution and no routine coverage commentary.
4. Invalid, partial, duplicate, stale, no-news or failed-model runs do not publish partial editions. Model calls <=2, events <=5, task <=600s. No paid fallback.
5. Article changes pass PR CI before narrowly scoped automatic merge; production deploys only validated main. Runtime cannot modify code or unrelated content through the merge gate.
6. Private live trial, idempotence/failure tests, main delivery verification, actual scheduler configuration, cost assumptions and remaining limitations are recorded. Never claim tomorrow is active until scheduling and credentials are verified.

## Design and tasks
Use separate Hosting publisher, Cloud Run runtime and Scheduler caller identities. Configure repository-bound WIF for existing deploy.yml, verify IAM then activate. Implement a bounded pipeline with private GCS state and credential persistence, immutable image, explicit activation and daily lock. Use an explicit reviewed source allowlist. Prepare content-only PR and a separate constrained main-side approval workflow that validates changed paths, generated metadata and exact head CI before merge. Inspect available repository-scoped GitHub authentication before selecting runtime authentication; do not copy broad personal credentials into the cloud. Keep source evidence out of Git/logs. Review source adapter permissions and current pricing, measure available existing costs, configure budget notifications if available. Validate and deploy through feature PRs.
