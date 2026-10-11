# News interface

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/82

The bilingual /news/ and /jp/news/ directories render individual notes and original source links. /search/ and /jp/search/ also include other articles. Browser-only filters combine text, subject country/region and topic; search includes complete legacy article text as well as current note summaries; every card remains readable without JavaScript. Current editions have explicit front matter; older editions remain searchable as edition cards. Subject labels are lexical suggestions from the English note, shared across translations, not semantic verification.

Source badges use explicit hostname metadata in data/news_sources.json. They identify the publisher country and source kind, not the subject country or an editorial viewpoint. International sources use a globe; unknown publishers remain unlabelled. Multiple original URLs stay grouped only when the validated edition already groups them into one event. Licensed adaptations retain author, license and adaptation notice in the directory.

Dates use ISO calendar formatting and Jakarta time (WIB, UTC+7); publication and modification are separate. Japanese URLs remain /jp/ while language metadata uses ja-JP. The recorded PaperMod commit is unchanged; repository overrides provide the interface.

npm run check:ci builds both languages and validates the sitemap index, sitemap targets, alternates, robots, directory cards and source-link attributes. Hugo intentionally places the English sitemap at /en/sitemap.xml while English articles use root paths. No search service, new infrastructure or model calls are required.
