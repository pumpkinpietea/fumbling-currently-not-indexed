# Architecture and decisions

## Verified current state

The repository builds a Hugo/PaperMod static site in English and Japanese. Firebase Hosting configuration targets blog-pumpkinpie. Indonesian content and automated delivery are not implemented here. The developer clarified that the existing collector runs locally. Temporary scripts implement RSS collection, article/snippet extraction, Gemini summarization and optional Hugo Markdown output, but not scheduled publishing. Do not import those files: they contain credential-like values and raw debug/cache data. See specs/23-news-quality/ for sanitized observations, source candidates and proposed quality policy.

Read-only cloud discovery found Cloud Run/Scheduler APIs disabled and no App Engine application in blog-pumpkinpie. No APIs were enabled or resources modified. Those findings no longer block the local collector inventory.

## Development decisions

Use GitHub Issues for task contracts and decisions, repository specifications for code-coupled detail, and a product-level Project for cross-repository progress. Keep the initial implementation in this repository unless an independent ownership/release need justifies separation.

The rebuilt container starts Codex 0.162.1, retains ChatGPT authentication and passes npm run check. Nested namespace operations fail with EPERM under a container seccomp filter, consistent with the host's default security settings. The developer has selected Full Access for the current session. Repository .codex/config.toml still specifies workspace-write and auto review; this session override does not change that file. Full Access retains container boundaries but can modify mounted host project files.

## Unresolved product and infrastructure decisions

Use the local inventory in #19 and quality specification in #23 before deciding orchestration in #20. Cloud Run Jobs, Cloud Scheduler, article PRs and conditional auto-merge are candidates only. Source policy, model/provider, languages and rollout, daily timing, no-news behavior, factual quality checks, data storage, retry/idempotency, budget and publishing authority remain open.

PR/main validation is implemented by #22 using standard Ubuntu runners, Node 22 and checksum-pinned Hugo Extended 0.147.9. Deployment and protection changes remain in #18. No unattended agent worker, production deployment workflow or automatic merge policy is installed. Main currently requires a separate approving review without required status checks; a solo-compatible replacement has not been authorized.
