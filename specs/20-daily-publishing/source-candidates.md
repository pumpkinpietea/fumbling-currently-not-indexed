# Editorial source candidates and comparison policy

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/20
Checked: 2026-10-10. Discovery only; no source has been activated for automated publication by this document.

## Confirmed user requests

Cover Southeast Asia IT and e-commerce. Include Chinese and Middle Eastern sources, specifically Al Jazeera, to compare Western and other coverage. Include JICA among low-frequency candidates. The developer also proposed Nikkei Asia and NHK WORLD-JAPAN as Japanese media candidates. Keep the regional industry focus when adding international sources.

## Candidate inventory

| Candidate | Intended role | Verified discovery | Access and adoption status |
| --- | --- | --- | --- |
| JICA | Development, digital infrastructure, AI skills, trade/logistics; fresh announcements plus dated background | [Official RSS directory](https://www.jica.go.jp/faq/rss.html), [English RSS](https://www.jica.go.jp/english/rss/index.html), [DX portal](https://www.jica.go.jp/english/about/dx/index.html) | Official RSS supports discovery. [Site policy](https://www.jica.go.jp/english/policy/) reserves reuse/reproduction except personal use and legally recognized quotation. Feed availability does not authorize arbitrary full-body republication or model processing. Assess each material and attribution before adoption. |
| Nikkei Asia | Japanese media candidate for regional business, technology and e-commerce comparisons | [AI policy](https://asia.nikkei.com/announcements/nikkei-s-view-on-ai-in-journalism) | Official policy rejects unauthorized AI use of copyrighted material. Subscription is not assumed to grant automated ingestion/reuse rights. Current detailed terms and licensed access remain to be verified; no adapter activated. |
| NHK WORLD-JAPAN | Japanese media candidate for reported events and policy/social context | [Official portal](https://www3.nhk.or.jp/nhkworld/en/) | Official portal/terms retrieval was blocked for the research tool by robots.txt. Actual feed availability, topical coverage and reuse conditions remain unverified. Similarly named third-party domains are not accepted as official NHK policy. |
| Al Jazeera | Requested Middle Eastern reporting and event-level comparison | [Terms](https://terms.aljazeera.net/index.html) | Published terms restrict unauthorized automated access, copying and analysis. No automated body adapter planned without a permitted access/license path. Requested editorial inclusion remains open. |
| CGTN | Candidate Chinese reporting | [Official RSS directory](https://www.cgtn.com/subscribe/rss.html), [terms](https://www.cgtn.com/terms-of-use.html) | RSS headlines/links exist; site terms restrict robots, mining and derivative/commercial reuse. Clarify permitted feed use and downstream processing before activation; no body scraping. |
| Xinhua | Candidate Chinese reporting on regional digital trade | [Asia-Pacific portal](https://english.news.cn/asiapacific/index.htm) | Regional coverage exists; automated access/reuse/license remains unverified. No adapter or adoption. |
| SCMP | Additional China/Hong Kong coverage candidate, not a proxy for all Chinese viewpoints | [Terms](https://www.scmp.com/terms-conditions) | Explicit restrictions on automated extraction and AI/RAG ingestion, including metadata and third-party access. Exclude automated ingestion absent permission. |
| Sea / Shopee | Company-origin evidence for e-commerce and technology announcements | [Newsroom](https://www.sea.com/investor/newsroom), [updates](https://www.sea.com/news/latest) | Company claims require attribution; source access/reuse and adapter design remain unverified. Not independent corroboration of its own claims. |
| Grab | Company-origin regional technology/payment/platform evidence | [Press centre](https://www.grab.com/sg/press/) | Same company-source limitations; adoption remains pending. |
| Lazada | Company-origin online-commerce announcements | [Press releases](https://www.lazada.com/en/press-release/) | Same company-source limitations; reject routine sale promotions unless a concrete industry development warrants coverage. |
| ASEAN | Regional digital-economy policy background and primary announcements | [E-commerce overview](https://asean.org/our-communities/economic-community/asean-e-commerce/overview/) | Background availability verified; access/reuse and dated-announcement ingestion remain pending. |
| Western and Southeast Asian independent outlets | Reporting and comparison partners | Specific outlets, feed terms and allowed processing still to be selected | Do not label the current company/institution inventory as balanced independent reporting. Existing ANTARA trials alone do not cover the requested geography or perspectives. |

This inventory summarizes published policies; it is not a legal clearance or a conclusion that all factual reference or quotation is prohibited. Prefer explicitly licensed feeds/APIs, permitted source material and original short analysis with citations. Do not bypass paywalls or access restrictions. Do not contact publishers without user authorization. Licensed commercial access must respect the agreed budget; no budget is approved yet.

## Comparison requirements for later implementation

- Compare the same event and relevant time period, preserving each article's source, original publication time, retrieval time and provenance.
- Record outlet origin, ownership and source type only when verified, with provenance; these do not mechanically determine an article's viewpoint. Do not assign credibility based only on geography.
- Separate supported factual overlap, attributed factual disagreement, interpretation and emphasis. Omission is observable only for the articles actually examined, not an outlet's entire coverage.
- Preserve uncertainty and distinguish company/government statements from independent verification. Trace syndicated reporting to the original; copies are not independent confirmation.
- An absent Chinese, Middle Eastern or Western comparison article is a coverage gap. Do not invent disagreement, force equal weight on unsupported assertions or fill geographic quotas with unrelated articles.
- A fresh institutional announcement may qualify for the daily interval. An older JICA/ASEAN report may support clearly dated background, but must never be relabeled fresh news because it was retrieved today. Existing freshness contracts should remain strict for event sources; background references require a separately specified role.
- Poll slow sources at a separately configured bounded cadence; retain a checkpoint and original dates to avoid repeatedly presenting unchanged material. Exact cadences remain proposed, not implemented.

## Remaining work

Select permitted regional/Western comparison partners; resolve licensed/permitted routes for requested outlets; implement source-role and perspective provenance contracts; evaluate held-out real event comparisons; configure schedule, language and model budget; perform a draft-only trial before unattended article activation. These findings do not remove the need for provider data-use review or factual/translation evaluation.
