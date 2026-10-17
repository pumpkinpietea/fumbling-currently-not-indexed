# Security and developer-tool digests

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/120

Two independent worldwide streams supplement the Indonesia/SEA editions: institutional cybersecurity warnings/incidents and developer-tool/blog updates (Claude Code, OpenAI Codex, DeepSeek, Google, Apple). Source-country badges identify the publisher, never attack origin or victim geography. The first publication is an operator-reviewed October17 edition covering the preceding14 calendar dates, not fourteen days of backdated posts.

## Collect and review

Run `npm run collect:specialists -- 2026-10-17 /absolute/private/new-report.json --social`. The date is the edition's UTC calendar date; only source dates in the14-date window and not after collection time are retained. Output is create-only, mode0600, and must remain outside Git. With --social, a sibling new-report.json.social.html provides a private ranked discussion reader. Use a protected parent directory. No credentials, model calls, article auto-publication or cloud resources are used by collection.

The reviewed registry is config/specialist-sources.json. Ten sources use RSS2, RDF, Atom, official latest-stable-release JSON, or narrowly selected dated official index/change-log sections. Bound one request/source, four concurrent, ten seconds/request, one MiB/source,500 retained records and2MiB/report. Accepted/rejected/duplicate/truncated counts and per-source failures stay explicit. Independent failures preserve healthy sources, but partial retrieval is not complete coverage. An empty result is not proof that no news exists. Source dates retain raw evidence and precision; JPCERT RSS timestamps are labeled RSS update times, date-only indexes show no invented hour, and CET/CEST/PDT/PST offsets are enabled only for the corresponding reviewed publishers.

Prepare a candidate conforming to scripts/render-specialist.cjs from exact report evidence IDs, localized titles/summaries and20–250-character exact quotes. Each used source belongs to one event; combine duplicate government advisories. At most40 events,20 per stream, three sources/event, EN400/JP180 summary characters. An independent review must approve every used ID exactly once. `npm run render:specialists -- /private/candidate.json /private/report.json /private/review.json /private/new-staging-directory` reconstructs EN/JP files into a new staging directory. Inspect facts/translation and rendered browser screenshots before copying only intended files into content and using a protected PR.

Numeric/quote/hash checks do not prove semantic correctness or a trustworthy editorial review. The renderer does not call a model or publish. Cyber observations reference selected security notes and need the same factual review: differentiate a vulnerability, evidence of exploitation, an investigating organisation's statement and an attributed government allegation. No attack-country rankings, global incident-frequency estimates, copied advisories, ungrounded actor attribution or repetitive per-item interpretation.

## Source review and limitations

| Source | Evidence/access handling |
| --- | --- |
| JPCERT/CC | Official https://www.jpcert.or.jp/rss/index.html offers RSS1.0. Read bounded headline/excerpt; credit/link and distinguish RSS updates. No blanket republication license claimed. |
| CISA | Public advisory index https://www.cisa.gov/news-events/cybersecurity-advisories supplies titles/dates only. Full RSS and KEV JSON exceeded1MiB and remain unused. Government actor allegations remain attributed. |
| CNCERT/CC | Chinese official https://www.cert.org.cn/publish/main/index.html supplies warning/report titles/dates only. English About page has no current news list. No PDF/body retrieval or inferred incident details. |
| CERT-EU | Public security-advisory RSS only. https://www.cert.europa.eu/legal-notice authorizes CC BY4 subject to third-party exclusions; public notes include credit/license/adaptation notice. No restricted TLP intelligence or PDF intake. |
| UK NCSC | Official all-RSS title/excerpt with original source and timestamp. Incidents under investigation remain described as such. |
| Claude Code / Codex | Official vendor repositories' releases. Claude Atom; Codex latest-stable JSON avoids alpha-only entries with no useful facts. Original factual summaries, no code/binary redistribution. Repository licenses do not imply a product endorsement or permission for unrelated content. |
| Google / Apple / DeepSeek | Official dated blog cards, official offered RSS, or first explanatory paragraph of dated change-log sections. Short original notes; no full body/images or blanket rights assumption. Performance/pricing claims remain vendor statements. |

Current rejected endpoints include Google legacy RSS redirects, an unavailable Hong Kong CERT feed, NVD legacy RSS, oversized OpenAI rendered changelog and oversized CISA catalogs. The collector does not follow redirects, bypass access challenges or silently increase bounds. Review new adapters independently before activation.

## Social discovery for both streams

Eight bounded public Hacker News/Algolia queries search cyberattack, ransomware, security vulnerability, Claude Code, Codex, DeepSeek, Gemini developer, and Apple Xcode. Each retrieves at most20 stories, zero retries,256KiB/ten seconds. Retain title, original HTTPS URL, discussion link, exact points/comments and query/time; exclude author identities and comments. Deduplicate discussion IDs within each stream. The private HTML orders this sample by points/comments; it is not a global SNS ranking or a complete platform crawl. Source URLs are never fetched from untrusted social results. Exact matches to independently accepted official originals are private ranking hints only; a zero-match result is valid and must not be invented into social-verified news.

Official GitHub releases are announcement channels, not social popularity scores. X/Weibo/LinkedIn official-account posts can be supplied as original links for manual verification; no account connection or posting is activated. A public Bluesky search probe was rejected; no authentication workaround is used. Additional platforms require their supported access and independently verified original-source facts. Public HN search documentation: https://hn.algolia.com/api ; vendor repository/API rules: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service .

## Operational boundary and cost

Collection and rendering are repeatable operator commands. This first release does not schedule specialist collection or add specialist output to the existing07:30 cloud production run. Existing hourly retention, production locks/bundles, two-call daily limit,600 seconds, zero retries and existing source contracts are unchanged. A scheduled four-stream rollout must explicitly share those budgets and verify delivery; do not present manual publication as unattended automation.

No new GCP resources, paid SNS integration or paid model fallback. Initial generation/review uses at most three separately recorded existing-plan calls for this operator edition (bounded generation stopped, initial review rejected wording, final corrected review) with no retries and the protected authoritative session; external-app credit use stays OFF. Local collection has no GCP recurring increment. Existing total GCP cost remains unmeasured within the approved total USD10/month. Private operator evidence follows existing14-day retention if saved in GCS; local reports are operator-managed and should be removed within14 days.
