# Delivery design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/18

Use workflow_run after Validate, restricted to completed push runs on main in the same repository. Checkout the event SHA, never an artifact supplied by a PR. Recheck current main before authenticating and immediately before deploying. Serialize delivery without cancellation. There remains a small race between the last main check and release finalization; a subsequent successful main run converges to the latest validated revision.

Keep authentication late, after dependency installation and local validation. Use google-github-actions/auth pinned to its v3 commit and Firebase CLI Application Default Credentials. The service account needs roles/firebasehosting.admin and roles/serviceusage.serviceUsageConsumer; the WIF principal gets roles/iam.workloadIdentityUser only on that account. No Editor or Owner role.

| Criterion | Verification |
| --- | --- |
| AC-1, AC-4 | Offline workflow-policy regression tests for event, branch, repository, SHA and disable guards |
| AC-2 | Existing portable tests and EN/JP build; workflow checks out exact SHA |
| AC-3 | Offline permission/auth configuration checks; live IAM trust verification before activation |
| AC-5 | CLI success ordering, summary review; live release and HTTP checks after activation |
| AC-6 | PR and main CI evidence; separate live rollout evidence |

Standard public GitHub-hosted runners have no execution charge. Assume 30 deliveries/month at at most 15 minutes each, no uploaded artifacts or model calls. Existing Hosting storage/traffic charges depend on retained releases and visitors; see the operations guide. No automatic deletion of release history is introduced.
