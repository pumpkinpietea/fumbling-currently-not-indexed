# Design

Extend reviewed source registry with Yahoo category RSS and title-only JETRO. Normalize only source=rss on Yahoo article links before original-host/date selection. Extract the credited provider from the final title suffix and validate it again in the bundle. Render source attribution explicitly as Yahoo distribution plus provider, with a distribution badge rather than claiming original publisher nationality.

Add a bounded Atom parser/Google-wrapper original-link normalizer and private optional alert collector. Persist owner subscriptions under auth/alerts.json, which is excluded from evidence retention. Provide a private local configuration uploader and exported-email reader; neither accesses a mailbox or configures a Google account. Missing subscriptions are valid disabled state.

Reconcile Google/Alerts candidates against accepted original RSS records. Direct matches use canonical URLs; unique title hints only reorder independent eligible records, never prove Google-link identity. Store counts and match categories privately. Generate/review from official records only; maintain unchanged replay and publication controls.

Keep feed total below 14 and total records below 500; optional alert collection is separate and bounded. Add no generic URL/article fetcher, OAuth scope, service, retry or paid model fallback. Validate source and private-boundary failure cases, inspect actual attribution rendering and deploy only validated main.
