# Offline news drafts

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/31
Specification: [draft renderer](../specs/31-draft-renderer/spec.md).

The renderer accepts a version-1 request containing the [identity contract](../specs/28-edition-contract/spec.md) as candidate, plus localized edition/event titles and fact text. See the original [synthetic render fixture](../tests/fixtures/render-valid.json). It generates no news or translations and calls no external services.

## Render into a new staging directory

From the repository root, choose a destination that does not exist:

```bash
npm run render:edition -- tests/fixtures/render-valid.json /tmp/news-preview-content
```

The result contains en/article/YYYY-MM-DD-indonesia-news.md and jp/article/YYYY-MM-DD-indonesia-news.md. Every file is draft: true. Existing destinations are rejected, so use a different staging name for another run. Invalid input writes nothing; an I/O failure attempts cleanup only of the new staging root. Diagnostics contain codes/indices, not input values or local paths.

## Preview both languages

Create /tmp/news-preview.yaml locally with the matching staging roots:

```yaml
languages:
  en:
    contentDir: /tmp/news-preview-content/en
  jp:
    contentDir: /tmp/news-preview-content/jp
```

Run Hugo from the repository root:

```bash
hugo server --config hugo.yaml,/tmp/news-preview.yaml --buildDrafts --renderToMemory --bind 0.0.0.0 --port 1313 --baseURL http://localhost:1313/ --appendPort=false
```

Use the forwarded port 1313; the fixture pages are /article/indonesia-news-2026-01-15/ and /jp/article/indonesia-news-2026-01-15/. This preview replaces the article input with the staged sample; it does not copy drafts into the repository or deploy anything. A global --contentDir alone does not override this site's per-language contentDir settings. Do not commit the temporary override, rendered sample or private candidate data.

## Review and limits

IDs, known source links, source-window membership and language/fact coverage are checked before rendering. Localized fact text is literal, not Markdown/HTML or executable shortcodes. Titles reject markup/control syntax. References cannot add source links outside the accepted candidate.

This does not establish factual accuracy, translation equivalence, source rights/reliability or absence of private information. Review candidate facts and privacy before exposing a preview or creating a public branch. Any draft committed to a public branch is publicly readable. Indonesian rendering awaits actual site support. There is no publish flag, automatic content commit, article PR or production deployment in this slice.

Non-news original articles remain a separate workflow in #29 and do not need this news-specific contract. Future article-PR integration must preserve draft/semantic/privacy gates and separately authorized publication.
