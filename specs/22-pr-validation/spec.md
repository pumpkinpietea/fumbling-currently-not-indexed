# Free-tier pull request validation

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/22
Parent: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/18
Status: In progress

## Goal and scope

Make the SDD foundation verifiable in CI before merging PR #21. Use GitHub Free with standard Ubuntu runners for this public repository. Exclude deployment, model calls, cloud access and uploaded artifacts.

## Acceptance criteria

- AC-1: PRs targeting main and pushes to main run the same portable validation.
- AC-2: Broken relative documentation links, invalid YAML and invalid issue form structure fail the checks.
- AC-3: EN/JP site builds pass with Hugo Extended 0.147.9 and Node 22.
- AC-4: Read-only token permissions, pinned action commits, timeout and cancellation bound execution.
- AC-5: Actual CI evidence and observed GitHub settings are recorded. No failed check or existing review requirement is bypassed.

## Decisions and authority

Separate portable site/document checks from local CLI smoke checks. Keep npm run check as the container smoke entry point. The developer authorizes PR merging after validation. The developer approved the concrete protection proposal on 2026-10-10. Main now requires PRs, the successful GitHub Actions Validate check and an up-to-date branch. Required approvals are zero; code-owner review is disabled. Rules apply to administrators, and force pushes/deletion are prohibited.

## Open questions

Firebase delivery remains #18. Verify required checks on the exact latest head before merging.
