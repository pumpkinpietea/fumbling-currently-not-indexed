# News interface

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/82

The bilingual /news/ and /jp/news/ directories render individual notes and original source links. /search/ and /jp/search/ also include other articles. Browser-only filters combine text, subject country/region and topic; search includes complete legacy article text as well as current note summaries; every card remains readable without JavaScript. Current editions have explicit front matter; older editions remain searchable as edition cards. Subject labels are lexical suggestions from the English note, shared across translations, not semantic verification.

Source badges use explicit hostname metadata in data/news_sources.json. They identify the publisher country and source kind, not the subject country or an editorial viewpoint. International sources use a globe; unknown publishers remain unlabelled. Multiple original URLs stay grouped only when the validated edition already groups them into one event. Licensed adaptations retain author, license and adaptation notice in the directory.

Dates use ISO calendar formatting and Jakarta time (WIB, UTC+7); publication and modification are separate. Japanese URLs remain /jp/ while language metadata uses ja-JP. The recorded PaperMod commit is unchanged; repository overrides provide the interface.

npm run check:ci builds both languages and validates the sitemap index, sitemap targets, alternates, robots, directory cards and source-link attributes. The canonical English sitemap is /sitemap-en.xml at the site root, matching root-level English article paths. /jp/sitemap.xml remains the Japanese URL set and /sitemap.xml indexes both. A shared Hugo XML partial preserves the standard page/date/hreflang data; Hugo resources publishes the English root copy. Firebase redirects legacy /en/sitemap.xml to /sitemap-en.xml with HTTP301. Checks enforce root namespaces, required elements, directory scope, duplicates, dates, alternate targets and reciprocal links. This does not add a presentation stylesheet or change article URLs. No search service, new infrastructure or model calls are required.


Sitemap placement correction: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/142 . The sitemap templates mirror the data fields of pinned Hugo0.147.9; review template compatibility when upgrading Hugo. Root resource publication uses the ordinary Hugo build/server, with no post-build copy script. Search Console acceptance/indexing is external and is not established by local XML validation.
