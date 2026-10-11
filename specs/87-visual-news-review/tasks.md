# Tasks

- [x] Record the user request, issue contract and design before implementation.
- [x] Set up the bounded browser harness and durable agent procedure.
- [x] Inspect actual screenshots and repair/recheck observed defects.
- [ ] Pass privacy review, exact-head required CI, merge and verify live UI.

## Local evidence

- Current working tree based on 953fb0e955ff0a4e119c92aadd7e408ddaedb46c; Ubuntu 24.04 arm64, Chromium 156.0.8078.4, Hugo 0.147.9. Portable validation passed 138 tests plus bilingual builds and sitemap checks.
- Browser report /tmp/news-ui-review-kV7kH0/report.json: 48 successful route combinations (EN/JP, home/news/article/search, 1280x900 / 768x1024 / 375x812, light/dark), combined filters, zero/reset, keyboard focus, theme toggle, real new-tab navigation with external network blocked, headline anchors and no-JS cards.
- Actual image inspection: jp-dark-mobile-{home,news,article,search,filtered}.png; jp-dark-{source-card,article-source,empty}.png; en-light-desktop-{home,news,article,search}.png; jp-light-tablet-{news,article}.png; en-dark-tablet-{home,search}.png; jp-no-js.png. Images remain temporary local evidence, not committed baselines.
- Inspection found and corrected a broken logo reference, oversized home introduction whitespace and excessive mobile header wrapping. The final inspected captures show readable Japanese, visible flags, unclipped controls/cards and readable lower article sources. Also completed the FPT publisher mapping, full-content legacy search, Japanese breadcrumbs and ja-JP structured metadata.
- Browser coverage is Chromium only; screenshots do not certify every device or assistive technology. Required PR CI and live post-publication evidence will be recorded in issue #87 after the actual checks.
