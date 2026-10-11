# Tasks and evidence

- [x] Record requirements, source access findings and design before implementation.
- [x] Implement registry-driven source policy, parser options, validation and attribution.
- [x] Verify source isolation, multilingual relevance, balance and mixed-source rendering.
- [x] Verify real RSS metadata and private generation/review without production overwrite.
- [ ] Merge passing CI, build/deploy immutable runtime and verify tomorrow schedule.

Reviewed 2026-10-11: https://www.jica.go.jp/faq/rss.html ; https://www.jica.go.jp/english/policy/ ; https://vietnamnews.vn/rss ; https://vietnamnews.vn/privacy.html ; https://globalvoices.org/feeds/ ; https://globalvoices.org/about/global-voices-attribution-policy/ ; https://globalvoices.org/about/global-voices-policy-on-ai/ ; https://www.channelnewsasia.com/rss/rssterms ; https://terms.aljazeera.net/index.html ; https://english.news.cn/rss/ .

All eight official feeds passed real metadata retrieval: ANTARA 30/20/20, JICA 30, Viet Nam News 20/1, Global Voices 15/15 (151 total; 39 date/URL-eligible). Global Voices/JICA had no qualifying fresh SEA IT/e-commerce candidate in this window. The selected new relevant evidence included Viet Nam News data-centre reporting. Private reports remain outside Git.

Local validation: 122 tests, documentation checks and EN/JP builds passed.

Private trial from c2cb7a3 passed on October 11: two model calls, one new Viet Nam News data-centre event, skeptical review approved. Operator compared EN/JP text to the exact RSS excerpt and confirmed factual agreement, attribution and no duplication. Separate source68 trial state was saved; no production bundle or edition was written and the global lease was released. Raw evidence/output remains private.
