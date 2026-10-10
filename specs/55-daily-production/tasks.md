# Execution evidence

- Developer approved scheduled GCP runtime and dedicated deployment authentication on 2026-10-10.
- Protected application-specific ChatGPT credentials are present and structurally valid; live model access verified; external-app credit use confirmed OFF by the user on 2026-10-10.
- Required IAM/runtime APIs enabled; project permissions allow scoped resource setup.
- PR #56 merged after required CI; main 15a2aae passed Validate. Runtime image build 38054962447 succeeded. Cloud Run daily-news is deployed by immutable digest, one task/CPU, 512 MiB, 600 seconds, zero retries. Scheduler daily-news-jakarta is configured for 07:30 Asia/Jakarta and PAUSED. NEWS_PUBLISH_ENABLED=false and config enabled=false.

- Live ChatGPT app OAuth refresh/model discovery succeeded; the user confirmed external-app credit use OFF and authorized bounded private generation.
- Hosting WIF live delivery succeeded from main d138fc4 in run 38053800084.
- Private storage, scoped reader/builder/runtime/scheduler identities and two-image registry cleanup are provisioned. No broad personal GitHub token is transferred.
- Local checks: 109 tests, documentation validation and EN/JP builds pass. Initial generation uses official RSS excerpts, not article bodies.
- User explicitly authorized the combined Actions create/approve-PR setting after its scope was explained. It is enabled; default workflow permissions remain read-only. The consumer never submits approving reviews.
- PR #57 merged. Main 827c472 passed Validate; build 38055314635 and Hosting delivery 38055339410 succeeded. The immutable job image is us-central1-docker.pkg.dev/blog-pumpkinpie/news-runtime/daily@sha256:38e5822e98cec0775604e4908fbb2e71fddd73971a987d2509c322bd3166b499.
- Metadata-only cloud execution daily-news-4b66w succeeded: three feeds/70 records, zero model calls, private run status saved and global lock released. This verifies cloud connectivity/state, not AI generation or automatic article merging.
- Remaining: run and inspect private generation, verify content-only PR/CI/merge, merge activation config/clock-test changes, rebuild/deploy immutable image and update runtime revision, then enable consumer/resume Scheduler. First scheduled live publication is still unverified.
- Historical-date trial was rejected by automatic approval review because old matching records could still invoke AI; explicit metadata-only mode safely stops before app credential access/inference.

- Private rehearsals retain validated generated content under evidence/trial-bundle-DATE.json for operator inspection, outside the publication bundle prefix. Local 109 tests and EN/JP builds pass.
- Dedicated WIF purpose mappings replace the shared repository-only impersonation grants; provider repository/ref/workflow conditions remain enforced.

- PR #59 main 9cf3793 passed Validate 38056669529, build 38056672408 and Hosting delivery 38056691945. Cloud Run and NEWS_RUNTIME_REVISION were updated to that revision. Private generation execution daily-news-gjbj6 failed before inference because the model catalog exceeded the original 256 KiB cap. Its global lock was released. Operator diagnosis verified refresh/model access, successful inference and persisted token rotation; strict stream parsing needed compatibility fixes for absent Content-Type and empty terminal output bodies.
- Manual draft-only bot delivery rehearsal is implemented; 113 tests and EN/JP builds pass locally. Production flags remain false until generation and live delivery verification.

- The saved live SSE response now parses successfully without a new inference call; its result is events=[] because the supplied forum events were already reported. This verifies transport completion, not a two-call reviewed publication bundle.

- PR #60 merged at ec0ed55 after exact-head Validate 38057942624; main Validate 38057987330, build 38057988940 and Hosting delivery 38058014698 passed. Cloud Run was updated. Execution daily-news-rkbkw succeeded with no_news, persisted rotated credentials and released its global lock.
- Two-call historical editorial rehearsal (2026-09-27 edition, actual ANTARA RSS dated 2026-09-26) passed bilingual generation, skeptical review, deterministic validation and operator source/content inspection. Private evidence remains outside Git.
- Delivery rehearsal 38058408930 created draft-only PR #61. Branch dispatch Validate 38058431838 passed, but PR-associated Validate 38058433210 requires approval, so protected merge correctly stopped. Fix uses scoped CI execution approval and PR-associated success; no protection bypass or PR review approval. Production remains inactive pending repeated rehearsal.
