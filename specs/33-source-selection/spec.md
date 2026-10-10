# Offline source selection

Issue: #33. Parent: #20. Related: #23, #28, #31.

## Requirements and acceptance criteria

Accept a versioned request with exactly `schemaVersion`, `window`, `allowedHosts`,
`trackingParameters`, and `articles`. Window has exactly `start` and `end`, using
valid UTC seconds (`YYYY-MM-DDTHH:mm:ssZ`) with start before end. Hosts are unique,
lowercase DNS names; matching is exact, without implied subdomains. Tracking
parameter names are unique, case-sensitive ASCII identifiers. Both policy lists
are explicit; tracking names may be empty. Articles may be empty, at most 500.

Each article has exactly `url` and `publishedAt`. Reject malformed records,
HTTPS URLs with credentials, fragments, whitespace, non-default ports or hosts
outside policy, and missing/invalid timestamps. Dates must be inside [start, end).
Never infer dates from URL paths or collection time.

For structurally valid, allowed URLs with valid dates, group by WHATWG serialized
URL after removing only configured query parameter names. Preserve other raw
query components, their order and duplicates. Preserve every original URL and
input index in accepted groups. Dates conflicting within a group quarantine all
members, including otherwise out-of-window members; do not choose a convenient
date. For consistent groups, retain the earliest input index as representative.
Output ordering follows representative input order. Out-of-window records and
invalid records receive indexed reason codes. An empty result is not evidence
that no news exists or collection succeeded.

Output includes schemaVersion, window, accepted groups (`normalizedUrl`,
`publishedAt`, `originals` with `index`/`url`) and rejected (`index`, `code`).
This output is not the edition contract: source IDs, evidence, event grouping,
and localized facts still need separate preparation and validation.

The CLI reads at most 1 MiB using the shared regular-file reader, writes only a
new explicit output file, and prints counts/error codes rather than source data.
No API calls, new dependencies, model costs, site writes or publication.

## Limits

Normalization is a local comparison key, not a publisher-declared canonical URL.
Different URLs about the same event remain separate. Dates are supplied metadata,
not verified publication evidence. Tracking policy and actual source adoption are
not selected by this feature. Duplicate JSON keys follow standard JSON parsing.
