# Codex Project Instructions and Handoff

## Working preferences

- Communicate with the user in Japanese, including progress updates and final reports.
- Write all repository documentation, specifications, developer explanations, and code comments in English, including this file and README.md.
- Public website content targets Japanese, English, and Indonesian. This content policy is separate from the English-only repository documentation policy.
- Default to AUTO mode: complete requested work and relevant validation autonomously without pausing for routine implementation choices or reversible changes.
- Request confirmation when required by permissions or before destructive actions outside the requested scope.
- Preserve existing uncommitted changes and avoid unrelated edits.

## Cost constraints

- Minimize ongoing costs and keep the architecture appropriate for solo development.
- Use GitHub Free as the baseline. Do not require paid GitHub plans or features; verify feature availability and included Actions usage for the actual repository visibility before proposing workflows.
- Consider Google Cloud costs explicitly before choosing services or provisioning resources. Prefer suitable free allowances, usage-based execution, and reuse of existing resources over always-on infrastructure.
- Verify current pricing and free-tier conditions rather than assuming a service is free. Estimate monthly costs from expected execution frequency, duration, resources, storage, network transfer, logging, and model/API usage; state assumptions and uncertainties.
- Bound retries, concurrency, model input/output, and retention to avoid unnecessary spending. Use budget alerts where appropriate, but do not treat alerts as hard spending caps.
- The developer authorized up to USD 10/month for total GCP costs, including existing resources, on 2026-10-10. This is not an incremental allowance or approval for separate AI/API subscriptions. Prefer using the existing ChatGPT plan through supported integration where eligible; account/plan eligibility and runtime are unverified. Present expected costs before introducing billable resources; budget alerts are not hard caps. Continue reversible local work and read-only investigation without routine approval requests.

## Pre-commit privacy gate

- Before every commit, inspect the exact staged changes with `git diff --cached`, including file names and newly added files. Review relevant surrounding content when needed; do not rely on pattern matching alone.
- Check for information that identifies or locates the developer: real names, personal email addresses, phone numbers, home addresses, birth dates, employer details, personal account identifiers, private URLs, and identifying local paths. Check public content, documentation, comments, configuration, fixtures, logs, and media metadata when included.
- Also check for passwords, API keys, access tokens, private keys, authentication files, and other secrets. Do not copy detected values into reports or commit messages.
- Review the proposed commit message and effective author and committer identities. Use a pseudonym and a GitHub noreply address; stop if a real name or personal email would be recorded. A noreply address still links to a GitHub account and is not anonymous.
- Existing public identifiers are not blanket permission to disclose additional personal information. If staged changes introduce or expose identifying information, remove or replace it with a neutral placeholder when possible and review the staged changes again.
- If a finding cannot be resolved confidently, stop the commit and ask the user in Japanese, describing the category and location without repeating the sensitive value. Do not bypass this gate under AUTO mode.
- Commit only after completing the review and briefly report its scope and any unresolved limitations. Never claim that this review guarantees anonymity or audits all existing Git history.
- This is an agent instruction, not an enforced Git hook; it applies to commits made by the agent.

## Product and development direction

- This application collects news and publishes it as a website. The developer describes it as a personal memo site but wants positioning to remain flexible and prioritizes broad source discovery; the existing production site is public. Prefer short original factual notes and source-linked comparisons. Personal operation does not automatically establish publisher permission for automated access, model input or republication.
- This is a solo development project. Keep specifications and workflows lightweight while using feature branches and pull requests.
- Evolve the project using specification-driven development (SDD). Follow [docs/development.md](docs/development.md) for issue contracts, specifications, cross-repository tracking, autonomy boundaries, and completion evidence.
- For each feature, document requirements and acceptance criteria, then the design and implementation tasks, before implementing it. Keep these artifacts in English and align implementation and validation with them.
- Record confirmed decisions and unresolved product questions explicitly. Do not present assumptions or planned capabilities as implemented behavior.
- Target public content languages: Japanese, English, and Indonesian.
- The developer prefers concise factual news summaries without routine per-item interpretive disclaimers or closing source-coverage commentary. Preserve attribution and dates; do not invent cross-source comparisons. Article source links should open in a new tab.
- Prioritize news accuracy, event-level deduplication, freshness, traceable sources, and consistent facts across languages. Evaluate source selection and quality against saved examples while minimizing model and infrastructure costs.
- Treat temp-script/ (including TEMP-script/ on case-insensitive hosts) as read-only migration input. Do not stage, commit, push, or execute it without explicit authorization; it contains credential-like values and raw debug/cache data.
- Current implementation: Hugo / PaperMod static website with English and Japanese configured. Indonesian support remains planned. Bounded EN/JP RSS news automation is implemented under #55; its runtime/consumer activation remains pending.
- Production URL: https://blog.pumpkinpie-tea.com/
- Firebase project: `blog-pumpkinpie`.
- Articles: `content/`; site configuration: `hugo.yaml`; template overrides: `layouts/`.
- PaperMod is a Git submodule under `themes/`. Use the recorded commit unless an update is requested.

