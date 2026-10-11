# Japanese news feed inventory

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/76

Checked 2026-10-11. These are personal discovery subscriptions, not new daily AI evidence sources. [Importable OPML](../config/japanese-discovery.opml) contains 20 working feeds. Official publisher pages supply every URL below. Private checks used the existing HTTPS transport: 15 seconds, 1 MiB, zero redirects/retries. Live metadata stays outside Git. No new subscription, model call or cloud resource is introduced.

The current scope remains Indonesia/SEA IT and e-commerce. Japanese domestic technology headlines alone do not qualify. Title-only matches below use the existing region AND topic filter over the feed snapshot, with no date-window restriction or semantic verification. Counts can overlap between feeds and are not publishable-event counts. Missing title keywords can miss relevant stories; zero matches does not disqualify a publisher.

| Publisher/feed | Official discovery | Feed URL | Format / items | Title scope matches |
| --- | --- | --- | --- | --- |
| ITmedia NEWS | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml | rss / 50 | 0 |
| ITmedia NEWS Overseas | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/news_foreign.xml | rss / 30 | 0 |
| ITmedia AI+ | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/aiplus.xml | rss / 20 | 0 |
| ITmedia Business Online | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/business.xml | rss / 20 | 0 |
| ITmedia Enterprise | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/enterprise.xml | rss / 50 | 1 |
| @IT | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/ait.xml | rss / 30 | 1 |
| ITmedia Marketing | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/marketing.xml | rss / 20 | 0 |
| EE Times Japan | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/eetimes.xml | rss / 20 | 0 |
| MONOist | [Official](https://corp.itmedia.co.jp/media/rss_list/) | https://rss.itmedia.co.jp/rss/2.0/monoist.xml | rss / 30 | 0 |
| Impress Watch | [Official](https://www.watch.impress.co.jp/) | https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf | RDF / 20 | 0 |
| INTERNET Watch | [Official](https://internet.watch.impress.co.jp/) | https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf | RDF / 20 | 0 |
| Cloud Watch | [Official](https://cloud.watch.impress.co.jp/) | https://cloud.watch.impress.co.jp/data/rss/1.0/clw/feed.rdf | RDF / 15 | 0 |
| PC Watch | [Official](https://pc.watch.impress.co.jp/) | https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf | RDF / 20 | 0 |
| Netshop Forum | [Official](https://netshop.impress.co.jp/) | https://netshop.impress.co.jp/rss.xml | feed_size_limit | — |
| ASCII.jp | [Official](https://ascii.jp/info/about_rss.html) | https://ascii.jp/rss.xml | rss / 30 | 0 |
| ASCII Business | [Official](https://ascii.jp/info/about_rss.html) | https://ascii.jp/biz/rss.xml | rss / 36 | 0 |
| ASCII TECH | [Official](https://ascii.jp/info/about_rss.html) | https://ascii.jp/tech/rss.xml | rss / 68 | 1 |
| JETRO Business News | [Official](https://www.jetro.go.jp/biznews/) | https://www.jetro.go.jp/rss2/biznews.xml | rss / 20 | 1 |
| IDE-JETRO News | [Official](https://www.ide.go.jp/Japanese/) | https://www.ide.go.jp/rss/japanese.xml | rss / 30 | 0 |
| IDE-JETRO Publications | [Official](https://www.ide.go.jp/Japanese/) | https://www.ide.go.jp/rss/japanese_download.xml | rss / 30 | 0 |
| VIETJO Vietnam News | [Official](https://www.viet-jo.com/) | https://www.viet-jo.com/home/rss.php | feed_response_rejected | — |
| newsclip Thailand News | [Official](https://newsclip.be/) | https://newsclip.be/feed | rss / 10 | 0 |

## Priorities and handling

- JETRO Business News is especially useful for regional policy, trade and cross-border commerce. IDE-JETRO adds lower-frequency research; it is an institution, not independent breaking-news reporting. JICA is already active under its title-only policy.
- ITmedia NEWS Overseas, Enterprise, @IT and EE Times complement regional IT reporting. [ITmedia RSS terms](https://corp.itmedia.co.jp/media/rss_condition/) restrict alteration, adaptation, publication and translation; app integration requires consultation. Keep these as personal reader subscriptions rather than automated summary evidence.
- Impress Watch, INTERNET Watch and Cloud Watch supply technology discovery. Their RSS 1.0/RDF format needs a separate reviewed adapter before the current RSS 2.0-only runtime can use it. Working retrieval is not a blanket content license.
- ASCII TECH provides another technology candidate. The [official RSS directory](https://ascii.jp/info/about_rss.html) describes reader/browser use. Public derived-content adoption requires its own original-source review.
- newsclip is a Japanese-language Thailand-based regional publication, not automatically a Japanese national viewpoint. It complements national technology outlets; source geography does not establish an editorial position.
- VIETJO is a Japanese-language Vietnam candidate. The official RSS page also lists https://www.viet-jo.com/rss/headline.rdf and a mobile route, neither tested in this trial. The tested desktop endpoint was rejected by bounded transport.
- Netshop Forum is relevant to cross-border e-commerce, but the official RSS exceeded 1 MiB. Do not raise unattended limits just to admit it; investigate narrower official feeds separately.

## Additional candidates retained

Nikkei Asia and NHK WORLD-JAPAN remain in the existing [source registry](source-registry.md): Nikkei access/AI restrictions and NHK access challenges are unresolved. NNA has strong Asian business relevance, but its inspected homepage did not expose a public RSS link; no feed or paid entitlement is assumed. MarkeZine and ECzine are relevant marketing/e-commerce candidates, but their homepages rejected this trial request; feed support remains unverified. Keep manual original links and personal search available rather than bypassing access controls.

## Snapshot limitations

ASCII and IDE-JETRO feeds contain some future-dated entries; institution feeds may include event dates. This inventory does not adopt those dates as original news-publication evidence. Twenty successful feeds contained 569 entries and 4 title-only scope matches before cross-feed deduplication. Existing daily production remains ten reviewed feeds; importing OPML changes a personal reader only.
