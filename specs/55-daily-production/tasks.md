# Execution evidence

- Developer approved scheduled GCP runtime and dedicated deployment authentication on 2026-10-10.
- Protected application-specific ChatGPT credentials are present and structurally valid; live model access verified; credit preference verification pending.
- Required IAM/runtime APIs enabled; project permissions allow scoped resource setup.
- PR #56 merged after required CI; main 15a2aae passed Validate. Runtime image build 38054962447 succeeded. Cloud Run daily-news is deployed by immutable digest, one task/CPU, 512 MiB, 600 seconds, zero retries. Scheduler daily-news-jakarta is configured for 07:30 Asia/Jakarta and PAUSED. NEWS_PUBLISH_ENABLED=false and config enabled=false.

- Live ChatGPT app OAuth refresh/model discovery succeeded; generation waits for extra-credit preference confirmation.
- Hosting WIF live delivery succeeded from main d138fc4 in run 38053800084.
- Private storage, scoped reader/builder/runtime/scheduler identities and two-image registry cleanup are provisioned. No broad personal GitHub token is transferred.
- Local checks: 108 tests, documentation validation and EN/JP builds pass. Initial generation uses official RSS excerpts, not article bodies.
- GitHub combined Actions create/approve-PR setting was rejected by automatic approval review; specific user permission is pending. Do not enable it or infer consent.
- Next: deploy and run the explicit metadata-only trial, perform private generation once credit preferences are confirmed, verify content-only PR/merge under the pending specific GitHub permission, then activate config/Scheduler/consumer. A historical-date trial was rejected by automatic approval review because old matching records could still invoke AI; metadata-only mode stops before credential access/inference.
