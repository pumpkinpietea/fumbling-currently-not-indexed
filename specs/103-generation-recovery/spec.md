# Generation diagnostics and October 14 recovery

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/103

## Confirmed findings
All thirteen original feeds completed and four excerpts were saved. The original scheduled exception was collapsed to daily_run_failed and its model output deleted, so its exact cause remains unproven. Controlled replay generated valid JSON, then review inference failed upstream. A separate explicit review call succeeded but rejected two semantic problems: Indonesian grouping 1.222 was copied as a fractional English/Japanese household figure, and incidental AI context made cultural-preservation news enter tech. Correct 1,222 output would have failed the old literal numeric-string evidence gate.

## Requirements and acceptance criteria
- Schema4 events declare one or both editions. Validate declared geography/topic bounds, shared Indonesia tech inclusion and independent skeptical review. Keep schemas1–3 event/render contracts unchanged; do not infer definitive semantic membership solely from keywords for new events.
- New-event numeric checks compare canonical English/Japanese numeric values to source-locale evidence. Explicit Indonesian ANTARA locale converts thousands dots/decimal commas; legacy checks remain unchanged. Never accept an unsupported value, fractional-household mistranslation or translate units silently.
- Persist bounded private generation/review output and allowlisted failure phase/code/status before cleanup, without credentials or public raw model/error messages. Failed production generates a redacted status object readable by the existing bundle consumer; its scheduled workflow must fail rather than report a successful no-op when that status is available. No-news remains a successful no-post outcome.
- Preserve original failed markers and source evidence. Recover October14 from those saved excerpts, with corrected facts/categories, independent review, operator source inspection, exact file PR CI/main/Hosting and live checks. Save source history after verified delivery without overwriting existing records.
- No new resources, IAM, paid model fallback, automatic retries or increased normal call/runtime caps. Two inference calls per normal run, zero retries and600 seconds remain the ceiling. Explicit operator diagnostic calls are separately recorded, finite and never automatic.

## Limits
Allowlisted diagnostics improve future failures; they cannot reconstruct the discarded original output or guarantee upstream availability. Google Alerts remains independently owner-pending under #102. No account credit setting or model change is authorized by this fix.
