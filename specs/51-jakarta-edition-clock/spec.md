# Jakarta edition clock

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/51
Status: Implementation

## Acceptance criteria

- AC-1: Versioned configuration records the confirmed start 2026-10-11 at 07:30 Asia/Jakarta, initial EN/JP output and bounded run limits. Activation remains false until #47 live prerequisites pass.
- AC-2: Derive edition date from one captured instant in Jakarta, never the UTC date. Normal runs before the first start or before 07:30 are rejected.
- AC-3: Compute the previous Jakarta calendar-day half-open window in strict UTC timestamps, including month/year/leap transitions. Explicit replay dates may bypass normal timing but must be real, nonfuture calendar dates.
- AC-4: Return timing metadata separately from activation. Computing a window cannot start a timer, invoke a model or publish. Test exact start, UTC date boundaries and malformed replay/config inputs.

## Design and tasks

Use a pure function with an injected instant, fixed Asia/Jakarta configuration and Intl local date parts. Jakarta has UTC+07:00 throughout the supported 2020–2099 date range. Validate strict calendar dates through round-trip conversion; subtract one day in UTC for the previous local day, then convert local midnight by subtracting seven hours. Expose a read-only JSON CLI and no cron/service registration.

- [x] Implement configuration, clock and replay validation.
- [x] Run deterministic clock tests and portable validation.
- [ ] Review privacy, open PR and merge passing CI after the active manual release finishes.

Validation: npm run check:ci passed (96 tests, EN/JP builds); updated documentation checks passed (64 documents, 2 forms).
