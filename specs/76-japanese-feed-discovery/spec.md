# Japanese source discovery

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/76
Status: Implementing

## Goal
Collect Japanese-language publishers and institutional sources for Indonesia/SEA IT and e-commerce discovery.

## Acceptance criteria
- AC-1: Record official discovery pages, feed URLs, handling boundaries and dated connection evidence for a broad candidate list.
- AC-2: Provide an OPML file of working feeds for personal subscriptions.
- AC-3: Run bounded private metadata checks and report aggregate region/topic candidate counts. Keep live article data outside Git.
- AC-4: Preserve daily source/model/request limits and introduce no paid resources. Discovery inclusion does not activate AI or public reproduction.
- AC-5: Pass repository validation and exact-head PR CI before merge.

## Decisions and authority
The user requested broad Japanese feed collection on 2026-10-11. The existing SEA/Indonesia IT/e-commerce scope remains. Japanese-language regional publications complement Japanese domestic technology outlets; institutions are identified separately. Routine local work and scoped merges are authorized. Restricted feeds remain personal discovery subscriptions. No new cloud resources or inference calls are needed.

## Open questions
Original-source reuse/access reviews remain necessary before automated evidence adoption. Working feeds can use RDF/Atom formats unsupported by the current strict RSS 2.0 runtime parser; inventory tests do not imply runtime compatibility.
