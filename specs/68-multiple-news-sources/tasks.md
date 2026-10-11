# Tasks and evidence

- [x] Record requirements, source access findings and design before implementation.
- [x] Implement registry-driven source policy, parser options, validation and attribution.
- [x] Verify source isolation, multilingual relevance, balance and mixed-source rendering.
- [x] Verify real RSS metadata and private generation/review without production overwrite.
- [x] Merge passing CI, build/deploy immutable runtime and verify tomorrow schedule.

Reviewed 2026-10-11: https://www.jica.go.jp/faq/rss.html ; https://www.jica.go.jp/english/policy/ ; https://vietnamnews.vn/rss ; https://vietnamnews.vn/privacy.html ; https://globalvoices.org/feeds/ ; https://globalvoices.org/about/global-voices-attribution-policy/ ; https://globalvoices.org/about/global-voices-policy-on-ai/ ; https://www.channelnewsasia.com/rss/rssterms ; https://terms.aljazeera.net/index.html ; https://english.news.cn/rss/ .

All eight official feeds passed real metadata retrieval: ANTARA 30/20/20, JICA 30, Viet Nam News 20/1, Global Voices 15/15 (151 total; 39 date/URL-eligible). Global Voices/JICA had no qualifying fresh SEA IT/e-commerce candidate in this window. The selected new relevant evidence included Viet Nam News data-centre reporting. Private reports remain outside Git.

Local validation: 122 tests, documentation checks and EN/JP builds passed.

Private trial from c2cb7a3 passed on October 11: two model calls, one new Viet Nam News data-centre event, skeptical review approved. Operator compared EN/JP text to the exact RSS excerpt and confirmed factual agreement, attribution and no duplication. Separate source68 trial state was saved; no production bundle or edition was written and the global lease was released. Raw evidence/output remains private.

Production rollout: PR #69 passed exact-head Validate 38107815253 and merged at 65e0921e1b49e2242006c81b1193666d282cd894 with the reviewed pseudonym/noreply author and GitHub committer. Main Validate 38107987761, runtime build 38107995243 and Hosting delivery 38108007911 passed. Cloud Run and NEWS_RUNTIME_REVISION now use that revision and immutable image sha256:f59073bec8728d0fc7d362655624bdb4c259764f2030647af7b21b9eb41044b0. One task/CPU, 512 MiB, 600 seconds, zero retries and normal execution arguments are preserved.

Cloud metadata-only execution daily-news-8n2hb verified all eight feeds (151 records) on the deployed image, without model calls. Private metadata state is separate from AI-trial and production markers. The October 11 production status remains no_news, no publication bundle was created and the global lease was released. Scheduler remains ENABLED, 30 7 * * * in Asia/Jakarta, next start 2026-10-12T00:30:00Z. The consumer starts at 07:45; actual publication follows validation. The first unattended scheduled run is still future/unverified and remains tracked by #55. This documentation-only follow-up does not require rebuilding the approved runtime.
