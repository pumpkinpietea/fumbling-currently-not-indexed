# Bounded daily automation

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/55

## Schedule and publication

The Cloud Run Job starts at 07:30 Asia/Jakarta, using the previous Jakarta calendar day. The main-only Publish Daily News workflow consumes a private prepared bundle at 07:45 Jakarta; GitHub cron may be delayed. Actual publication follows generation, protected PR merge, successful main Validate and Deploy Hosting. This is not an exact 07:30 publication guarantee.

Initial source scope is ANTARA official top-news, technology and ASEAN RSS feeds. At most three candidate articles are prepared, from at most five permitted events overall, with one bilingual generation and one skeptical review call. RSS dates, title, excerpt and SHA-256 remain in private evidence. Exact quotes and matching numeric strings are checked; a second model checks factual meaning, relevance, grouping and translations. These gates reduce errors but are not an independent human accuracy guarantee. Insufficient/no news or any failed source/model/review produces no publication bundle. Existing manual edition source URLs must be seeded in private prior-run state before activation.

ANTARA's [RSS explanation](https://www.antaranews.com/rss) explicitly describes syndication and supplementing other websites. Its [terms](https://www.antaranews.com/ketentuan-penggunaan) restrict broader content reuse. The initial adapter uses only official feed titles and excerpts for personal noncommercial original notes, with source links. It never retrieves article bodies or images, reproduces paragraphs, bypasses access controls or activates candidate-only publishers. Candidate Chinese, Middle Eastern and Japanese media remain in the registry for later access review.

## Credentials and isolation

The single protected app session is persisted in a private, uniform-access GCS bucket with public access prevention, no versioning and no public GitHub artifacts. Each token rotation is saved using the previous object generation before inference. A global exclusive runtime lock serializes refresh ownership, and a daily lock prevents automatic reruns. A failed persistence after upstream rotation may require reauthorization; do not retry blindly. A forced container termination can leave a lock. Confirm that no Cloud Run execution is active before manually removing only that stale lock. Evidence, bundles and run/lock markers expire after 14 days; auth/session.json has no age deletion rule.

The runtime has no GitHub token and no Hosting access. The main consumer's WIF identity reads only bundles, not auth or raw evidence objects. The main Hosting WIF identity has only Hosting administration and service-usage consumer roles. Separate image-builder WIF can write only the dedicated Artifact Registry repository. Scheduler can invoke only the news job. No service account keys are generated.

GITHUB_TOKEN creates a new two-file content PR and explicitly dispatches branch Validate. The complete staged diff/blobs, exact paths, content reconstruction, pseudonymous identities and privacy checks precede the automated commit. It never modifies an existing edition. The consumer checks exact head CI, base and changed files, then asks GitHub to squash merge under existing protection. It never grants an approving review or bypasses failed checks. It explicitly dispatches main Validate after a token-originated merge, since that merge does not trigger push workflows. Deploy Hosting accepts push or workflow_dispatch validation only for same-repository current main. Operator PRs still use the regular flow.

## Activation and recovery

NEWS_PUBLISH_ENABLED and config/news-publishing.json enabled must both be true for live article consumption. Keep the Scheduler paused until source/model private trial, account credit preference, content-only tests and runtime persistence are verified. HOSTING_DEPLOY_ENABLED separately controls delivery. Build News Runtime is manual, main-only, and does not deploy a job. Deploy the recorded immutable image digest after its build succeeds; no image tag is treated as immutable.

The --metadata-trial mode explicitly returns after RSS/evidence preparation, before reading ChatGPT credentials or calling inference, even if relevant records exist. It is safe for connectivity testing before account credit preferences are confirmed.

An operator may run the immutable job with --trial-date YYYY-MM-DD for a nonfuture replay, or --trial-next-day for a private advance-clock rehearsal using currently available feed records. Trials use separate markers and never write publication bundles. The latter simulates the next edition window before its end; it is not evidence of a scheduled run or of complete future coverage.

Stop new daily work by pausing Scheduler and setting NEWS_PUBLISH_ENABLED=false. Also cancel active job/workflow executions separately. Existing releases are not undone. Never re-run a failed date automatically or overwrite an existing bundle/edition; inspect the private run markers and source evidence first. A PR failing CI remains unmerged. A merge followed by failed delivery requires rerunning current main Validate, not repeating article generation.

## Costs and status

One task, 1 vCPU, 512 MiB, 600-second maximum and no retries bounds 30 scheduled jobs to 18,000 vCPU-seconds and 9,000 GiB-seconds/month: about USD 0.342 before free allowances in us-central1 at checked prices. Scheduler is USD 0.10/month before its shared allowance. A small retained image, less than 50 MiB private state and bounded logs/network are expected to keep incremental operation approximately USD 0–2/month. Standard hosted Actions is free for this public repository. No paid model fallback exists; account-side credits must be disabled. Registry cleanup retains the two newest image versions and deletes older eligible versions after a day.

Existing total GCP spending is not available from the resource inventory or Billing API. An existing billing-account budget is present; it is not a hard cap and was preserved. The developer's USD 10 limit covers all usage; incremental estimates are not proof of total cost. See [daily start](daily-start.md) and pricing links there. Live activation and verification evidence belongs in specs/55-daily-production/tasks.md and issue #55.
