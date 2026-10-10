# Registry design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/43

Store reviewed source configuration in config/news-sources.json, loaded once by the collector. Flatten only private_metadata_trial feed entries into its internal ID allowlist. Preserve the existing input envelope and original two IDs. Add JICA official Japanese news feed and CNA Asia/business feeds for private trials. Keep requested but unverified routes as candidates.

Validate each record's URL hostname against its originating feed before calling the shared selector with the union of selected hosts; replace a disallowed URL only in the selection input, preserving raw metadata in the private report. This retains original indices, conflict quarantine and combined deduplication. Cap the full report at 500 records; a feed that would exceed the cap is failed without retaining its records. Existing per-feed parsing limit is 200, transport 1 MiB/15 seconds, sequential maximum eight requests, no retries or redirects.

AC-1: registry integrity tests and inventory review. AC-2/3: mixed-source, invalid-request, host-injection and total-cap tests. AC-4: existing failure/date/output tests. AC-5: npm run check:ci, private bounded trial and PR CI. Network findings establish endpoint compatibility only, not factual accuracy, full regional coverage, independent viewpoints or publication rights.

Live discovery found JICA's English URLs redirect to an archived 2023 Resource tree. Use its current Japanese news RSS instead. That feed spells full English month names in pubDate, outside the strict default RSS parser. Enable an explicit JICA-only full-month adapter; preserve raw evidence and retain all existing weekday, calendar and timezone checks. Do not relax date parsing for unrelated sources.
