# Offline edition identity and provenance gate

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/28
Parents: #20 and #23
Status: In progress

## Goal and scope

Add a versioned structured candidate contract before implementing generation/rendering. Detect the observed missing-language entries and invented/mismatched references deterministically. Use Node built-ins, no dependencies, model/network calls or temporary source imports.

## Acceptance criteria

- AC-1: Strict version-1 envelope with valid calendar editionDate, increasing UTC window, explicit nonempty languages (en/jp/id), nonempty sources/events and editions; reject extra/missing properties and malformed values.
- AC-2: Unique source/event IDs, globally unique fact IDs and language identities. Source URLs are distinct credential-free HTTPS URLs without fragments; publication time is in [start,end). Event sources exist, every source is used, every fact cites one or more sources within its event, and event sources equal the union of fact sources.
- AC-3: Exactly one edition for each enabled language, containing each accepted event exactly once, all its fact IDs exactly once and its original source URL set exactly once. No unknown references or fabricated output links.
- AC-4: Read-only/offline CLI accepts one regular non-symlink JSON file <=1 MiB. Exit 0 only on valid input; exit 1 for validation/reading errors and 2 for usage. Output is JSON with boolean valid and error paths/codes, never input values or local filenames.
- AC-5: Original fixtures verify successful multilingual input and failures for omissions, duplicates, unknown IDs/links, schema/date/window errors, malformed/oversized/symlink input and private-value-free diagnostics. Existing CI runs the tests.

## Boundaries

This gate checks references only. Fact text, Markdown, translation semantics, freshness policy/timezone selection, source reliability, grouping accuracy and privacy are not proved. No-news/degraded classification and the renderer remain separate. An id edition can pass this contract while the current Hugo site still lacks Indonesian support. Calendar editionDate is caller-specified and not inferred from the UTC interval; scheduling policy will own that mapping. Live publication is not enabled.
