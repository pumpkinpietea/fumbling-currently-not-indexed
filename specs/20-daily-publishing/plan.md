# Architecture and verification plan

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/20

## Proposed components

1. Collector: bounded allowlisted RSS/release retrieval, publication metadata and canonical publisher references. Use conditional requests where supported. Treat article text as untrusted data; reject private/local endpoints across redirects and DNS resolution. No model-directed URL fetching.
2. Quality selection: inexpensive article normalization, freshness/relevance filters and candidate event grouping, with evidence-backed fact records. Use #23 evaluation to decide when ambiguity needs model assistance.
3. Generator: one fact set, bounded structured model requests and language-specific rendering. No shell/tool execution from source/model text. Reject unknown/missing IDs, invented links and unsupported facts; deterministic checks cannot alone prove semantics.
4. Candidate handoff: sanitized JSON plus date-specific Markdown, validated without executing candidate code. Never upload raw bodies, request dumps or credentials as Actions artifacts. A candidate is public once committed to a public branch, even if its PR is draft; run privacy/evidence gates first.
5. PR writer: separate trusted job, short-lived repository-scoped GitHub App token, no model/news-network execution. Create/update the edition branch and PR idempotently. Restrict changed paths and file sizes, reject symlinks, executable files and workflow/config edits.
6. Merge controller, later: main-owned code validates bot installation/repository identity, base/head SHA, edition paths/manifests, required checks and current source-policy version. A label alone is insufficient authority. Merge exact validated head only; never use administrator bypass. Keep code PRs outside this policy.
7. Delivery: validated main revision -> Firebase Hosting via #18. Store a release receipt keyed by revision; roll back through a validated revert/previous known-good release procedure, never a force push.

## State and concurrency

Initial durable state can be a small public-safe manifest in Git alongside published editions: edition key, policy version, event IDs/fact fingerprints, source URLs/timestamps, language coverage and accepted revision. No raw article bodies, personal identifiers, exact private billing details or API payloads. Keep a rolling event index (proposed 30 days); immutable published edition references support older corrections. Bound current index size; Git history itself does not expire deleted files.

Use one generator concurrency group with cancel-in-progress disabled; allow one active edition candidate. A new run first reconciles the open candidate and published manifests. Paid-call usage is reserved before each request in durable state; ambiguous request outcomes retain reservations. Concurrent/manual runs cannot bypass the ledger. A failed model call cannot be assumed unbilled. Retry transient network/provider failures at most twice with bounded backoff; invalid contracts stop rather than loop indefinitely. Recovery must reuse a completed candidate before calling the model again.

Run states: collecting -> selected -> generated -> candidate -> merged -> deployed. Separate outcomes: no-news, degraded, blocked-budget, failed and superseded. Only deployment success marks published; merge alone is not publication. A pending merged edition is recovered through deployment, not another generation run.

## Execution alternatives

| Option | Benefit | Operational limitation | Initial recommendation |
| --- | --- | --- | --- |
| GitHub Actions standard hosted runner | Existing repo/CI, no additional compute service for this public repo | Schedule can be delayed/dropped; inactivity can disable schedules; secrets and PR token lifecycle need care | Preferred if approximate timing is accepted |
| Cloud Run Jobs + Scheduler | Cloud-managed execution and service identities; appropriate for stronger scheduling/operations needs | Container build/registry, IAM, billing account, scheduler, logs/storage/network and retry ownership add work | Retain as migration option; no resources created |
| Local cron | Reuses workstation | Depends on workstation uptime and local credentials | Development/manual recovery only |

Keep collector/generator CLI independent of orchestration so a container job can reuse the same contracts. Do not install an always-on development agent for this task.

## GitHub automation constraints

Current default token is read-only and Actions PR creation/approval is disabled. Do not broaden repository defaults. For unattended article PRs, prefer a repository-installed GitHub App with only Contents and Pull requests write plus required read permissions, without workflows/admin permissions. Mint tokens only in trusted jobs; never place App keys in generation jobs.

GitHub documents approval-required PR workflows for some GITHUB_TOKEN-created PR events and suppression of other token-triggered events. App installation tokens can trigger PR CI automatically. Token choice must also allow a merge to trigger main delivery; test the actual event chain before activation. App installation/key setup is an explicit integration step, not implemented here.

## Rollout and recovery

Phase 0: specify policies, offline sample and deterministic contracts. Phase 1: manual bounded retrieval/model evaluation after credential migration and budget approval, no public candidate until reviewed. Phase 2: draft article PRs with operator merge. Phase 3: explicitly authorize content-only automatic merge after labeled quality targets and a trial pass. Phase 4: activate approximate daily scheduling and main delivery with a disable/replay runbook. Indonesian can join at its approved phase.

No-news days update private-safe operational state, not artificial articles. Source outages create a clearly degraded run; policy decides whether enough independent coverage remains to publish. Initially block degraded editions rather than silently lowering standards. Disable automation on repeated quality/cost failures. Social distribution runs only after deployment success and is never a prerequisite for site publication.

## Verification mapping

| Criteria | Evidence required |
| --- | --- |
| AC-1 | Timezone midnight, UTC conversion, explicit replay and missing-date tests |
| AC-2/3 | #23 labeled grouping/fact tests; stale/date-unknown/snippet cases; missing/duplicate/unknown IDs and source-link checks; enabled-language Hugo builds |
| AC-4/8 | Two concurrent runs, same-day replay, unchanged prior event, ambiguous timeout billing reservation, retry exhaustion and budget boundary |
| AC-5 | Content-only valid candidate; rejected workflow/config/symlink/extra-file changes; stale head and bot mismatch; actual App -> PR CI event |
| AC-6/10 | PR cannot deploy; invalid main revision cannot deploy; successful main release receipt; failure preserves old site; disable/replay/rollback rehearsal |
| AC-7 | Genuine no-news versus all feeds unavailable versus partial coverage |
| AC-9 | Held-out quality report, cost report and draft-only trial; unresolved semantics prevent auto-activation |

Use original synthetic fixtures for structural tests and source-backed labels for factual evaluation. No tests or live trials have been run for this proposed pipeline.

## References

- [Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Token-triggered workflow behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Firebase CLI](https://firebase.google.com/docs/cli)
