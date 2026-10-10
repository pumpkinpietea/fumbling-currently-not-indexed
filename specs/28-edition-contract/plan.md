# Contract and verification design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/28

## Shape

Version 1 contains schemaVersion, editionDate, window {start,end}, languages, sources [{id,url,publishedAt}], events [{id,sourceIds,facts:[{id,sourceIds}]}] and editions [{language,events:[{id,factIds,sourceUrls}]}]. IDs are short ASCII identifiers; JSON carries identities/provenance, not article bodies. UTC timestamps use YYYY-MM-DDTHH:mm:ssZ and must round-trip without calendar normalization. Source window is half-open. Source and output URL references match exactly as stored by the producer; canonicalization belongs upstream.

The pure validateEdition function collects stable path/code errors with no input values. Validate each collection/item shape before dependent checks. Reuse declared index paths for diagnostics; never construct paths from untrusted IDs. Reject unused or unreferenced source metadata rather than allowing unrelated evidence in the envelope.

CLI opens with O_NOFOLLOW, checks fstat regular-file status and reads at most 1 MiB + 1 byte to detect growth. No writes or network calls. Parse errors are generic, not native exceptions that can echo content. Output objects use stable codes; no stack traces. Parsing duplicate JSON object keys is outside this initial contract, so producers must serialize ordinary objects with unique keys. Duplicate array identities are always rejected.

## Validation mapping

AC-1/2: valid calendar/time boundaries, invalid version/shape, unique IDs and source closure tests. AC-3: missing/duplicate/unknown event/fact/language/source cases. AC-4/5: subprocess CLI tests for valid/invalid JSON, oversized files, symlinks, usage and secret-like marker redaction. npm run check:ci runs these along with existing checks. No factual-quality score is claimed.

## Rollout

Expose npm run check:edition -- <candidate.json> for explicit offline use. No scheduled workflow or production gate is wired yet: future collector/renderer and article-PR issues must invoke this contract and add semantic/content validation. No recurring cost.
