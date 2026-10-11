# Design and rollout

Use the source registry as the single allowlist for daily feeds and source validation. Keep private metadata availability separate from automatedUse. Pin article path patterns and evidence modes per publisher. Permit UTF-16LE only for explicitly configured Viet Nam News feeds; parse trusted Dublin Core creator only for Global Voices. Never accept arbitrary feed URLs or redirects.

JICA RSS descriptions contain navigation only; ignore them and use the announcement title as evidence, marking title-only provenance. Global Voices RSS excerpts are CC BY 3.0; retain the byline and render source/author/license/adaptation attribution before each summary. Its AI policy governs contributions to Global Voices, while the separate redistribution license permits adaptation. Viet Nam News publishes official RSS; use bounded factual original notes from feed excerpts, not reproduction of articles or images. This operational review is not a blanket content license.

CNA RSS terms prohibit third-party transfer; Al Jazeera and CGTN restrict automated access; Nikkei AI restrictions remain. NHK returns a challenge instead of usable news/feed data. Xinhua official RSS links returned 2017 entries. Keep these candidates inactive and record evidence. Do not bypass restrictions or silently substitute an unrelated geographic proxy.

Eight daily feeds maximum: three ANTARA, JICA, two Viet Nam News and two Global Voices. The 500-record and 1 MiB/feed limits remain. Worst collection 120 seconds plus two bounded model calls remains within the existing 600-second job. Model input/output caps remain unchanged, so incremental costs stay within the prior bounded scenario; no paid resources are introduced.

Implement policy, parser options, evidence checks, balanced relevance selection and attribution. Run synthetic regressions and real metadata-only collection, then a private trial with a distinct operator namespace so today's completed run is not overwritten. Merge through passing PR CI, build immutable main and update runtime revision. Preserve tomorrow's enabled schedule throughout rollout.

Cloud connectivity validation uses --metadata-trial with dedicated metadata-DATE markers, separate from private AI-trial markers. This permits checking the expanded feeds without deleting old trial state or invoking inference. Duplicate metadata trials for the same date still fail closed.
