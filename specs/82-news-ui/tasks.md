# Tasks

- [x] Record issue contract, requirements and design before implementation.
- [x] Implement and verify local behavior (133 tests and built HTML/XML checks).
- [x] Pass privacy review and exact-head PR CI, merge and verify rollout.

PR #84 (head 8f20891) passed Validate 38130423994; main 6d1e1da passed Validate 38130492965 and Hosting 38130520299. Live EN/JP maps each contained 48 canonical URLs, including current articles, news and search. XML language alternates, robots, source new-tab attributes and decoded Japanese headline anchors were verified. Build-context correction PR #86 passed required Validate 38131000455; main 953fb0e passed Validate 38131054252, runtime build 38131055811 and Hosting 38131073405. Runtime/NEWS_RUNTIME_REVISION was deployed to 953fb0e955ff0a4e119c92aadd7e408ddaedb46c, immutable image sha256:a07300ce5abc7e12701ddbe7e16f566c20a5e1cc3b46b01fb973d84d2dd46abc. Initial build 38130913852 failed on the metadata allowlist and did not deploy. Visual follow-up and additional language metadata checks are tracked in #87.
