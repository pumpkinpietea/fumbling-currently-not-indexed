# Protected ChatGPT browser sign-in

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/49
Status: Implementation

## Requirements and acceptance criteria

- AC-1: Start a five-minute loopback-only listener and expose Continue with ChatGPT from a local page. Use a stable opaque host ID, fresh PKCE/state/nonce and fixed official OAuth endpoints. New registration uses dynamic_agent_client and the application name; returning sign-in reuses the issued client ID.
- AC-2: Reject wrong/duplicate callback state, client mismatches, missing codes and denied consent before exchanging codes. Exchange each accepted callback once. Verify ID-token RS256 signature against fixed official JWKS, issuer, audience, expiry, nonce and subject; reject account changes on reauthorization.
- AC-3: Store only selected registration metadata and required credentials in owner-only files outside Git, atomically. Hold the same session lock as the inference transport. Failed reauthorization preserves active credentials. Keep the issued registration ID separately when first-time exchange fails, without treating it as authenticated identity.
- AC-4: Make no inference/model/credit request during sign-in. Never print tokens, account identity, callback query or retained ID-token hints. Local page carries no third-party assets. Reject symlinks and unsafe existing files.
- AC-5: Deterministic tests cover callback validation, signatures/claims, account mismatch, failed exchange and safe storage. A live browser consent remains the account owner's required action.

## Boundaries

One explicitly selected session per protected directory. Additional registrations require distinct selected-session directories; operators must preserve the runtime's host identity rather than copy another machine's ID. Scheduling and production IAM are separate. A local callback inside a Dev Container requires port forwarding to the browser machine; credentials stay in protected runtime storage. No Codex authentication is read.
