# Cost assumptions and activation bounds

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/20
Checked: 2026-10-10. USD estimates before tax; forecasts are not charges, guarantees or spending authorization.

## Reference workload

Assume 30 editions/month, one 10-minute generation run/day, 1 vCPU and 0.5 GiB if containerized, at most 10 selected events/day, and total model traffic of 50,000 input plus 10,000 output tokens/day across all stages/languages. Token counts include repeated prompts, verification and thinking where billed. This is a sizing scenario, not a measured current workload; three-language output or retries may exceed it.

| Component | Illustrative monthly estimate | Conditions and exclusions |
| --- | --- | --- |
| Standard hosted Actions, public repo | $0 execution charge under current public-repo allowance | Generation ~300 minutes; PR/main builds add minutes. No larger runners, paid artifacts or private-repo assumptions |
| Gemini 3.1 Flash-Lite, standard text candidate | 1.5M input x $0.25/M + 0.3M output x $1.50/M = $0.825 | Pricing example only; model/access/quality/lifecycle must be checked before adoption. Excludes tools, embeddings, caching and retries |
| Same model scenario, three times token usage | $2.475 | Stress scenario, not a ceiling or a quality recommendation |
| Cloud Run Jobs alternative, us-central1 list rates | 18,000 vCPU-s x $0.000018 + 9,000 GiB-s x $0.000002 = $0.342 before free allowance | Potentially covered by shared billing-account free allowance; region/currency/other usage matter |
| One Scheduler job alternative | $0 if a shared free slot remains, otherwise $0.10/31 days | Three free jobs per billing account, not per project; paused jobs also count |
| Existing Firebase Hosting | Increment unknown until usage measured | Storage allowance 10 GB and transfer 360 MB/day; Blaze overages currently $0.026/GB storage and $0.15/GB transfer |

Cloud Run's account-shared monthly allowance is based on 240,000 vCPU-s and 450,000 GiB-s at us-central1 rates. Registry images, builds, logging, secret storage and outbound transfer are separate costs; do not call the whole cloud architecture free. The Actions proposal avoids introducing those components initially. Existing Hosting release storage and visitor traffic must be measured before forecasting hosting overages; publication frequency alone is insufficient.

Gemini free access has limited quotas and different data-use conditions from paid access. Do not assume copied source bodies are appropriate for a free-tier provider or that quotas guarantee daily availability. Use a free-only configuration that stops on quota exhaustion rather than silently falling back to paid usage. No live API request is authorized by this estimate.

## Proposed controls

- Require explicit monthly/daily limits and a supported model/pricing revision before paid mode. A possible starting ceiling is $5/month for incremental pipeline costs; this is a proposal pending response, not authorization or a cap on existing site/cloud bills.
- Reserve maximum request input/output cost before calls, include bounded retries and ambiguous outcomes, and stop before exceeding the remaining budget. Reconcile against provider usage; application accounting cannot cap unrelated workloads or delayed adjustments.
- One active run, proposed 20-minute total timeout, bounded feeds/candidates/body bytes, no image/audio generation or paid grounding tools, no paid fallback. Confirm actual bounds in the implementation issue.
- Avoid raw-body/debug artifacts. Limit sanitized operational logs and retained deployment versions; check storage consumption rather than assuming deletion removes billing/history immediately.
- Alerts notify; they do not prevent charges. Billing/IAM changes, paid subscriptions and new cloud resources require separate authorization.

## Sources

- [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Model deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Scheduler pricing](https://cloud.google.com/scheduler/pricing)
- [Firebase pricing](https://firebase.google.com/pricing)
