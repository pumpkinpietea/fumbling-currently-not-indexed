# ChatGPT plan transport

The local transport uses the official open-source Sign in with ChatGPT plan-usage flow. Eligible Plus accounts can authorize an app to consume their existing plan. Plus's five-hour limit is shared across apps; this does not create an independent allowance. No API key, paid API fallback, cloud service or automatic retry is configured here.

## Prerequisites and activation boundary

Run the separate browser sign-in command below to issue credentials for this application, with validated ID-token signature, issuer, audience, nonce and subject. It must include issuer, subject, issued client_id, refresh_token and granted scopes including resource.invoke and chatgpt.tokens.use.direct. Do not hand-edit a credential record or import Codex auth.json. Credentials are not committed or placed in public GitHub Actions.

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

## Browser sign-in

Create an owner-only application directory outside Git and run:

```bash
mkdir -m 700 -p ~/.config/news-publishing
node scripts/chatgpt-signin.cjs ~/.config/news-publishing
```

Open the printed loopback page and choose **Continue with ChatGPT**. In a Dev Container, forward port 1456 to the browser machine as local port 1456; a remote/container loopback is not the browser machine's loopback. Bind the tunnel locally, not publicly. The container configuration includes the forward-port hint; an already running container may need manual forwarding. The listener expires after five minutes. Rerun the command if expired. Only the local page URL and a sanitized result are printed.

The command saves host.json, registration.json and session.json privately. The host ID stays stable for this runtime; retain the directory on persistent protected storage before unattended operation. It is not currently a dedicated persisted Dev Container volume, so deleting/recreating the container can require sign-in again. The registration file can retain an issued client ID after an unsuccessful first exchange; it is never used as proof of authentication. Returning sign-in preserves the selected account and rejects identity/client changes. Use session.json with the inference command after successful consent and credit-preference verification. Separate account selection UI and sign-out/revocation are not implemented by this CLI.

## Remaining integration

Complete account-specific model selection. Complete browser consent, verify account credit preferences, run a small private live trial, and connect evidence validation and scheduling. Self-hosted execution needs persistent protected token storage and refresh ownership. No unattended schedule, GCP resource or production publication is activated by this transport.

Official references:
- [Registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Accounts, refresh and shared Plus limits](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)
- [Self-hosted VMs](https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms)
