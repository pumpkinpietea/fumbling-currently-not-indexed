# Tasks

- [x] Record corrected inclusive scope, issue contract and design before implementation.
- [x] Implement shared classification, highlights, four-file bundles and protected publisher.
- [x] Verify boundary/overlap/empty/replay behavior and private discovery quotas.
- [x] Inspect real browser captures of both new layouts and repair defects.
- [x] Privacy gate, exact-head CI, merge/main delivery, immutable runtime rollout and private rehearsal.

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/89

## Local evidence

- 143 portable tests and bilingual build/sitemap checks passed. Boundary, shared-text, empty-topic, no-AI empty collection, review failure, exact four-file staging, legacy two-file bundles, draft rehearsals and replay conflicts are covered.
- Live private Google trial: all five queries succeeded with 100/100/100/100/64 feed records, retaining 150 candidates with 30 per query, including explicit Yahoo Japan and Indonesia general searches. Candidates stayed outside public/model evidence.
- Populated local synthetic preview /tmp/news-ui-review-UUS5zV passed 60 route combinations in Chromium 156.0.8078.4 on Ubuntu 24.04 arm64. Actually inspected jp-dark-mobile-indonesia/article, en-light-desktop-indonesia, en-light-tablet-article, jp-light-tablet-indonesia and jp-dark-indonesia-source PNGs. Japanese text, long titles, factual linked highlights, flags and lower source links render without clipping. Synthetic preview content remains outside Git and production.
- Empty local preview /tmp/news-ui-review-yC0CVa passed 60 combinations. Actually opened jp-dark-mobile-indonesia and en-light-tablet-article: both clearly show the collection-scope empty message, readable layout and no fabricated highlight links. Final cloud rollout evidence is recorded in issue #89 after actual checks. First unattended scheduled publication of the new dated pages remains future verification, not a claim made from rehearsal.

## Rollout evidence

PR #90 exact head 1aaa40421112289526b4a6d6f81eb230c0ae7ec2 passed required Validate 38142546139 before protected squash merge. Main 5ee859ec7bb4ddc242dc72a871a7f00a4e41f971 passed Validate 38142607601, image build 38142617108 and Hosting 38142637602. Reviewed staged/outgoing diffs and pseudonym/noreply commit identities before publication. The deployed immutable runtime is sha256:0171f2339bf6169b06c9c996b7f880ee33451e92e6685fbd0d97721d5e740596, with matching NEWS_RUNTIME_REVISION 5ee859ec7bb4ddc242dc72a871a7f00a4e41f971.

Cloud advance-clock execution daily-news-dvhj2 succeeded at 2026-10-11T13:21:48.670450Z. Its private revision-scoped trial bundle reconstructed four October 12 EN/JP files: two supported Indonesia general events (sports and diplomacy) and an empty tech edition. Original RSS evidence, dates, quotes and translations were inspected; neither event was incorrectly assigned to tech. Google discovery completed five feeds (100/100/100/100/63 records). Production October 11 no_news state remained unchanged, no October 12 production bundle was created and the global runtime lease was absent.

Real private-bundle browser preview /tmp/news-ui-review-xU4tMb passed 60 combinations, including actual highlight navigation. Opened en-light-desktop-indonesia, en-light-tablet-article and jp-dark-mobile-indonesia/article PNGs: linked highlights and empty-topic text are readable without clipping. Live browser report /tmp/news-ui-review-McsFRl passed 48 production combinations; actually inspected en-light-desktop-home and jp-dark-mobile-news. Live sitemaps/robots again passed (48 canonical URLs per language, 20 news cards, seven publisher badges); future trial/fixture pages were not published.

Scheduler remains ENABLED, 30 7 * * * Asia/Jakarta, next 2026-10-12T00:30:00Z. The 07:45 consumer remains enabled. Rehearsal is not proof of the future unattended run or full-day news coverage; observe the first scheduled pages under #55. Documentation-only follow-up does not change the deployed runtime code or require an image rebuild.
