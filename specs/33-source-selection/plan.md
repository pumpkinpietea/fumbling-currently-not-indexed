# Design and implementation tasks

1. Define requirements and output semantics before implementation.
2. Implement a pure selector with strict policy validation, per-record rejections,
   conservative query filtering, whole-group conflict detection and stable output.
3. Reuse the bounded UTF-8 JSON reader; create output with exclusive write mode.
4. Test date boundaries, disallowed URLs, query preservation, duplicate groups,
   conflicting timestamps, malformed policies, CLI redaction and overwrite refusal.
5. Run portable CI locally, inspect staged changes and commit identities, then
   require successful PR CI before merge and verify main CI afterward.

Use Node built-ins. File parents are trusted local directories; this CLI is not
intended for hostile concurrent filesystem mutation. A failed write can leave a
partial new output file; never consume it unless the CLI exits successfully.

Remaining work after this slice: approved source adapters, publication-date
extraction/evidence, event-level evaluation, model generation, scheduling,
deployment authentication and explicit live activation.
