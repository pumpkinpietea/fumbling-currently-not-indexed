# Execution evidence

- Developer approved scheduled GCP runtime and dedicated deployment authentication on 2026-10-10.
- Protected application-specific ChatGPT credentials are present and structurally valid; live model access verified; credit preference verification pending.
- Required IAM/runtime APIs enabled; project permissions allow scoped resource setup.
- PR #56 merged after required CI; main 15a2aae passed Validate. Runtime image build 38054962447 succeeded. Cloud Run daily-news is deployed by immutable digest, one task/CPU, 512 MiB, 600 seconds, zero retries. Scheduler daily-news-jakarta is configured for 07:30 Asia/Jakarta and PAUSED. NEWS_PUBLISH_ENABLED=false and config enabled=false.

- Live ChatGPT app OAuth refresh/model discovery succeeded; generation waits for extra-credit preference confirmation.
- Hosting WIF live delivery succeeded from main d138fc4 in run 38053800084.
- Private storage, scoped reader/builder/runtime/scheduler identities and two-image registry cleanup are provisioned. No broad personal GitHub token is transferred.
- Local checks: 109 tests, documentation validation and EN/JP builds pass. Initial generation uses official RSS excerpts, not article bodies.
- GitHub combined Actions create/approve-PR setting was rejected by automatic approval review; specific user permission is pending. Do not enable it or infer consent.
- PR #57 merged. Main 827c472 passed Validate; build 38055314635 and Hosting delivery 38055339410 succeeded. The immutable job image is us-central1-docker.pkg.dev/blog-pumpkinpie/news-runtime/daily@sha256:38e5822e98cec0775604e4908fbb2e71fddd73971a987d2509c322bd3166b499.
- Metadata-only cloud execution daily-news-4b66w succeeded: three feeds/70 records, zero model calls, private run status saved and global lock released. This verifies cloud connectivity/state, not AI generation or automatic article merging.
- Remaining: receive specific GitHub setting permission and account credit confirmation; run and inspect private generation, verify content-only PR/CI/merge, merge activation config/clock-test changes, rebuild/deploy immutable image and update runtime revision, then enable consumer/resume Scheduler. First scheduled live publication is still unverified.
- Historical-date trial was rejected by automatic approval review because old matching records could still invoke AI; explicit metadata-only mode safely stops before app credential access/inference.
