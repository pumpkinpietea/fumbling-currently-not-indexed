# Design and verification plan

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/22

## Design

Add a portable site build script and Node documentation/form checker with the pinned yaml parser. Restrict scanning to repository guides, specifications and issue forms; never scan temporary imported scripts, credentials or scraped debug data. Use a dedicated docs checker test suite with isolated temporary fixtures for malformed YAML, invalid forms and missing file targets.

GitHub Actions uses standard ubuntu-24.04, immutable checkout/setup-node action commits, Node 22 and a checksum-verified Hugo Extended release. Run npm ci and npm run check:ci without cloud or developer CLIs. A single job named Validate provides a stable check identity. Never use pull_request_target for PR code. No deploy job, external credentials, caches or artifact uploads are required.

## Verification mapping

| Criteria | Checks |
| --- | --- |
| AC-1, AC-4 | Parse workflow and inspect event, permissions, runner, timeout, concurrency and pinned uses |
| AC-2 | Node tests for valid input, missing links, invalid YAML and duplicate/missing form fields; validate current docs |
| AC-3 | npm run check:ci locally and in CI; npm run check for local smoke checks |
| AC-5 | gh PR checks and workflow run evidence; inspect protection via gh API |

## Cost and rollout

Standard hosted runner execution is free for public repositories under current GitHub documentation. Expect one bounded job per PR update and main push; no model/cloud spending. Re-check allowances before changing visibility or runner type. CI installation needs network access to public npm/GitHub distributions. Deployments and paid resource creation remain excluded.
