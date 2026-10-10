# ChatGPT plan inference transport

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/45
Status: Implementation

## Requirements

Use the developer's existing ChatGPT Plus plan through the official open-source Sign in with ChatGPT contract. GCP's total USD 10 monthly budget remains separate; introduce no API billing, cloud resources or paid fallback. Server-side credit preferences must disable credit use to prevent consuming separately purchased credits; the transport cannot override them.

- AC-1: Read an explicitly supplied, owner-only OAuth credential file outside the repository. Require issued client identity, granted plan scopes and refresh token. Never read Codex authentication or print tokens or upstream bodies.
- AC-2: Serialize each credential session with an exclusive lock. Refresh once through the official OAuth endpoint and atomically persist replacement tokens before inference. Stop on errors, including plan exhaustion; never retry or switch billing automatically.
- AC-3: Discover visible account models through the official models endpoint, require an explicitly selected available model, then use Responses with `store: false`, `stream: true`, instructions and an input array. Apply input, stream, output and overall time bounds.
- AC-4: Accept only a terminal completed response with completed nonempty text output. Failed, incomplete, malformed and interrupted streams produce no output file. Write successful private output atomically without overwriting any existing destination.
- AC-5: Test token rotation, concurrency, model availability, stream fragmentation/failure and credential/output boundaries using fake network responses. No live account inference is required before the user completes separate OAuth consent.

## Boundaries

This change is a transport, not first-time OAuth registration, article generation, factual verification, scheduling or publication. Browser authorization and validated ID-token issuance remain an explicit prerequisite. Imported credentials must come from this application's official OAuth registration, never copied from Codex. No real credentials enter GitHub Actions or tests.
