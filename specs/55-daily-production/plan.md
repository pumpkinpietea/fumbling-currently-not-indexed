# Runtime and delivery design

A private, uniform-access GCS bucket stores a single rotating app session, exclusive daily run markers, private evidence, and validated publication bundles. Versioning is off; lifecycle expires evidence/bundles/locks after 14 days. Runtime has object access only to this bucket. No GitHub personal token is exported. The Cloud Run job starts at 07:30 Jakarta with one task, zero retries and a 600-second deadline.

A separate main-only GitHub workflow consumes the bundle at 07:45 Jakarta (GitHub cron can be delayed), or by explicit operator dispatch. Its WIF account can read only bundle objects. GITHUB_TOKEN creates a content-only PR, explicitly dispatches Validate on its branch, waits for exact-head successful CI and merges without bypassing branch protections. Because token-originated merges do not trigger push CI, it explicitly dispatches Validate on main. Hosting accepts successful same-repository main validation from push or workflow_dispatch, and checks the current revision before deployment. The dedicated Hosting identity has no storage access. This avoids broad persistent GitHub credentials in GCP.

Source adapters initially use reviewed ANTARA feeds and official RSS excerpt evidence. Other candidates remain discoverable but are not silently activated. A limited source subset is a rollout limitation. ANTARA’s official RSS page explicitly describes use to complement other sites; its terms restrict other content reuse. Use only the feed-supplied title and short excerpt for personal noncommercial original factual notes, with links, not article-body acquisition or copied paragraphs. Require original feed dates and title/excerpt provenance, factual source quotes, conservative deduplication, short EN/JP summaries, a second bounded model verification and deterministic structural/numeric checks. Source text is untrusted data and cannot issue tool instructions. No-news and invalid/partial runs write no bundle. Duplicate dates do not overwrite files.

## Implementation tasks

1. Provision dedicated WIF accounts, private bucket and bounded image registry; verify current pricing and budget visibility.
2. Implement source preparation, bilingual generation/review, private state and immutable bundles with unit/integration failure tests.
3. Add content-only consumer, explicit validation dispatch and validated-main delivery support; enforce staged privacy review and pseudonymous automated identities.
4. Pass local and PR CI; merge, build image in free standard GitHub Actions, deploy bounded Cloud Run Job, trial without publication, then install Scheduler and activate after verification.
5. Verify live Hosting WIF release and first scheduled configuration. Record unresolved limitations honestly.

## Private rehearsal and identity isolation

Requirements: a successful private generation trial must leave reviewable evidence after container cleanup, without creating a publication bundle. Each GitHub WIF provider must impersonate only its intended service account, including when providers share a pool.

Acceptance: trial output is stored under the private, 14-day evidence prefix; the bundle reader cannot access it. Tests verify retained trial content and absence of a publication bundle. Providers map a fixed purpose attribute and each service account trusts only that purpose; repository/ref/workflow conditions remain enforced.

Tasks: persist the validated trial bundle in private evidence; extend the runtime test; replace shared repository-only impersonation bindings with provider-purpose bindings; inspect remote mappings and policies and run CI.

## Activation rehearsal

The user confirmed that external apps cannot consume credits after plan limits. Run at most one bounded private next-edition generation trial, inspect its retained source evidence and bilingual text, then verify bot-originated PR creation, exact-head validation, protected merge and main delivery before enabling the schedule.

For live delivery verification, add an explicit manual rehearsal input. It consumes an operator-prepared validated bundle at bundles/rehearsal-DATE.json and deterministically renders two uniquely named draft articles. Scheduled runs cannot select rehearsal mode. Rehearsal requires the production-consumer flag to remain false, accepts no arbitrary paths or text overrides, and follows the same staged review, exact-head CI and protected merge flow. Draft content must be absent from the built site. Remove the two draft files through a normal validated cleanup PR before activation.

Acceptance: a manual workflow using GITHUB_TOKEN creates and merges the constrained draft PR without bypass, main validation/delivery succeeds, draft pages are absent, and no production edition is overwritten. Enable the configured clock and schedule only after this verification. Tasks: implement deterministic rehearsal rendering and CLI/workflow input; test path/frontmatter isolation; run private generation and inspect; run draft delivery and clean up; enable runtime and consumer; verify Scheduler timing and record first-run uncertainty.

## Live catalog compatibility correction

The first private trial failed before inference because the current model catalog exceeds the 256 KiB metadata cap. Accept a bounded 1 MiB catalog while preserving the 16 KiB model-input, 1 MiB stream and 256 KiB output limits. Test a realistic catalog above the former limit and reject catalogs above the new limit before inference. Live diagnosis also found a missing Content-Type header on a complete SSE response. Accept an absent header only through the same strict bounded SSE parser and terminal-completion checks; reject explicit non-SSE content types. Test both header absence and JSON/nonterminal rejection. Retry generation only after the diagnosed correction, with an operator-confirmed inactive execution and removal of the single failed trial marker.

The live stream also emits completed message bodies in response.output_item.done while response.completed.output is empty. Buffer only indexed, unique, completed output items; use them only after response.completed with completed status. Reject missing terminal events, gaps, duplicates and unsupported/unfinished messages. Never publish text deltas. Regression tests cover this actual stream shape and failure boundaries.

## PR-associated required validation

Live rehearsal #61 exposed current GitHub behavior: GITHUB_TOKEN-created PRs receive approval-required pull_request runs, and branch workflow_dispatch checks do not satisfy PR required checks. Preserve the required Validate check and existing protection. Poll only the Validate pull_request run associated with the exact bot PR/head. Before approving that CI run through the documented Actions API, recheck same-repository bot author, exact head/base/main and exactly the reconstructed two added content files. Approval is for CI execution only, never an approving PR review. Approve at most once and require that same PR-associated run to succeed before merge. A rejected approval or failed CI stops publication without a fallback. Keep main workflow_dispatch after merge for delivery.

Tests must verify exact PR/head association, scope verification before CI approval, single approval, successful completion, rejection of failed validation and ignoring unrelated workflow runs. The consumer must accept successful empty 201 API responses. Inspect and close the failed rehearsal PR, remove only its temporary branch, then repeat the draft rehearsal after the fix is validated and merged.

References: https://docs.github.com/en/actions/concepts/security/github_token ; https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks ; https://docs.github.com/en/rest/actions/workflow-runs#approve-a-workflow-run-for-a-fork-pull-request .

## Explicit delivery after bot merges

Rehearsal #63 verified GITHUB_TOKEN PR creation, scoped CI execution approval, required PR Validate and protected merge. Its token-dispatched main Validate succeeded, but workflow_run did not start Hosting delivery. Preserve regular push delivery and add explicit main-only deployment dispatch with a validation-run identifier. The deploy workflow must independently verify the actual Validate workflow id/path, same-repository main head, permitted event, completed success and current-main SHA before checkout/authentication. WIF permits only this dedicated deploy workflow on main, for workflow_run or workflow_dispatch, with immutable repository/owner restrictions.

The consumer waits for exact merged-main Validate success, then dispatches Deploy Hosting with that run id. No PAT or Google key is introduced. Tests cover unrelated/failed main validation and manual deployment gates. Remove the previously merged draft files through this PR, then repeat the draft cycle to prove bot-driven delivery before activation.
