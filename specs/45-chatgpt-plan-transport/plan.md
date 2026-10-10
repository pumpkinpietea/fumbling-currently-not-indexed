# Design

Use Node.js built-ins and fetch with fixed official endpoints and redirect rejection. Hold an owner-only exclusive adjacent lock across refresh and inference, releasing it on handled failure. A stale crash lock requires operator inspection; do not steal locks. Refresh every invocation to avoid guessing access-token expiry, rotating credentials atomically in the same directory. Keep validated identity and registration metadata intact.

Parse bounded UTF-8 SSE data frames across arbitrary chunks. Ignore nonterminal content, use only response.completed output, and reject every failed/incomplete response. Require all returned messages/text items to be completed; unsupported tool output is rejected. This transport exposes no tools.

Use private directories outside the repository for credentials and outputs, reject symlinks and group/world permissions, and create output via a private temporary file and exclusive hard-link publication. Emit only local error codes and counts. Tests inject fetch; production endpoints cannot be configured by request data.

References:
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms
