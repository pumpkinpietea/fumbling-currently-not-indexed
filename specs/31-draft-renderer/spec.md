# Validated news draft rendering

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/31
Parent: #20; dependency: #28
Status: In progress

## Goal and scope

Render structured, validated news candidates into deterministic EN/JP Hugo drafts for local preview. No article generation, source/model calls, temporary-source import or publication. Indonesian is rejected until site support is implemented.

## Acceptance criteria

- AC-1: Strict version-1 request {schemaVersion,candidate,editions}. Candidate passes #28; editions contain exactly {language,title,events}, event entries exactly {id,title,facts}, facts exactly {id,text}. Require exact language/event/fact coverage and unique IDs; titles are one line <=200 characters, fact text one line <=4000 characters, all nonblank. Reject control characters and URL/link/markup syntax in titles; fact text is rendered literally.
- AC-2: Produce language/article/YYYY-MM-DD-indonesia-news.md with deterministic candidate event/fact order, stable event-ID anchors, serialized YAML metadata, common edition slug/translationKey and draft: true. Output paths and publication flags cannot be supplied by input.
- AC-3: Escape Markdown, HTML and Hugo shortcode metacharacters in body text. Source link labels are fixed translations and URLs come only from the candidate, percent-encoding Markdown-delimiter characters. Do not infer facts, confidence, impact or attribution.
- AC-4: Read bounded regular non-symlink UTF-8 JSON using the shared #28 reader. Validate all output before writing to an explicit, new staging content directory. Refuse an existing destination, including symlinks; never overwrite site content. Output only stable diagnostic codes/paths, no local paths/text. On write failure remove only the new directory created by this invocation.
- AC-5: Original fixtures/tests cover valid deterministic output and invalid contracts/identity coverage/text, markup injection, bounded input and existing-output preservation. A temporary Hugo integration build proves drafts absent by default and included with --buildDrafts, including expected source links and literal escaped text.

## Limits

This is a news renderer, not #29's general editorial workflow. A draft can contain wrong or private facts; semantic/privacy review remains required before any preview exposure or public branch. Shared input reader retains standard JSON duplicate-key behavior. Output parent is a trusted local directory; this is not isolation against another process mutating directories concurrently. No default output in content/ and no publish switch.
