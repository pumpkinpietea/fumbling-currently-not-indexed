# Design and tasks

1. Record source research, requirements, boundaries and acceptance criteria.
2. Add a pinned SAX dependency; implement pure bounded RSS/date parsing.
3. Implement fixed-endpoint HTTPS transport with DNS address validation/pinning,
   timeout and size limits; inject dependencies for deterministic offline tests.
4. Integrate metadata with the existing selector. Preserve health separately from
   item rejection and original date evidence separately from normalized dates.
5. Add a manual CLI with exclusive local report creation and redacted summaries;
   document request, output, limits and remaining source-policy decisions.
6. Run synthetic regression tests and one bounded read-only two-feed smoke trial.
   Keep raw responses/reports outside Git; record only aggregate results.
7. Review exact staged content/identities, require PR CI before merge and verify
   main CI. Record evidence in the issue and Project.

No publisher diversification or semantic evaluation claims follow from a single
publisher trial. Feed windows may be shorter than a full day; measure coverage
before selecting a scheduler. Failed and partial reports are diagnostic artifacts,
not safe input for unattended publishing. Clock validity is the caller's concern.
The local parent directory is trusted; exclusive creation is the overwrite guard,
not protection against hostile concurrent directory replacement. A disk-write
failure may leave a partial new report; consume only after successful completion.
