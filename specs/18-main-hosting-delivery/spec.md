# Validated main-only Hosting delivery

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/18
Status: Implementation; live authentication and rollout pending

## Goal and scope

Publish the existing EN/JP Hugo site from validated main revisions. Keep PR validation credential-free. News generation, scheduled article creation, article auto-merge and repository protection changes are separate outcomes.

## Acceptance criteria

- AC-1: Only a successful Validate push run for main in this repository can trigger delivery. PR runs, failed runs, other branches and obsolete revisions cannot deploy.
- AC-2: Delivery checks out the triggering SHA, installs pinned dependencies and Hugo, repeats portable checks, and builds without future or draft articles.
- AC-3: Authentication uses GitHub OIDC and a dedicated narrowly scoped service account, with immutable repository/owner IDs and main workflow restrictions. No service account key is stored.
- AC-4: A repository variable independently disables deployment. Missing configuration fails before authentication. A serialized non-cancelling job prevents concurrent releases and checks main again before deployment.
- AC-5: The run records the deployed revision only after CLI success. Failures do not intentionally delete or replace the prior release; manual rollback and bounded replay are documented.
- AC-6: Offline policy tests and CI pass before activation; live delivery and HTTP smoke checks are recorded separately.

## Authority and unresolved decisions

The developer requested continuing until automatic daily publication is possible. Implementation and existing scoped-PR merge authority apply. No new paid services, protections or automated article merge are introduced here. Live IAM trust setup and activation require a concrete reviewed configuration. Existing Hosting uses billing; storage and transfer consumption are not yet measured. Schedule, model and source policy remain under #20.
