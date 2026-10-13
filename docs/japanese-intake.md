# Japanese news evidence and Google Alerts

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/100

## Implemented source boundary

Daily official evidence adds Yahoo world/business category RSS and Japanese JETRO headline RSS to the existing ten feeds (13 total). Yahoo category RSS contains original feed dates, attributed headlines and excerpts; only its exact source=rss marker is removed from canonical article URLs. The provider credited in the headline is required and displayed alongside Yahoo distribution. Yahoo's Japan flag identifies the distribution platform, not the nationality of its providers. No article bodies/images, feed redistribution, access bypass or blanket reuse license are assumed. JETRO notes use only sufficiently informative announcement headlines. Other Japanese inventory feeds are not automatically adopted: ITmedia's published RSS conditions restrict modification/translation.

Google News candidates, optional Alerts and other private discovery can prioritize independently accepted official-feed records. Exact direct URLs match eligible RSS records; unique normalized title hints can suggest priority but never verify Google-link identity. Ambiguous hints do not match. Source relevance/history/date gates still apply. Discovery dates, snippets, unknown origins and subscription tokens never enter model evidence or public bundles. The daily bridge report distinguishes direct matches, title hints and unresolved candidates. No matching RSS source means the candidate remains private; this does not claim every discovered article is available for automatic publication.

## Optional owner configuration

Google Alerts itself must be created by the owner in their Google account. No subscription has been provided or activated by this implementation. If the account offers RSS delivery, create separate alerts for Indonesia general news and SEA technology/e-commerce/digital economy (including Indonesia). RSS availability depends on the account interface; email export is a fallback. Suggested Japanese queries include Indonesia/Jakarta and country-specific combinations with AI, e-commerce or digital economy. Source=News and all matching results can broaden discovery; Google coverage is not exhaustive.

Create a private local JSON file outside Git, chmod 600, with schemaVersion 1 and up to three feed URLs:

```json
{"schemaVersion":1,"feeds":["https://www.google.com/alerts/feeds/FEED_ID/FEED_TOKEN"]}
```

Replace placeholders only in the private file. Run node scripts/alert-intake.cjs --configure /tmp/private-alerts.json using the existing authorized gcloud session. The uploader validates the exact HTTPS Google Alerts route, then writes auth/alerts.json with generation preconditions. It prints counts only. This persistent protected prefix is separate from 14-day private evidence retention. The runtime reads the configuration, makes at most three 5-second/1MiB/no-redirect/no-retry requests and retains redacted health plus candidate originals privately. Missing configuration is disabled; invalid configuration produces no requests; optional network failure does not prevent official collection. Never paste subscription URLs into GitHub issues, PRs or public content. To disable, configure the same schema with an empty feeds array.

An exported unencoded UTF-8 notification email can be inspected locally:

```sh
node scripts/alert-intake.cjs --email /tmp/alert.eml /tmp/new-private-alert-reader
node scripts/alert-intake.cjs --feed-file /tmp/alert.atom /tmp/new-private-feed-reader
```

The output directory must be new and outside the repository. This extracts safe original links (including Google redirect wrappers), with no mailbox access, article fetch, automatic upload or publication. Exported-email intake remains operator supplied; there is no unattended Gmail connection. For ongoing automated intake, supply the private RSS subscription configuration. Atom/RSS timestamps remain discovery timestamps, not original publication evidence.

## Bounds, cost and verification

Four selected sources, at most five unique events, one generation plus one review, 16KiB model input, 600-second execution and zero retries remain unchanged. There are at most 14 official-feed request slots, 13 active, and 500 total official records. Three added official requests plus three optional Alerts requests add at most 60 seconds/day of network waiting. At 31 runs, 1vCPU/0.5GiB, current us-central1 Jobs rates imply approximately USD0.036/month of added compute before shared free allowances. Responses are bounded to 6 MiB/day; small private report writes use existing retention. Storage, operations, networking, image builds and logs are additional. The total USD10 GCP envelope includes existing usage and is not a hard cap. No new resource, IAM permission, paid subscription or model call is introduced. [Cloud Run pricing](https://cloud.google.com/run/pricing) checked 2026-10-13.

Run npm run check:ci and npm run check:ui -- --preview-bundle with a validated private Yahoo fixture, then inspect screenshots for provider attribution/distribution badge and source new tabs. Runtime rollout evidence belongs in #100 and specs/100-japanese-news-intake/tasks.md. A metadata-only execution verifies collection and the private bridge with zero AI calls, not factual approval or scheduled publication of any future article.
