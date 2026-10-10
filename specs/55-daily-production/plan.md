# Runtime and delivery design

A private, uniform-access GCS bucket stores a single rotating app session, exclusive daily run markers, private evidence, and validated publication bundles. Versioning is off; lifecycle expires evidence/bundles/locks after 14 days. Runtime has object access only to this bucket. No GitHub personal token is exported. The Cloud Run job starts at 07:30 Jakarta with one task, zero retries and a 600-second deadline.

A separate main-only GitHub workflow consumes the bundle at 07:45 Jakarta (GitHub cron can be delayed), or by explicit operator dispatch. Its WIF account can read only bundle objects. GITHUB_TOKEN creates a content-only PR, explicitly dispatches Validate on its branch, waits for exact-head successful CI and merges without bypassing branch protections. Because token-originated merges do not trigger push CI, it explicitly dispatches Validate on main. Hosting accepts successful same-repository main validation from push or workflow_dispatch, and checks the current revision before deployment. The dedicated Hosting identity has no storage access. This avoids broad persistent GitHub credentials in GCP.

Source adapters initially use reviewed ANTARA feeds and official RSS excerpt evidence. Other candidates remain discoverable but are not silently activated. A limited source subset is a rollout limitation. ANTARA’s official RSS page explicitly describes use to complement other sites; its terms restrict other content reuse. Use only the feed-supplied title and short excerpt for personal noncommercial original factual notes, with links, not article-body acquisition or copied paragraphs. Require original feed dates and title/excerpt provenance, factual source quotes, conservative deduplication, short EN/JP summaries, a second bounded model verification and deterministic structural/numeric checks. Source text is untrusted data and cannot issue tool instructions. No-news and invalid/partial runs write no bundle. Duplicate dates do not overwrite files.

## Implementation tasks

1. Provision dedicated WIF accounts, private bucket and bounded image registry; verify current pricing and budget visibility.
2. Implement source preparation, bilingual generation/review, private state and immutable bundles with unit/integration failure tests.
3. Add content-only consumer, explicit validation dispatch and validated-main delivery support; enforce staged privacy review and pseudonymous automated identities.
4. Pass local and PR CI; merge, build image in free standard GitHub Actions, deploy bounded Cloud Run Job, trial without publication, then install Scheduler and activate after verification.
5. Verify live Hosting WIF release and first scheduled configuration. Record unresolved limitations honestly.
