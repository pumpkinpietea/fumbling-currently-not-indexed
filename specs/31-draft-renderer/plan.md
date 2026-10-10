# Rendering design and verification

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/31

## Data and output

Keep #28 candidate format unchanged. A render request wraps it with localized titles and fact text. Reuse the pure reference validator first, then require exact localized language/event/fact identity sets. Render accepted candidate order, not model array order. Body content is plain text converted to numeric HTML entities for syntax-significant characters; known source URLs are emitted in explicit Markdown links with delimiters percent-encoded. Titles reject markup/link/control syntax and use YAML serialization, never string interpolation as front matter.

Front matter: localized title, editionDate, slug indonesia-news-YYYY-MM-DD, translationKey with the same slug, categories [Indonesia, News], draft true. Deterministic sections: localized digest heading, stable event headings, fact bullets and per-event source links. A source is cited only from that accepted event; no guessed publisher name or confidence label.

Export a pure renderDrafts function plus writeDrafts CLI support. Extract the existing bounded UTF-8 regular-file reader from check-edition.cjs so both CLIs use it without weakening #28. Build a file map in memory; create the requested staging directory exclusively, then fixed language/article directories/files. Existing destination fails; cleanup is scoped to the newly created root. Structured errors contain indices/codes only.

## Verification and rollout

AC-1/3: schema, identity, blank/overlong/control/title syntax tests; URL/Markdown/shortcode body injection stays literal. AC-2: parse front matter with yaml, assert draft true/path/slug/translationKey, deterministic reorder and accepted sources. AC-4: CLI temp-directory tests for no-overwrite and invalid-input no-write; existing #28 reader tests remain passing. AC-5: temporary Hugo build using current config/layout/theme paths and staged content, with/without --buildDrafts; inspect expected HTML and absent injected tags/links. Tests run under existing check:ci.

Expose npm run render:edition -- <render-request.json> <new-staging-directory>. An original fixture enables offline demonstration. The site has language-specific contentDir settings, so preview uses a temporary YAML override for both language roots together with --buildDrafts (a global --contentDir alone is insufficient). Never write generated samples to repository content, and never deploy from tests. This slice adds no dependency or recurring cost. Future article-PR integration must call these validators and add factual/privacy gates before committing candidates.
