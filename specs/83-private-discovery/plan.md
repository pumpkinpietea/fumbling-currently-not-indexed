# Design

Use the existing HTTPS transport with explicitly supported content types and strict byte/timeout/DNS/redirect rules. Parse fixed official pages/feeds into private link candidates; prefer title-only metadata, not article bodies. Rotate sources and watchlist terms deterministically. Reuse private evidence retention and keep all results absent from inference/public bundles. Local intake accepts small text/HTML/.eml files and writes only to a fresh private directory. Preserve the 600-second/one-task/two-model-call runtime limits.
