# Design and tasks

Use a maximum of twenty candidates per topic and forty sources/events overall. Prefer publisher diversity, then fill distinct eligible stories. New explicit-membership events enforce twenty per rendered topic (shared items count twice across topic totals). Keep legacy limits at five for historical event shapes and schemas1–3.

Allow192KiB combined instruction/input,256KiB model JSON envelope and existing256KiB text/1MiB stream limits. Reject over-budget input before inference; never truncate source evidence or an approved edition to fit. Allow240seconds per model invocation within the unchanged600second job ceiling. Two calls and zero retries remain. Sources retain1600byte excerpts; models retain compact localized summaries. Source evidence quotes remain bounded by the total unique source pool.

Implement boundary/diversity/history/size tests, private synthetic20+20 browser fixture, staged privacy review and protected PR delivery. Build immutable runtime, deploy existing resources and verify metadata only. No live AI call or today-article rewrite is needed for a capacity configuration change; maximum-load live-model success remains unverified and depends on available evidence and account usage.
