# ChatGPT plan transport

The local transport uses the official open-source Sign in with ChatGPT plan-usage flow. Eligible Plus accounts can authorize an app to consume their existing plan. Plus's five-hour limit is shared across apps; this does not create an independent allowance. No API key, paid API fallback, cloud service or automatic retry is configured here.

## Prerequisites and activation boundary

First-time browser OAuth registration is not implemented yet. This command requires a credential record issued for this application by the official flow, with validated ID-token signature, issuer, audience, nonce and subject. It must include issuer, subject, issued client_id, refresh_token and granted scopes including resource.invoke and chatgpt.tokens.use.direct. Do not hand-edit a credential record or import Codex auth.json. Credentials are not committed or placed in public GitHub Actions.

Use ChatGPT Settings -> Usage to allow the application to use plan capacity and disable credit use after plan exhaustion if zero additional model spending is required. This transport cannot override server-side credit preferences and does not guarantee zero credit consumption when the account permits credits. It never supplies an API billing key or switches providers after a failure.

Credential and output parent directories must be existing owner-only directories outside this repository, with no symbolic-link path components. Credential files must be owner-only regular files. Use a protected application configuration directory and private work directory. Output paths must be new.

```bash
node scripts/chatgpt-plan.cjs /private/work/request.json /private/config/session.json /private/work/new-result.json
```

These are illustrative paths; provision actual protected directories outside Git. A request has exactly these fields:

```json
{
  "model": "<account-visible-model-slug>",
  "instructions": "Use only the supplied evidence. Return the requested preparation text.",
  "input": "<prepared evidence allowed for model processing>"
}
```

The model must be visible in the current account's live model catalog. Instructions and input together are limited to 16 KiB. One invocation performs one token refresh, one model-list request and at most one Responses request, with a 120-second network deadline, 1 MiB stream cap and 256 KiB output cap. The preview does not support max_output_tokens; time/stream bounds limit local consumption but cannot guarantee a provider-side token cap after cancellation.

Successful output contains schemaVersion, model and text, created privately without overwriting. Text remains untrusted preparation data: no factual validation, evidence rendering or publication gate is applied by this command. Failed, incomplete and interrupted streams leave no output. CLI diagnostics contain local codes only.

An exclusive session lock serializes rotating-token use. A crash can leave session.json.lock: confirm no process owns the session before removing that lock. Refresh rotation is saved atomically before inference, including when model selection or inference subsequently fails. Credential write failure requires reauthorization if a rotated token was lost.

## Remaining integration

Implement first-time OAuth with PKCE/state/nonce and ID-token validation, then account-specific model selection. Complete browser consent, verify account credit preferences, run a small private live trial, and connect evidence validation and scheduling. Self-hosted execution needs persistent protected token storage and refresh ownership. No unattended schedule, GCP resource or production publication is activated by this transport.

Official references:
- [Registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Accounts, refresh and shared Plus limits](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)
- [Self-hosted VMs](https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms)
