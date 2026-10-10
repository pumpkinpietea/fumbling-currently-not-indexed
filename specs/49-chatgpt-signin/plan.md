# Design

Use built-in HTTP, crypto and fetch, with fixed issuer/token/JWKS endpoints and RS256 allowlisting. Reuse transport private-directory/atomic-write helpers. Bind 127.0.0.1, validate Host, accept only GET and the exact callback path, and keep invalid unsolicited callbacks from ending a pending attempt. Consume a valid-state callback once before token exchange. Apply 30-second network and five-minute sign-in bounds. Serialize sign-in with inference's adjacent lock. Expose only a local page URL in CLI output; the page redirects to OAuth after a user click.

JWT validation uses the fixed JWKS (not a token-provided URL), matching kid, RSA signing keys, cryptographic signature verification and exact issuer/nonce/client audience. Do not persist email or profile claims. On a returning session compare the validated subject to the selected record before replacing tokens. Pending client registration is distinct from active credentials.

Reference: https://developers.openai.com/siwc/token-sharing-open-source/sign-in and https://auth.openai.com/.well-known/openid-configuration (checked 2026-10-10).
