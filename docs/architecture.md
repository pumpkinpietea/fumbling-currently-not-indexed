# Architecture and decisions

## Verified current state

The repository builds a Hugo/PaperMod static site in English and Japanese. Firebase Hosting configuration targets blog-pumpkinpie. Indonesian content and automated delivery are not implemented here. The developer reports an existing news collection process in Google Cloud; its resources and behavior have not yet been inspected. Authenticated read-only discovery found Cloud Run and Cloud Scheduler APIs disabled in blog-pumpkinpie. This does not prove the collector is absent; confirm its project and service type. No APIs were enabled.

## Development decisions

Use GitHub Issues for task contracts and decisions, repository specifications for code-coupled detail, and a product-level Project for cross-repository progress. Keep the initial implementation in this repository unless an independent ownership/release need justifies separation.

The rebuilt container starts Codex 0.162.1, retains ChatGPT authentication and passes npm run check. Nested namespace operations fail with EPERM under a container seccomp filter, consistent with the host's default security settings. The developer has selected Full Access for the current session. Repository .codex/config.toml still specifies workspace-write and auto review; this session override does not change that file. Full Access retains container boundaries but can modify mounted host project files.

## Unresolved product and infrastructure decisions

Inventory the existing Google Cloud collection process in #19 before deciding orchestration in #20. Cloud Run Jobs, Cloud Scheduler, article PRs and conditional auto-merge are candidates only. Source policy, model/provider, languages and rollout, daily timing, no-news behavior, factual quality checks, data storage, retry/idempotency, budget and publishing authority remain open.

CI/CD and repository protection are tracked in #18. No unattended agent worker, production deployment workflow or automatic merge policy is installed by the SDD foundation.
