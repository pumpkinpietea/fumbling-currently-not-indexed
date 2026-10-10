# Main-only Hosting delivery

The Deploy Hosting workflow follows a successful Validate push run on main. It checks out that exact revision, repeats checks, builds and deploys to the existing blog-pumpkinpie Hosting site. PR validation has no production credentials. News scheduling and automated article approval are separate features.

## Configuration and trust

Deployment is off unless repository variable HOSTING_DEPLOY_ENABLED is exactly true. HOSTING_WIF_PROVIDER contains the full provider resource name; HOSTING_SERVICE_ACCOUNT contains the dedicated account email. These are configuration identifiers, not secret keys. Never use the existing Firebase Admin SDK account for CI.

Create a dedicated WIF pool/provider and service account after reviewing IAM changes. The provider maps google.subject=assertion.sub and attribute.repository_id=assertion.repository_id. Its condition must require repository_id 875669186, repository_owner_id 16938794, ref refs/heads/main, event_name workflow_run and workflow_ref pumpkinpietea/fumbling-currently-not-indexed/.github/workflows/deploy.yml@refs/heads/main. GitHub's issuer is https://token.actions.githubusercontent.com. Immutable IDs prevent renamed/deleted repository takeover; workflow/ref restrictions exclude PR tokens.

Grant the repository principal set roles/iam.workloadIdentityUser only on the dedicated service account. Grant that account roles/firebasehosting.admin and roles/serviceusage.serviceUsageConsumer on blog-pumpkinpie. Do not grant Owner, Editor, service account key creation or project IAM administration. Enable required IAM credentials and STS APIs only after reviewing the setup; no Cloud Run, Scheduler or model service is required.

Review the actual provider condition, service account policy, project role bindings and GitHub variables before setting the enable variable. Verify the first release and both language URLs. Record run URL, revision and Hosting release evidence in issue #18.

## Operation and recovery

Set HOSTING_DEPLOY_ENABLED=false to stop newly evaluated deployment jobs. Cancel any already queued or running Deploy Hosting runs separately; changing a variable does not revoke their evaluated configuration. Cancellation cannot undo a release already finalizing. Runs are serialized without cancelling in-flight releases. Obsolete validated SHAs are skipped. A narrow race remains if main advances after the final check; the subsequent successful main run converges to the newest validated revision.

For a transient failure, rerun the successful main Validate run; its completed event schedules delivery again. The deploy job still checks current main. Do not replay a PR run or deploy an obsolete revision. There is no automatic deployment retry loop. Use the Firebase console's Hosting release rollback for urgent recovery, then fix/revert through a validated PR. A failed build/authentication never starts a deployment; inspect Hosting release history for ambiguous deploy-command failures before retrying.

Hugo excludes drafts and future-dated articles. This workflow alone does not publish articles when their dates arrive: that requires scheduled validated builds or generated article PRs, specified under #20.

## Cost and verification

Checked 2026-10-10: the repository is public and standard hosted Actions execution is free. Assume 30 runs/month, at most 15 minutes each; no artifacts, larger runners or model calls. Existing Firebase billing is enabled. Hosting includes 10 GB storage and 360 MB/day transfer; Blaze overages are usage-based. Retained release versions consume storage. Visitor traffic and existing retained size are unmeasured, so no total monthly Hosting estimate is claimed. This workflow does not add compute resources or change the billing plan.

References: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing), [WIF deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Firebase pricing](https://firebase.google.com/pricing).

Run npm run check:ci for offline policy and existing build checks. Offline checks do not establish live IAM correctness, successful publication or availability; record live evidence separately.
