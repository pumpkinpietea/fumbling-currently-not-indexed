# Low-cost news discovery and source adoption

The user uses Feedly Free and does not require Feedly as the integration. The objective is broad Southeast Asia IT/e-commerce coverage with original links, source diversity and comparable event-level facts. Collection, editorial evidence and publication are separate decisions.

## Recommended architecture

1. Keep reviewed official RSS as the unattended daily evidence input. ECNS (China News Service) and Mehr News Agency extend Chinese and Middle Eastern publisher coverage. A publisher's geography is not proof of a viewpoint. The source window, relevance and evidence still determine whether an item appears.
2. Use Google News search or its RSS in a personal feed reader to discover missing stories/outlets. The tested feed explicitly restricts use to rendering results in a personal, noncommercial feed reader; it is not approved as an unattended publication-pipeline input. A live `https://news.google.com/rss/search?q=ASEAN%20technology&hl=en-US&gl=US&ceid=US:en` request returned 100 candidate records. Useful searches combine Southeast Asian countries/ASEAN with technology, AI, data centres, e-commerce, payments or digital policy; additional searches can target Chinese or Middle Eastern outlets. Select original article URLs during personal reading; do not automate reuse of the Google feed outside that stated reader purpose.
3. Verify the original publisher URL, original publication date and available facts before adopting a candidate. Google wrapper URLs, indexed dates and headline-only descriptions cannot pass the current official-publisher evidence contract. RSS search is a discovery mechanism, not a maintained general Google News REST API or a reuse license. No paid decoder service, access-control bypass or automatic adoption is introduced.
4. Accept manually supplied original URLs as editorial candidates for low-frequency sources and sites without usable feeds. Read and check each original before a source-reviewed ordinary content PR. This is an operator workflow, not an implemented public submission form or an unattended URL crawler.
5. Optionally manage source subscriptions in Feedly Free and export public feed URLs via OPML. Feedly is not required by the runtime. A source-list export does not include saved Board/Read Later articles, and updating it is not automatic synchronization. Imported sources still require review before daily activation.

Implemented today: official RSS automation and operator-reviewed article publication. Tested for personal-reader discovery but not wired to the daily job: Google News RSS. Its feed-level usage restriction must be preserved. Planned only: OPML import tooling, a private URL inbox, automatic original-URL/date resolution, or discovery-to-source adoption. These require their own bounded adapter/access contract; do not claim them as delivered features or assume Google feed access grants pipeline permission.

## Feedly and paid alternatives

Feedly's current API documentation describes self-service API tokens as Enterprise-only, with an API add-on. Do not assume a Free or Pro account grants supported unattended API access. Personal Board public sharing requires Pro or above; private Board RSS sharing is Enterprise. The recommended approach requires no Feedly upgrade or shared credentials.

Google deprecated the old News Search API in 2011. Third-party products named "Google News API" are separate providers. NewsAPI's free Developer plan is development/testing only and explicitly excludes staging/production, including internal use; its listed Business plan is USD449/month. It is unsuitable for this project's current cost envelope. No paid service is enabled. Official RSS/Google RSS requests have no API subscription charge; request/network/compute costs still follow the existing bounded runtime assumptions, and total GCP spending has not been measured.

## Additional discovery alternatives

GDELT offers a free/open news index and DOC API with multilingual search. It can help find original publisher URLs beyond RSS, including Chinese/Arabic reporting, but is not an article-body license or proof of original publication time. One bounded live DOC request failed with an HTTP error, so current connectivity/reliability is unverified and it is not a production dependency. Evaluate a separate private candidate adapter with strict request/result limits before adoption; avoid BigQuery or paid intermediaries for this use case. Primary references: https://gdeltproject.org/data.html and https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ .

Official company/regulator/institution releases are useful complements to news media, particularly for launches, funding and policy. Label them as primary announcements; they are not independent media views. Newsletter subscriptions and manual original-URL submission are optional discovery paths, not implemented account integrations. Commercial feeds, email-account access and paid search services require separate configuration/authority. Inoreader is another aggregator, but its official developer portal requires Pro for this private/personal API use case (the free API exception is for qualifying public client apps): https://www.inoreader.com/developers/ . FreshRSS provides a self-hosted Google Reader-compatible API: https://github.com/FreshRSS/FreshRSS/blob/edge/docs/en/developers/06_GoogleReader_API.md . It could offer source management without a vendor API subscription, but adds hosting, database and maintenance work; no deployment or zero-infrastructure-cost claim is made. The initial recommendation is the existing official RSS automation plus personal search/reading and operator-reviewed originals, while testing GDELT as a future automatic discovery layer.

## Source handling

Keep publisher identity and original source links through each stage. Discovery can be broader than the set eligible for AI summarization/publication. Do not feed restricted SCMP/Al Jazeera/Nikkei content to the model through an aggregator as a workaround. Do not represent a Chinese or Middle Eastern story as independent corroboration unless the underlying reporting supports it. Compare actual differences in claims or emphasis only when articles cover the same event.

ECNS's current official `/rss/rss.xml` feed uses China-local wall-clock timestamps; its adapter converts strictly to UTC with +08:00 and preserves raw date values. Only exact `www.ecns.cn` HTTP article URLs upgrade to verified HTTPS; no insecure feed transport is allowed. Stale ECNS `/rss.xml` and People's Daily Business feeds are excluded. Mehr uses explicit GMT timestamps. Both sources are limited to original source-linked factual notes, without copying bodies, photos or editorial expression; no blanket content license is claimed.

## Primary references (checked 2026-10-11)

- [Feedly OPML export](https://docs.feedly.com/article/52-how-can-i-export-my-sources-and-feeds-through-opml)
- [Feedly Board sharing and plan requirements](https://docs.feedly.com/article/61-how-can-i-share-a-board)
- [Feedly API authorization](https://developers.feedly.com/reference/authorization)
- [Google's API deprecation announcement](https://developers.googleblog.com/spring-cleaning-for-some-of-our-apis/)
- [Google's original News RSS announcement](https://developers.googleblog.com/feed-me-seymour/)
- [NewsAPI pricing and production restrictions](https://newsapi.org/pricing)
- [ECNS official source and RSS invitation](https://www.ecns.cn/contactus.shtml)
- [Mehr official RSS](https://en.mehrnews.com/rss)
