# Daily news publishing contract

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/20
Status: Proposed architecture; product choices and live execution pending

## Goal and verified context

Generate a concise, source-backed Southeast Asia IT and e-commerce news digest every day and publish consistent language editions through validated main-only delivery. The existing collector ran locally; no cloud migration is assumed. PR validation and solo-development protection are implemented by #22. PR #41 implements disabled-by-default main delivery; live authentication, generation, scheduling and Indonesian support remain pending.

## Scope

Specify execution, contracts, costs, failure recovery and staged rollout. Reuse ideas from the local scripts, without importing credentials, raw debug data or copied source. #23 owns news quality and source evaluation; #18 owns deployment. Donations, monthly financial transparency and social distribution are independent follow-ups and must not delay the initial pipeline.

## Acceptance criteria for implementation

- AC-1: A configured edition date and IANA timezone determine a fixed half-open collection interval, captured once per run. Manual replay accepts an explicit edition date. Missing schedules/windows prevent live activation.
- AC-2: Preserve source provenance and evaluate freshness, relevance, event identity and supported claims under #23. Quarantine unknown dates, insufficient evidence and ambiguous grouping; never fill an arbitrary article quota with weak stories.
- AC-3: One accepted event/fact set drives every enabled language. Exact event coverage and original-source references must agree. Render into the existing content/en/article/ and content/jp/article/ conventions; verify actual front matter/permalinks before rollout. Indonesian requires a separately validated site change.
- AC-4: One edition creates at most one active article PR. Repeated runs do not duplicate events, overwrite a published edition or replace a complete candidate with partial output. Corrections are explicit revisions with evidence.
- AC-5: Generation has no production credentials. An article PR may change only approved date-specific content and sanitized manifests, and must pass trusted validation. Unattended merge remains disabled until explicitly authorized under a content-only contract.
- AC-6: Production deploys only a validated main revision through #18. Failed generation/validation/deployment retains the last known good site and records the failing edition/revision for bounded recovery.
- AC-7: No eligible events is a successful no-publication outcome; incomplete or failed retrieval is a degraded/failed outcome, not a false no-news result. Record coverage and source failures without publishing debug data.
- AC-8: Candidate limits, timeouts, concurrency, retry counts, token reservations and retention are finite. A configured budget stops further paid calls; alerts alone are not a hard cap.
- AC-9: Offline regression scenarios, a bounded manual live evaluation and a draft-only trial precede unattended activation. Factual/source evaluation is distinct from structural CI.
- AC-10: Operator can disable scheduling/merge/deployment independently, replay an edition without new model calls when validated inputs exist, and trace the deployed Git revision. Failure reporting contains no credentials or personal identifiers.

## Site purpose

The developer currently describes the site as a personal memo site, but explicitly wants positioning to remain flexible and source discovery to be broad. It remains publicly accessible at its existing production URL; this is not a request to make it private or to republish source articles. Prefer short original factual notes and attributed comparisons with source links. Personal operation does not by itself establish permission under each publisher's personal-use terms. Assess access, model input and public output separately; do not treat all factual reference as prohibited.

## Confirmed editorial scope

On 2026-10-10 the developer selected Southeast Asia IT and e-commerce news. The earlier Indonesia general-news focus is superseded. Include technology products/infrastructure, regional digital businesses and online commerce when there is a concrete Southeast Asia connection. General politics, unrelated global technology and routine shopping promotions are outside the initial scope. Country quotas and source adoption remain undecided; do not infer regional coverage from the existing two Indonesian trial feeds.

The developer also requested Chinese sources, Middle Eastern sources including Al Jazeera, and comparisons of Western and other coverage of the same event. Nikkei Asia and NHK WORLD-JAPAN are proposed Japanese media candidates. JICA and similar low-frequency institutional sources are candidates for relevant new announcements and dated background context. Source location is metadata, not proof of a uniform viewpoint. Attribute reported claims and framing to specific articles, distinguish corroborated facts from disputed claims, and disclose missing comparison coverage rather than inventing an opposing position. Syndicated copies do not count as independent perspectives.

See [source candidates and access findings](source-candidates.md). Candidate inclusion is not activation or permission to retrieve/reuse publisher content.

## Confirmed production timing

On 2026-10-10 the developer requested today's article publication and daily production starting 2026-10-11 at 07:30 Asia/Jakarta (00:30 UTC, 09:30 Asia/Tokyo). Use the previous Jakarta calendar day as the proposed collection window; initial publication is a separately reviewed bootstrap edition. Deployment authentication and unattended generation must be verified before claiming the schedule is active. See [production start](../47-production-start/spec.md).

## Remaining proposed defaults

Use Actions initially if approximate daily timing is acceptable. Proposed limit: at most 10 accepted events, fewer when evidence is insufficient. Start with EN/JP, then add Indonesian after coverage tests. Prefer supported low-cost text models selected through offline/live evaluation rather than reusing the retired historical model.

Collection window, enabled languages, model/free-tier data handling and automated article merge conditions require decisions. Total GCP costs are authorized up to USD 10/month including existing resources; separate AI/API spending is not authorized. Questions were sent; absent answers remain proposals. No billable resource, live model call, production deployment, donation account or social posting is authorized by this document.
