# Publishing roadmap

## Delivered foundation

PR #21 delivered the Dev Container, shared agent guidance, solo SDD templates and portable validation. #17 and #22 are complete; PR and post-merge main CI passed. Main requires PRs, a passing Validate check and up-to-date branches, including for administrators.

## Daily publishing first

[Daily architecture](../specs/20-daily-publishing/spec.md), [execution plan](../specs/20-daily-publishing/plan.md) and [cost scenario](../specs/20-daily-publishing/costs.md) belong to #20. They are proposals, not runtime behavior. #19 inventories local generation, #23 defines event-level quality/evaluation, and #18 owns main-only Firebase delivery.

Recommended sequence: decide policies -> implement offline contracts and quality evaluation -> configure restricted credentials -> bounded manual live trial -> draft article PR trial -> explicit authorization for content-only unattended merge and scheduling. No independent QA team is assumed: deterministic checks and agent-assisted source review provide evidence, with the developer deciding product policy and activation.

## Later reader support and distribution

| Issue | Requested outcome | Decisions before implementation |
| --- | --- | --- |
| [#24: Donation entry point](https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/24) | A small multilingual support link/page using a suitable provider | Eligibility, public identity, receiving currency, provider fees, payout/export capability and activation |
| [#25: Monthly transparency](https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/25) | Display site operating costs and donation amounts for the current month | Public fields, actual vs estimated amounts, attribution, reporting month/currency, corrections and update cadence |
| [#29: Original articles](https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/29) | Manual and AI-assisted non-news authoring, preview and publication | Article types, language/translation rules, templates/assets, drafts and publication authority |
| [#26: Social distribution](https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/26) | Post a canonical edition link/summary after successful production deployment | Platforms/accounts, API availability/cost, languages, format, idempotency and activation |

For transparency, the proposed fields are operating expenses, gross receipts, refunds, payment/platform/FX fees, net receipts and balance. Exact public fields await confirmation. Start with manually reviewed aggregate data rendered by the static site; automate private collection later only if worthwhile. Missing data must not look like zero. Never put billing exports, account identifiers, donor details or payment transaction metadata in the public repo.

Donation and social features must not block website publication. Social failures are retried separately using a per-edition/platform/language identity, without regenerating the article or reposting a possibly successful request blindly. No payment provider or social platform is selected and no account, payment or post was created.

The offline news contract in #28 verifies candidate identity/provenance only; it is not a generic article authoring requirement or proof of factual accuracy. Original articles share the site build and deployment, while news collection, event grouping and content-only bot authority remain separate.

All issues are grouped in the cross-repository News Publishing Project. Keep their goal, acceptance criteria and decisions in Issues; add repository specifications when each outcome becomes ready for implementation.
