# Hourly official-RSS retention

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/111

## Why the date window stays unchanged

Daily editions cover the previous calendar day in Asia/Jakarta. Moving the window to include arbitrary current headlines would change the edition meaning and risk gaps or overlaps. Morning-only retrieval missed Yahoo's previous-day items because its latest RSS had already rotated. Retain hourly observations instead: the existing Scheduler invokes the same job at minute30 every hour. Default `--scheduled` generates only during Jakarta07:30–07:59; other hours only capture official RSS. A delayed invocation outside that morning hour captures rather than generates; scheduled timing is not a hard guarantee.

`--capture-rss` provides explicit zero-AI capture. `--metadata-trial` verifies the actual daily merge without inference. `--metadata-next-day` simulates the next edition's window with current observations and still uses zero AI; it cannot establish complete future-day coverage and never creates public bundles. Existing explicit generation/replay flags remain operator controls, not automatic recovery.

## Private storage and trust

Capture the16 reviewed daily official feeds with at most four concurrent requests,8-second request deadlines and75 application seconds. No article bodies, private Google/Alerts results, app credentials, global session lease, model calls or publication writes occur in capture mode. Cloud Run keeps its existing one task/1CPU/512Mi/600-second ceiling and zero retries. Each UTC hour has a create-only `evidence/rss-hour-YYYY-MM-DD-HH.json`, capped at500 records and1MiB, with feed health and original raw publication dates. Repeated triggers do not replace an observation. Existing14-day evidence expiration, private access and zero soft-delete retention apply.

Historical snapshots from earlier reviewed feed sets remain usable as strict ordered subsets; missing active feeds are recorded per slot and prevent a complete-coverage claim. See [source coverage](source-coverage.md).

Daily merge reads at most32 deterministic hours spanning the previous Jakarta day and late morning observations, with four reads at a time and3-second read deadlines. It rechecks slot/time, schema/size/counts, reviewed feed identities and raw-date parsing including JICA/ECNS date policies. It accepts only reviewed original URLs and sufficient RSS evidence. The latest usable complete record for an unchanged dated URL supplies the whole evidence; differing publication dates quarantine the URL, even if one observation falls outside the window. Snapshots never change the original source date or combine fragments to invent evidence.

Current live collection must still retrieve all original13 required feeds successfully. The three new enrichment feeds may fail independently with explicit incomplete health; they never provide missing evidence. Missing/failed/incomplete snapshots are reported as coverage gaps, while current supported observations remain usable. Malformed stored objects or more than500 relevant merged records fail closed. Topic matching precedes this aggregate cap, with title-only institutions evaluated only on their approved headline. Selection/history/model limits and skeptical review remain mandatory; no publisher quota or unrelated foreign news is introduced.

## Diagnostics and limits

Private `evidence/source-selection-*.json` records snapshot coverage, live/archive counts, policy/evidence/date/conflict/scope counts and per-original-publisher selection stages. Yahoo groups by credited provider. These identify collection failures, short-lived feeds, missing time slots, absent relevant candidates and history filtering separately. Counts do not prove every potentially relevant story was found.

A first partial day has missing prior hours. Records already lost before activation cannot be reconstructed; items that disappear within an hour or during failures can still be missed. Retention improves observation coverage without promising a complete news archive. Multilingual selection adds explicit telecom/software/cloud/device/commerce expressions and regional places; the independent editor checks actual subjects, so incidental technology references need not become tech stories.

## Costs and rollout

Reuse the existing Scheduler, Cloud Run job, invoker identity and private bucket; no IAM, new service or model-credit activation is needed. At23 extra captures/day over31 days,60–90 charged seconds each and1CPU/0.5GiB, additional compute is42,780–64,170vCPU-seconds and21,390–32,085GiB-seconds: approximately USD0.81–1.22 before shared allowances. Cloud Run jobs have a one-minute billing minimum. Storage at the1MiB hourly cap is at most roughly336MiB across14 days, plus bounded read/write/log/network usage. Allow approximately USD0–2 incremental/month; existing total spend remains unmeasured and USD10 covers the whole project. Alerts are not hard caps.

Prices checked2026-10-17: [Cloud Run](https://cloud.google.com/run/pricing), [Scheduler](https://cloud.google.com/scheduler/pricing), [Storage](https://cloud.google.com/storage/pricing). Free allowances are shared across the billing account; slow startup or other usage can change actual costs.

Deploy validated immutable main to the existing job with default `--scheduled`, then change the existing cron to `30 * * * *` with zero retries. Preserve its empty request body and fixed invoker, avoiding overrides or broader IAM. Perform one explicit capture and a zero-AI metadata merge before declaring rollout verified. Inspect raw feed health and coverage diagnostics, not just a successful exit. Rollout evidence belongs in issue111; first unattended hourly/day outcomes remain separate observations.
