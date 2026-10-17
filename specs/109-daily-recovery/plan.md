# Design

Issue: https://github.com/pumpkinpietea/fumbling-currently-not-indexed/issues/109

Keep canonical punctuation handling and legacy event behavior. For explicitly declared schema4 events, compare exact canonical numeric values after bounded lexical normalization: standalone English/Indonesian cardinal words up to nineteen, month names, explicit numeric million/billion (juta/miliar), Japanese numeric magnitude groups (man/oku), per-gram denominators, and on-hour clock notation. Use decimal-string/BigInt arithmetic, not floating-point rounding, for scale multiplication. Numeric values alone cannot prove units, dates, factual meaning or translation; retain independent review and source inspection. No arbitrary semantic equivalence or relaxed unsupported-value gate.

Clarify generation formatting to reduce avoidable surface differences. Recover each missing date from its original evidence with at most four operator inference calls overall: October15 generation/review, October16/17 review of retained candidates. Use the global lease and authoritative rotating session; preserve original failed artifacts and source hashes. Remove unsupported or irrelevant items before review, with explicit private audit. Historical source windows never use current RSS as substitute evidence.

Publish reconstructed populated topic pairs through a protected PR. After live verification, create the missing run history records only. Roll out immutable validated main and run metadata-only verification without normal production replay.
