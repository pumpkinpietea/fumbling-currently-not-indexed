# Tasks and handoff

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/43

- [x] Confirm source breadth and inspect official feed discovery pages.
- [x] Specify request compatibility, per-feed host isolation and resource bounds.
- [x] Implement registry and collector adaptation.
- [x] Add regressions and run portable checks: 76 tests and EN/JP builds pass.
- [x] Run a bounded private metadata trial; real output stays outside Git. ANTARA/CNA yielded 90 records, 57 accepted groups and 32 rejected records for the selected 24-hour interval. Initial English JICA requests were rejected redirects to a 2023 archive; current Japanese JICA yielded 30 known-date records, all outside the interval. JICA full-month adapter fixed date recognition without altering raw evidence.
- [ ] Review staged privacy and identities, open PR, verify required CI and merge.

## Handoff

No source body acquisition, model request, public article or scheduled collection is implemented. Schedule, language/cost policy and production IAM activation questions remain pending. Site positioning is flexible; public personal operation alone is not assumed to establish publisher permissions.
