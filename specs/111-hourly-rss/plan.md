# Design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/111

Add an official-RSS-only private archive module and deterministic UTC-hour keys below evidence/. Capture all13 existing reviewed daily feeds using four bounded requests at a time,8-second feed deadlines and a75-second application deadline. Create one snapshot per hour; duplicate triggers are successful no-ops. Archive capture never acquires the app-session lease, reads credentials, discovers private links, invokes models or writes publication state.

At daily collection, retain the current live-feed completeness gate. Revalidate stored fields, raw publication dates, feed identities, slot timestamps and byte/record caps before combining. Scan at most32 UTC slots spanning the previous Jakarta day and late observations before collection. Read at most four slots concurrently with3-second read deadlines. Deduplicate identical URLs across feeds/observations; quarantine any differing publication dates, including conflicts outside the publication window. Prefer the latest complete RSS evidence for unchanged dated URLs. Apply the same title-only-aware region/topic shortlist to the date-eligible union, then cap its eligible records at500 records with explicit failure on overflow; keep model shortlist40. Record missing/partial snapshots and publisher counts privately without claiming full coverage.

Use the same relevance text for candidate scope and topic reservations, respecting title-only source policy. Expand multilingual telecom/software/online-commerce/place aliases; actual relevance remains model-reviewed. Record per-publisher received/date-accepted/policy-rejected/history/relevance/selected counts.

Reuse existing hourly Scheduler and job: --scheduled dispatches generation in Jakarta07 hour, snapshots otherwise. Direct --capture-rss is operator-only zero-AI verification. Preserve existing trial/metadata/normal flags. Rollout updates immutable image/default arguments before widening cron; no IAM, auth or bucket-policy changes. First partial day and fast-feed gaps remain visible.