## Branches, pull requests, and publication

- Create a separate branch for changes using the issue number, such as `setup/16-initial-setup` or `feat/<issue-number>-<description>`; do not commit directly to `main`.
- Submit changes through a pull request targeting `main`, even for solo development. Keep PR descriptions and commit messages in English.
- Apply the pre-commit privacy gate before committing, and review the outgoing diff before pushing or opening a PR.
- Validate changes in CI before merging. Do not bypass failing required checks.
- The intended release flow is: feature branch -> PR -> passing CI -> merge into `main` -> automatic production publication through CI/CD.
- Production deployment should run only from `main` after validation succeeds. Pull requests must not deploy to production.
- Keep deployment credentials out of the repository and restrict CI deployment permissions to what is necessary.
- PR/main validation is defined in .github/workflows/validate.yml. Guarded production delivery is implemented in .github/workflows/deploy.yml; dedicated main-only WIF authentication is active and live-verified under #55. Further authentication and repository protection changes must be specified and authorized separately.

## Development and validation

- Dev Container: Ubuntu 24.04, Node.js 22, Hugo Extended 0.147.9.
- Firebase CLI is a pinned project dependency. Use `npm ci` to install dependencies.
- `npm run dev`: serve the preview on port 1313.
- `npm run check`: verify container CLIs, run documentation/form checker tests, validate guides/forms, and build EN/JP in a temporary directory.
- `npm run check:ci`: run portable checker tests, documentation/form validation, and EN/JP builds without cloud/developer CLIs or credentials.
- `npm run build`: generate the production site in `public/`.
- `npm run deploy`: build and publish to Firebase Hosting. Run when the user requests publication.
- Do not commit build output, credentials, or secrets.

## Codex and container rebuilds

- `.devcontainer/post-create.sh` installs Codex CLI; `post-start.sh` updates it at container startup.
- Retry installation or updating with `bash .devcontainer/update-codex.sh`.
- `.codex/config.toml` specifies workspace-write sandboxing and automatic approval review. The developer currently uses a session-level Full Access override because container seccomp restrictions block nested namespace creation; the repository configuration is unchanged.
- `~/.codex` is persisted in a Docker named volume for authentication, personal configuration, and session history.
- Keep this `AGENTS.md` in the repository and commit updates so instructions survive rebuilds and are available in other clones.
- Saved conversation history does not mean a new session automatically loads all previous conversations.

## Maintaining the handoff

- Update the relevant sections with durable user preferences, confirmed design decisions, and development procedures.
- Before ending unfinished work, record concrete remaining tasks and validation status below.
- Remove obsolete notes. Never include secrets, tokens, or full conversation transcripts.
- At the start of a new session, read this file and `README.md`, then inspect `git status` and relevant files before continuing.

## Outstanding work

