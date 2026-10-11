# Private Google News personal reader

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/74

The user confirms the site is personal/noncommercial and requests Google News RSS use. Add two fixed bounded RSS searches to a private personal candidate reader: SEA/Indonesia IT/e-commerce and Chinese/Middle Eastern outlet coverage of the same scope. Preserve Google feed-use restrictions: private reader display only, never Google-derived model evidence or public RSS reproduction. Candidates need original publisher verification before an editorial article can be prepared. Feed dates are index/feed timestamps, not verified original publication dates.

Save private HTML/JSON under evidence retention during CLI daily or metadata-only execution; scope-filter candidates and preserve original Google links with safe new-tab attributes. Failure is recorded without blocking independent official-source generation. At most two 15-second/1MiB requests, 200 parsed records per feed and no retries. No AI/credentials for this work, no new resource/subscription, existing 600-second/two-model-call bounds.

Tests verify regional/topic conjunction, unsafe-link rejection, HTML escaping, failure handling and private/public/model isolation. Run live RSS and cloud metadata checks, passing exact-head PR/main CI and immutable rollout. Also correct October 10 EN/JP article title dates to the existing generator's YYYY-MM-DD form, retaining publication timestamps and content.
