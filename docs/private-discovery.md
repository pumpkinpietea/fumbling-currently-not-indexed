# Bounded private news discovery

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/83

The scheduled runtime keeps two English Google News RSS searches, including Chinese/Middle Eastern outlets, and adds one Jakarta-day rotation across Indonesian, Japanese, Vietnamese, Thai, Chinese and Arabic. Indonesia titles are eligible across topics; other Southeast Asian titles need IT/e-commerce/digital-economy relevance. Results are capped at 150 unique Google links. These are private reading candidates, not original article evidence, model input or public notes.

config/news-discovery.json defines reviewed fixed sources and seven watchlist topics. Three sources rotate among Telkom news/sitemap, Bank Indonesia releases and CABIS news. On Mondays one slot instead rotates JETRO or IDE-JETRO research. The fourth request uses the [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) for a rotating watchlist and two-day window, at most 50 index records. All four requests allow at most five seconds and 1 MiB each, with zero redirects/retries, TLS verification and public IPv4 DNS checks. RSS, HTML anchor and sitemap metadata are parsed without fetching article URLs, child sitemaps or images. Up to 150 extra original-link candidates are retained; repeat URLs are marked against the prior daily report. Discovery, index, feed and sitemap timestamps do not establish original publication dates. Older official-list links may appear; candidates need original verification before adoption.

Private JSON/HTML and source health use the existing 14-day evidence retention. Extra-source failure is recorded independently and does not prevent official collection; private-state write failures still stop the run. Weekly research is labelled separately. Same-topic watchlists do not prove that reports cover the same event or represent different viewpoints. Model/public evidence policy and its limits are unchanged. Japanese OPML discovery feeds remain available in config/japanese-discovery.opml; they are not automatically licensed model inputs.

## Local reader and newsletters

Run node scripts/private-discovery.cjs /tmp/new-reader-directory for a private reader, or node scripts/google-news-reader.cjs /tmp/new-google-directory for Google candidates. Directories must be new; the additional reader must be outside this repository. Files use owner-only permissions.

For an exported UTF-8 plain text, HTML or unencoded .eml newsletter, run node scripts/private-discovery.cjs --newsletter /tmp/newsletter.eml /tmp/new-newsletter-directory. This extracts at most 50 HTTPS links, removes common tracking parameters and rejects credential/private-host/authentication links. MIME base64, quoted-printable and other charsets are rejected; export decoded UTF-8 text or HTML instead. No mailbox connection, message sending or link fetching occurs. Links are unverified; tracking wrappers are not decoded into claimed originals. Local newsletter intake is manual, because no email account or subscription is configured.

## Cost and connectivity evidence

No new cloud resource, subscription, model call or API key is introduced. Added worst-case network waiting is 35 seconds/day: one 15-second Google request and four five-second requests. With one vCPU, 0.5 GiB and 31 runs, this is 1,085 vCPU-seconds and 542.5 GiB-seconds/month. At current us-central1 Jobs rates (USD0.000018/vCPU-second and USD0.000002/GiB-second), compute is approximately USD0.021/month before free allowances. [Cloud Run pricing](https://cloud.google.com/run/pricing) was checked on 2026-10-11; Jobs allowances are 240,000 vCPU-seconds and 450,000 GiB-seconds, shared across the billing account. Existing runtime startup/minimum billing and processing are separate from this incremental estimate.

Extra writes are four objects/day (124/month): Google and extra JSON/HTML use at most approximately 4 MiB/day and approximately 56 MiB of retained storage over 14 days. Added responses are at most 5 MiB/day; outbound requests are small, but provider/network pricing and shared allowances vary. The incremental recurring estimate is below USD0.10/month under these assumptions, excluding existing services, image builds/storage, unusual logs and shared-account usage. Existing total GCP spend has not been measured; the user's USD10/month total budget is not a guaranteed hard cap.

The bounded 2026-10-11 local trial fetched all three Google feeds (100, 100 and 63 items), retaining 150 unique filtered candidates. CABIS returned one relevant original-link candidate. Bank Indonesia, Telkom sitemap and GDELT failed within the selected transport/timeout policy; their health was retained without widening limits or bypassing access restrictions. These adapters remain optional discovery, not verified reliable feeds. Cloud rollout evidence is recorded in specs/83-private-discovery/tasks.md.

## Inclusive scope update (#89)

Indonesia is now eligible across all news topics; other SEA subjects require IT/e-commerce/digital-economy relevance. Five Google queries retain 30 candidates each (150 total), including fixed Indonesia-general and Yahoo Japan Indonesia searches, Chinese/Middle Eastern coverage and one rotating local-language query. These remain private candidates, not public evidence. See [two daily editions](two-daily-editions.md) for the superseding scope and publication contract.

## Independent official-source bridge (#100)

The Japanese intake guide at [japanese-intake.md](japanese-intake.md) supersedes the earlier entirely disconnected discovery boundary: private candidates may rank independently accepted official RSS records, but Google text/timestamps are never model/public evidence. Yahoo world/business RSS and Japanese JETRO headlines are active sources; the other OPML feeds are still discovery only. Optional owner-managed Google Alerts subscriptions remain disabled until private configuration is supplied. Exported-email parsing is local and does not imply a mailbox integration.
