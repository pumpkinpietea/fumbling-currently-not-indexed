# Issue-driven SDD foundation

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/17
Parent: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/16
Status: Implementation validated; PR preparation

## Goal

Enable a solo developer to hand an issue URL to Codex or Claude Code and receive a scoped, verified pull request without routine implementation approvals.

## Requirements and acceptance criteria

- AC-1: Issues own goals, acceptance criteria, decisions, dependencies and evidence links. Git owns detailed specifications and code together. No duplicate authoritative specification.
- AC-2: A guide defines readiness, autonomous execution, validation, completion and cross-repository identification.
- AC-3: Reusable work/bug issue forms, specification templates and a PR template cover goals, scope, decisions, tests and authority.
- AC-4: Codex and Claude Code entry points reference shared instructions without duplicating them.
- AC-5: Existing EN/JP builds pass; documentation links and form structure are checked.
- AC-6: Follow-up issues track CI/CD, existing Google Cloud inventory and daily multilingual publishing design. Project registration is attempted and any permission blocker is recorded.

## Scope and non-goals

Deliver documentation, templates, issue relationships and a reviewable PR. Do not deploy, automatically merge, modify cloud resources, install an agent runner, or assume new collection infrastructure is required. Project authorization is an external dependency, not a reason to block repository work.

## Decisions

- Use lightweight SDD with optional detailed specs for small changes.
- Use repository-local issue numbers in directory names and full issue URLs in documents.
- Treat Ready as permission to implement within explicitly recorded boundaries, not universal permission to merge or publish.
- Keep repository documents in English and user communication in Japanese.
- Inspect the existing cloud collection process before designing replacement infrastructure.

## Open questions

Project access was granted and News Publishing was created. Cloud authentication was completed; the collection resource project still needs confirmation because Cloud Run and Scheduler APIs are disabled in blog-pumpkinpie. Publishing architecture, editorial criteria, source policy, language rollout and merge authority are not yet decided.
