# Manual RSS metadata trial

See the [requirements and source research](../specs/35-rss-metadata/spec.md) and
[implementation plan](../specs/35-rss-metadata/plan.md). Run after `npm ci`.
Create an explicit request outside the repository:

```json
{
  "schemaVersion": 1,
  "window": {"start": "2026-01-14T00:00:00Z", "end": "2026-01-15T00:00:00Z"},
  "feeds": ["antara-top-news", "antara-economy"]
}
```

The date is an example; choose the actual evaluation window deliberately.

```bash
node scripts/collect-feeds.cjs /tmp/feed-request.json /tmp/feed-report.json
```

`npm run collect:feeds -- <request> <new-report>` invokes the same CLI. The output
file must not exist. The Node CLI prints counts/codes; npm also echoes arguments.
The report is created with owner-only permissions. Keep real reports outside Git.
It contains untrusted metadata, not generated articles, verified facts or approved
public content. No article links are fetched. The example makes two requests with at most
30 seconds total network deadline, without retries or cloud/model calls. The
[source registry](source-registry.md) now provides five explicitly selectable feeds
and permits at most eight sequential requests per run.

Report fields: `collectedAt`, `complete`, per-feed `feeds` health records,
`records` metadata and `selection` from the [offline selector](source-selection.md).
Each metadata record has feedId, itemIndex, title, url, publicationDatesRaw and
publishedAt. Selector indices refer to the report's records array; original
provenance remains available when multiple feed entries share a URL.

A healthy feed with rejected or stale items is different from a failed feed.
`complete: false` produces exit 1 and a diagnostic report, even if one feed worked.
Exit 0 means the metadata trial completed, not that news is publishable; exit 2
means incorrect arguments. Invalid requests/existing output files are rejected
before retrieval. Other read/write failures exit 1. Never consume a partial file
after a write failure. The fixed registry and exact publisher host policy do not
imply adoption for automatic publishing or permission to reuse publisher content.

The current transport requires direct public IPv4 HTTPS access and standard XML
content types. Redirects, compressed bodies, private DNS results and endpoints
requiring proxies are rejected. XML parsing and all automated tests run offline;
only this explicit command contacts the publisher.

## Initial smoke evidence

On 2026-10-10, one manual two-request trial completed successfully. Top-news
returned 30 items and economy returned 20. For an explicit rolling 24-hour test
window, the selector accepted 27 URL groups and rejected 19 out-of-window items
and four links outside the exact host policy. The oldest supplied publication
metadata was 2026-09-15, so a feed fetch alone does not establish freshness or
complete daily coverage. No URLs were deduplicated in this particular sample.

These are transport/metadata observations, not factual quality measurements or
source recommendations. The raw report was kept outside Git. Remaining work:
evaluate feed coverage, reuse conditions and alternative independent sources;
obtain article-level date/evidence; evaluate event grouping and factual support;
then integrate bounded generation and an explicitly activated publishing flow.
