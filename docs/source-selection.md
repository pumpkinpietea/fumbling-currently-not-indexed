# Offline source metadata selection

See [requirements](../specs/33-source-selection/spec.md) and
[design](../specs/33-source-selection/plan.md). This command makes no network calls.
Prepare an explicit input file, for example:

```json
{
  "schemaVersion": 1,
  "window": {"start": "2026-01-14T00:00:00Z", "end": "2026-01-15T00:00:00Z"},
  "allowedHosts": ["example.com"],
  "trackingParameters": ["utm_source"],
  "articles": [{"url": "https://example.com/news?utm_source=feed", "publishedAt": "2026-01-14T09:00:00Z"}]
}
```

The domain and date are synthetic examples, not approved source policy.

```bash
npm run select:sources -- /tmp/source-input.json /tmp/source-selection.json
```

The destination must not exist. Exit codes: 0 selection written, 1 invalid request,
unreadable input or unavailable destination, 2 incorrect arguments. Rejected
individual records are reported in the output and do not make the request invalid.
Inspect accepted groups and rejection reasons before preparing any edition.
The output preserves original URLs for provenance and a comparison URL for
metadata deduplication. Do not replace source evidence with the comparison URL.
An empty selection requires collection-health/editorial handling, not automatic
publication of a no-news statement.

Selection does not verify source dates, article bodies, facts, translations or
same-event coverage. It does not produce input directly consumable by the
[edition validator](../specs/28-edition-contract/spec.md) or
[draft renderer](news-drafts.md). Those later steps require source IDs, grounded
facts and explicit event grouping. No live generator, schedule or deployment is
activated by this command.
