# Design and verification plan

## Design

Use native GitHub Issues and Projects with Markdown specifications. Keep AGENTS.md concise by linking docs/development.md. CLAUDE.md imports the shared entry point. Issue forms collect a task contract; specs/templates supplies optional detail. Preserve existing main-only production rules.

A project board groups repositories; parent/sub-issue relationships track outcomes and independently deliverable changes. Do not create duplicate implementation issues in a central tracking repository. Shared interface specifications have one owning repository and linked consumers.

## Acceptance verification

| Criterion | Evidence |
| --- | --- |
| AC-1, AC-2 | Review guide for ownership, change reconciliation, readiness and completion |
| AC-3 | Parse YAML forms; inspect required fields and templates |
| AC-4 | Inspect entry points and resolve local links |
| AC-5 | Run npm run check and git diff --check |
| AC-6 | Read issue links/relationships and record access blockers |

Review exact staged files, surrounding content and effective Git identities before committing. Review the outgoing diff before push. Portable CI is supplied by #22 in the same initial-foundation PR. Verify the exact PR head passes and respect the existing review requirement before merge. Production delivery remains a follow-up.
