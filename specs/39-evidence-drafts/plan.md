# Design and tasks

1. Specify source integrity, exact citation spans, claim/localization checks,
   output audit fields and the limits of deterministic evidence validation.
2. Implement a pure evidence-to-renderer adapter with strict bounded records;
   derive the edition candidate instead of accepting redundant source-link output.
3. Validate localized coverage using the existing renderer and conservative
   numeric-string equality; produce a hash-based audit without raw source records.
4. Implement exclusive private staging and a redacted CLI, preserving existing
   paths and using best-effort cleanup only for newly created output.
5. Add original synthetic bilingual fixtures and meaningful tests for hash/span
   tampering, missing evidence, declared snippet input, invented/omitted numbers,
   localization identity violations, emitted hashes and filesystem behavior.
6. Run the synthetic input through the CLI and full portable validation. Review
   exact staged content/identities, require PR CI before merge and verify main CI.

This connects prepared evidence and localized text to previewable drafts. It does
not retrieve article bodies, select a paid model, generate text autonomously or
approve publishing. Follow-ups: source access/reuse and date evidence, real-news
semantic review and grouping, bounded model integration, delivery authentication
and explicitly agreed live scheduling/content merge policy.
