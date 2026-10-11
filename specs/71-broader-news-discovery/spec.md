# Broader sources and discovery

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/71

## Requirements

Add current official ECNS (China News Service) and Mehr News Agency RSS to the personal SEA IT/e-commerce factual-note pipeline. Preserve publisher identities without treating outlet location as a viewpoint or corroboration. Use official RSS excerpts only; no article bodies/images, copied paragraphs or blanket reuse-license claims. Rights/access findings are distinct from connectivity.

ECNS uses China-local wall-clock dates without an offset and HTTP links for HTTPS-capable articles. Enable strict +08:00 conversion and exact-host HTTP-to-HTTPS normalization only for this reviewed feed, retaining raw publication dates. No general insecure transport or date guessing. Metadata-only markers include the runtime revision prefix, permitting one non-AI connectivity check per revision/date without deleting earlier evidence. Invalid calendar values, wrong hosts and unknown date formats remain rejected. Bound collection to 12 feeds/500 records while keeping three selected records, two model calls, one task, 600 seconds and zero retries.

Document a low-cost discovery architecture using official RSS, Google News RSS candidate search, optional Feedly Free OPML and manually saved original URLs. Discovery does not grant reuse rights or replace original-source dates/evidence. Paid Feedly/API integrations remain inactive. Publish the previously inspected October 11 Viet Nam News EN/JP note via an operator PR without replacing daily no_news markers or a private trial bundle.

## Acceptance

Tests cover feed-specific local dates, leap days, offset boundaries, HTTPS-only normalization and evidence source binding. Verify real feeds, all existing checks, exact-head PR/main CI, immutable runtime deployment and cloud metadata. Verify today's live EN/JP URLs and external-link behavior. Record future scheduled-run verification separately under #55.
