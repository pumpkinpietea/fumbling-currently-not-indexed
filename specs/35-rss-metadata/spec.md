# Bounded RSS metadata trial

Issue: #35. Parent: #20. Related: #19, #23, #33.

## Requirements and acceptance criteria

The request contains exactly `schemaVersion: 1`, `window` (the selector's UTC
half-open interval) and `feeds` (one or two unique registered IDs). The trial
registry contains `antara-top-news` and `antara-economy`, pointing to the official
HTTPS feeds listed below. No arbitrary endpoints, discovered feeds or model URLs.
This registry enables manual metadata evaluation, not automatic publication.

Parse RSS 2.0 with one direct channel. Accept only direct channel/item fields
`title`, `link`, `pubDate`; preserve item order, original URL and publication date
text as `publicationDatesRaw` (including duplicates), normalized UTC publication
seconds, feed identity and item index. Titles
are untrusted metadata, not evidence for detailed summaries or instructions.
Missing/ambiguous/duplicate publication fields become null timestamps and are
rejected by the selector. Unknown elements cannot substitute for required fields.
No article bodies, descriptions, images or raw feeds are persisted.

Support explicit numeric RFC 822 offsets plus GMT/UT; require four-digit years,
valid calendar/time values and consistent optional weekday. Reject timezone-free,
ambiguous named zones, leap seconds and impossible dates. Do not use feed build
or retrieval time as article publication time. Preserve original date text for
later date-evidence checks; feed dates are claims, not verified body metadata.

Resource limits: 1 MiB per response, XML depth 32, 10,000 elements, 200 items per
feed, URL 4,096/title 500/date 100 characters. Reject DTDs, invalid UTF-8, invalid
XML and nested markup in selected fields. Exceeding limits invalidates that feed.
Use an exactly pinned SAX parser, with no entity resolution or HTML extraction.

Transport: sequential at most two HTTPS requests, 15 seconds each including DNS,
public IPv4 resolution pinned to the request, certificate/hostname verification,
no redirects, proxies, retries, cookies, authorization, or article-link fetches.
Reject non-200, unsupported compression/content type and oversized responses.
No IPv6 fallback in this first trial. Network tests must use injected transports,
not live endpoints. Normal CI remains offline.

A report preserves collectedAt, feed status/item count/error code, metadata records
and the existing selector's result. Fixed exact publisher hosts and an empty
tracking-removal policy are deliberate conservative trial settings. Feed failures
produce `complete: false` and a nonzero CLI exit even if other feeds succeed.
An empty healthy selection is only metadata-empty, never a no-news statement.

Write only a new explicit private report file; never overwrite or print source
content/paths/errors from remote servers. Reject an existing destination before
any network access. Success exits 0, failed/partial collection or I/O exits 1,
incorrect arguments exit 2. Invalid requests make no requests and write nothing.
No model calls, billable resources, scheduling, site modification or deployment.

## Source status

Official pages checked on 2026-10-10:

- [ANTARA RSS directory](https://www.antaranews.com/rss?mobile=true) lists
  [top news](https://www.antaranews.com/rss/top-news.xml) and
  [economy](https://www.antaranews.com/rss/ekonomi.xml).
- [ANTARA usage terms](https://www.antaranews.com/ketentuan-penggunaan)
  restrict content reuse; RSS availability is not a blanket reuse license.
- [CNA RSS](https://www.channelnewsasia.com/rss) remains a comparison candidate;
  it is not wired into this trial.
- [RSS 2.0 specification](https://www.rssboard.org/rss-specification) describes
  publication date metadata. This adapter intentionally supports a strict subset.
- [saxes upstream](https://github.com/lddubeau/saxes) documents SAX parsing.

Public summaries, commercial/donation-supported reuse and body extraction require
separate source-policy evaluation. Do not copy publisher content into test fixtures
or commit live trial reports. No source adoption or legal conclusion is implied.
