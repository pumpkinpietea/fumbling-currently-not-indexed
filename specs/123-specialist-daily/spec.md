# Specification

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/123

## Goal and authorization
The owner requests unattended daily collection and publication for worldwide cybersecurity and developer-tool news, including social discovery for both. Connect the reviewed #120 collectors to the existing bounded Cloud Run/Scheduler and protected publication consumer; preserve the Indonesia/general and SEA-tech editions.

## Requirements and acceptance criteria
1. All four topic EN/JP pairs share at most two model calls, 40 distinct sources/events, 20 events/page, 600 seconds, one CPU/512 MiB, zero retries, existing locks and no paid fallback. Empty topics produce no pages.
2. Official specialist sources use their own bounded hourly retention and seven-day UTC-date lookback ending before the edition date. Preserve original date precision/basis; validate all evidence against reviewed registry. Prior publication URL/history suppresses repeated notes, including October 17 specialist articles.
3. Private Hacker News discovery runs for both streams with bounded rotating hourly queries. It never supplies model/public facts, dates or claims of global popularity. Source/social failures and incomplete coverage are explicit; healthy specialist feeds can contribute without blocking healthy existing news, but invalid retained evidence fails closed.
4. Schema-versioned bundles bind all four reconstructed topic files, trusted source policies, quotes, translation numbers and one skeptical independent review covering every used source plus any cited cyber observations. Old schemas retain their contracts.
5. Compact generation requests/output instructions reduce transport pressure without increasing existing input/output/SSE limits or retrying rejected drafts. ASCII ordinal formatting avoids today's known failure; genuine conflicts still block.
6. Use existing cloud resources and reviewed budget; publish costs/assumptions, run offline failure/idempotence/consumer tests and CI, perform a private live four-topic rehearsal with source inspection/browser review, roll out immutable main image and verify hourly collection plus consumer compatibility. Do not overwrite today's failed markers or October 17 articles.

## Design
Add a specialist runtime/archive module rather than putting HTML/Atom sources into legacy RSS contracts. Capture official metadata under independent create-only 1 MiB hourly objects and private social objects, retaining existing 14-day lifecycle. Extend the capture application deadline to 110 seconds (Cloud Run remains 600); bound each specialist fetch to eight seconds/four concurrent requests and social to two selected queries, one per stream. Daily generation reads live specialist sources plus at most 32 hourly observations; previous publication history provides durable repeated-item suppression for 14 days. Share the two inference calls with existing editions using an explicit schema 6 envelope and split trusted rendering/validation. Add create-only bootstrap history for the already-live October 17 specialist edition after verifying its existing evidence. Runtime activation uses existing WIF image build, immutable Cloud Run image and matching approved revision variable; no IAM/protection/service changes.

## Tasks
Write specs, implement archive and mixed bundle/runtime contracts, regression-test partial sources/history/social isolation/tampering/empty topics/consumer, run real private bounded rehearsal and visual review, protected merge/main validation/Hosting, immutable rollout and cloud metadata/capture verification. Record limitations and first unattended run status explicitly.
