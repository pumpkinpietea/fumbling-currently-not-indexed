# Bilingual news UI

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/82
Status: Implementing

## Goal
Make news sources, dates and archived notes easy to scan and find.

## Acceptance criteria
Flags and country names use explicit publisher metadata; unknown/international sources are not guessed. Source types are visible. Current/future notes have structured subject-country/topic metadata and grouped original sources. Home entries link to individual headlines; a bilingual static directory supports combined filters and text search. Dates use Asia/Jakarta with separate modification time. Japanese navigation and ja-JP metadata are corrected while /jp/ stays. Built/live sitemaps, alternate links, robots and no-JS content are verified.

## Authority and constraints
The user approved all proposed improvements on 2026-10-11 and requested sitemap verification. Scoped PR/CI/merge/publication is authorized. No theme upgrade or new paid service. Total GCP budget is USD10/month; existing spend remains unmeasured. Do not replay completed dates or independently refresh old credentials.
