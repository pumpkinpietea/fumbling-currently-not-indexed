# Visual browser review

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/87

UI work requires two forms of evidence: deterministic build/behavior checks and actual inspection of browser-rendered screenshots. A browser tool or skill is a way to perform this work; its name does not substitute for the inspection. Official [OpenAI frontend guidance](https://learn.chatgpt.com/use-cases/frontend-designs) recommends Playwright to open the app, compare screenshots across sizes and iterate. Use an exposed View/Browser or Playwright interactive harness when available; this session did not expose one, so the repository supplies a local fallback. A separate browser plugin/account is not required.

## Setup and execution

Run npm ci, then npx playwright install --with-deps chromium to install the pinned development-only browser and system dependencies. Linux Japanese glyphs and emoji require appropriate fonts (the Playwright dependency installer includes CJK/emoji fonts). Browser download and dependencies use local disk/network, with no paid service or recurring GCP resource. Dependencies are not installed by the portable npm run check:ci or the production runtime.

Run npm run check:ui. For a temporary browser cache, prefix both browser installation and the command with PLAYWRIGHT_BROWSERS_PATH=/tmp/news-ui-browsers. The harness builds the current working tree in a new owner-only temporary directory, serves it only on loopback, and runs Chromium with external requests blocked. It captures EN/JP home, news directory, current article and search at 1280x900, 768x1024 and 375x812 in light/dark. It exercises combined filters, no-results/reset, headline anchors, source new tabs and no-JS readability; it checks browser errors, broken local resources/images and horizontal overflow.

The command prints an output directory containing report.json and screenshots/. Open the PNGs through the image viewer or the available browser harness, including representative desktop/tablet/mobile images for every changed layout/language/theme plus interaction states. Inspect readability, Japanese glyphs, flag placement, contrast, wrapping, spacing, clipped navigation and controls; inspect lower-page areas when relevant. The report deliberately says visual inspection is pending: the command cannot certify that an agent or developer looked at its images. Record the actual inspected images and findings in the PR. Correct problems and rerun the affected checks before merge.

After publishing main, run npm run check:ui -- --live for the same read-only smoke check against the fixed production URL, and inspect representative live screenshots. Only the site itself is fetched; source clicks open a separate page whose network request is blocked after confirming the new-tab navigation. No third-party article or account is accessed. The real deployment revision must be recorded separately from the local Git revision in the report when they differ.

## Evidence and limits

Record the revision/dirty state, browser version, environment, routes, sizes, themes, interactions, actual screenshot inspection findings and remaining limitations. Screenshots/traces stay outside Git by default. Use an isolated browser profile; do not capture auth/session files or private readers. Do not commit a screenshot baseline without reviewing content and privacy. [Playwright visual comparison guidance](https://playwright.dev/docs/test-snapshots) explains that rendering varies across environments; pixel baselines should be deliberate, stable and reviewed rather than blindly updated. This harness uses screenshots plus explicit review, not an unreviewed golden-image gate.

The fallback initially covers Chromium and this news interface; it does not claim Safari/Firefox, screen-reader, every viewport or factual article correctness. Extend affected routes/states for other UI work. Optional local visual checks remain distinct from portable CLI CI; passing npm run check:ci alone does not meet the AGENTS.md UI review requirement.

For the two-edition renderer, use npm run check:ui -- --preview-bundle /absolute/private/bundle.json. This validates/reconstructs the bundle and overlays it into a temporary copy of content; future pages are enabled only in that preview. The repository content stays untouched. Only article layouts present in the validated bundle receive browser checks and screenshots; schema 3 omitted topics have no preview route; synthetic preview bundles and private trial evidence must never be committed or published.