- PR #21 merged; #17 (SDD foundation) and #22 (validation) are complete. Required PR CI and post-merge main CI passed. Merge identity was verified as the reviewed pseudonym/noreply with GitHub as committer. Evidence is in #22 and PR #21.
- #16 remains the initial setup umbrella. The developer authorizes merging scoped PRs after required checks pass. Do not bypass protections. Local documentation previously on main was preserved in backup/main-before-sdd-merge when synchronizing to the merged remote main.
- #18: Guarded main-only Hosting delivery merged in PR #41 after required CI passed. Offline tests pass (71 total) and EN/JP builds pass. Dedicated OIDC activation and live delivery succeeded on 2026-10-10 under #55; see specs/18-main-hosting-delivery/ and docs/hosting-delivery.md.
- #19: The developer confirmed the existing collector runs locally. Temporary script inventory and its limitations are summarized in specs/23-news-quality/. No cloud collector migration is assumed.
- #20: The developer confirmed Southeast Asia IT and e-commerce as the editorial scope on 2026-10-10, replacing Indonesia general news. Chinese and Middle Eastern sources (including Al Jazeera), cross-outlet viewpoint comparison, and JICA as a low-frequency institutional candidate are requested. Nikkei Asia and NHK WORLD-JAPAN were proposed as Japanese media candidates. Candidate sources are not activated; access/reuse review remains necessary. Proposed daily publishing architecture and cost scenario are in specs/20-daily-publishing/. The confirmed GCP runtime, 07:30 Jakarta schedule, total USD 10 budget and initial EN/JP implementation are tracked under #55. Candidate access review, Indonesian rollout and live activation remain incomplete.
- #23: Event-level quality design and offline baseline; independently reviewed real-news semantic evaluation is pending. #28 adds an offline JSON identity/provenance validator and CLI; it does not prove factual/translation correctness or wire a publication gate. See specs/28-edition-contract/ and npm run check:edition -- <candidate.json>.
- #31 adds offline draft rendering from validated candidates plus localized text. It writes draft-only EN/JP Markdown into an explicit new staging directory and never overwrites an existing destination. No live generator or publication gate is wired. See specs/31-draft-renderer/ and docs/news-drafts.md.
- #33 adds offline source metadata selection with explicit date/host/tracking policy, conservative URL deduplication and date-conflict quarantine. No source adapter, semantic event deduplication or live collection is implemented. See docs/source-selection.md.
- #43 / PR #44 merged: discovery includes 18 candidates and five manual official feeds (ANTARA, CNA, current Japanese JICA). 76 offline tests and EN/JP builds passed. JICA-only full month names retain raw date evidence. Original English JICA routes redirect to a 2023 archive and are excluded. Live metadata trials: ANTARA/CNA retrieved 90 records; current JICA retrieved 30 records, all outside the chosen 24-hour window. No source bodies, models or publication activated. See docs/source-registry.md.
- #35 adds a manual, bounded two-feed RSS metadata trial with explicit request windows, source health and original publication-date evidence. No article-body retrieval, automatic source adoption, model call or publication is activated. See docs/rss-trial.md; live reports stay outside Git.
- #37 adds bounded offline event-pair suggestions and labeled-pair evaluation. The original synthetic baseline exposes false candidates and misses; it is not a real-news accuracy estimate. No semantic grouping or automatic merging is implemented. See docs/event-pairs.md.
- #39 connects prepared source-body evidence and canonical claims to EN/JP drafts with exact quote/hash checks, conservative numeric-string checks and a private audit. It does not prove factual/translation meaning, retrieve bodies, call models or enforce a live publication gate. See docs/evidence-drafts.md; real evidence inputs stay outside Git.
- #29 tracks manual and AI-assisted non-news article authoring. Reuse generic Hugo preview/PR/main delivery; do not impose news-only event/source constraints or grant news-bot auto-merge authority to editorial articles.
- The developer requests a later donation entry point (#24), monthly operating-cost/donation transparency (#25), and social auto-posting after successful site deployment (#26). Keep these independent of the initial daily pipeline. Public financial fields, providers/accounts and social platforms remain undecided. Do not publish billing/donor details or post to social accounts without activation authority.
- The private GitHub Project News Publishing tracks the setup and publishing issues.
- GitHub protection verified on 2026-10-10: main requires a PR, an up-to-date branch and the successful GitHub Actions Validate check. Required approving reviews are zero and code-owner review is disabled for solo development. Rules apply to administrators; force pushes and branch deletion remain prohibited. Repository is public, Actions enabled, and default workflow token permissions are read-only.
- Rebuilt-container validation passed on 2026-10-10: Codex 0.162.1 starts, ChatGPT authentication is retained, and npm run check builds EN/JP. Startup update configuration is present, but the original startup update log has not been verified.
- Full Access executes commands successfully. workspace-write sandbox execution fails with namespace EPERM under container seccomp restrictions; host inspection confirmed no security options, extra capabilities, or privileged mode.

- #45: Bounded local ChatGPT plan transport uses separately authorized app OAuth credentials, rotating refresh, live model discovery and terminal-only private output. Plus is confirmed; its app usage shares plan limits. No Codex credential import, API key or paid fallback. Account credit preferences must disable credit use for zero extra model spend. Browser OAuth is implemented by #49 / PR #50; owner consent and model discovery succeeded under #55; live generation and activation remain pending.

- #47: Today’s source-reviewed EN/JP edition merged in PR #48 and is LIVE, released 2026-10-10T12:29:50.387Z from validated main 9fd6df5 using the official Hosting REST API and existing Google authentication with explicit quota project. Both live HTML responses matched build hashes. Firebase CLI authentication failed; no IAM changes were needed for this manual release. The developer requested daily production from 2026-10-11 at 07:30 Asia/Jakarta (00:30 UTC). Dedicated CI OIDC approval/delivery, Plus owner consent and GCP runtime setup are complete under #55; generation/content-only merge verification and first scheduled publication remain pending. Do not claim tomorrow’s pipeline is active. See specs/47-production-start/.

- #49 / PR #50 merged: Application-specific browser OAuth is implemented with loopback port 1456, PKCE/state/nonce, RS256/JWKS validation, protected atomic storage and selected-account preservation. Seven new tests pass; browser consent and model discovery succeeded under #55, while live inference remains pending. The protected GCS app session is the runtime authority; a local copy is not authoritative after cloud rotation. No Codex credentials or inference calls are used by sign-in.

- #51: Jakarta edition clock and disabled publishing config record 2026-10-11 07:30 Asia/Jakarta, previous-local-day windows and finite run limits. Five boundary/replay tests pass. This computes timing only and installs no scheduler. GCP runtime estimate is USD 0–2 incremental/month under bounded assumptions, excluding existing usage; GCP runtime selection/setup is complete under #55; activation remains pending. See docs/daily-start.md.

- #55 / PRs #56 and #57: GCP scheduled execution and dedicated CI authentication are approved within USD 10/month total GCP. Hosting WIF delivery succeeded from validated main, including explicit main Validate dispatch. Private GCS state, scoped WIF identities and two-image registry cleanup are provisioned. Current job runtime revision is 827c4725dd3ece0c4b2817e69896ff01e9fbad0c (build 38055314635); main Validate and Hosting delivery 38055339410 passed. Cloud Run daily-news has one task/CPU, 512 MiB, 600 seconds, zero retries. Metadata-only execution daily-news-4b66w succeeded: three official ANTARA RSS feeds/70 records, zero model calls, private status saved and global lock released. This does not verify AI generation or bot article merging. Scheduler daily-news-jakarta is PAUSED at 07:30 Asia/Jakarta; NEWS_PUBLISH_ENABLED=false and config enabled=false. App session authority is protected GCS auth/session.json; do not independently refresh the local copy after cloud rotation. See specs/55-daily-production/ and docs/daily-automation.md.
- #55 pending confirmations: account-side extra-credit disablement is unconfirmed. Automatic approval review rejected GitHub’s combined Actions create/approve-PR setting without explicit specific permission; the question is pending and the setting remains false. Do not export the broad local GitHub token or bypass this rejection. A historical-date trial was also rejected because old records could invoke AI; explicit --metadata-trial is verified safe and successful. Do not run generation before credit confirmation.
- #55 remaining activation tasks: receive both confirmations, run private next-edition generation/review and inspect facts, verify constrained bot PR/CI/merge, merge activation config and clock-test expectation changes, rebuild/deploy its immutable image, update NEWS_RUNTIME_REVISION, enable consumer and resume Scheduler. Record first actual scheduled publication separately. Existing GCP total spend remains unmeasured; the existing billing budget is an alert, not a hard cap.
