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
- No fixed monthly budget has been agreed. Present expected costs and obtain authorization before introducing new billable resources, paid subscriptions, or materially increasing ongoing costs. Continue reversible local work and read-only investigation without routine approval requests.

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

- This application collects news and publishes it as a website.
- This is a solo development project. Keep specifications and workflows lightweight while using feature branches and pull requests.
- Evolve the project using specification-driven development (SDD). Follow [docs/development.md](docs/development.md) for issue contracts, specifications, cross-repository tracking, autonomy boundaries, and completion evidence.
- For each feature, document requirements and acceptance criteria, then the design and implementation tasks, before implementing it. Keep these artifacts in English and align implementation and validation with them.
- Record confirmed decisions and unresolved product questions explicitly. Do not present assumptions or planned capabilities as implemented behavior.
- Target public content languages: Japanese, English, and Indonesian.
- Prioritize news accuracy, event-level deduplication, freshness, traceable sources, and consistent facts across languages. Evaluate source selection and quality against saved examples while minimizing model and infrastructure costs.
- Treat temp-script/ (including TEMP-script/ on case-insensitive hosts) as read-only migration input. Do not stage, commit, push, or execute it without explicit authorization; it contains credential-like values and raw debug/cache data.
- Current implementation: Hugo / PaperMod static website with English and Japanese configured. Indonesian support and the automated news collection and publishing pipeline remain to be specified and implemented.
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
- PR/main validation is defined in .github/workflows/validate.yml. Production delivery is not implemented; authentication and repository protection changes must be specified and authorized separately.

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

- #16 tracks initial setup. #17 delivers the SDD foundation in draft PR #21; see specs/17-sdd-workflow/. Local builds, form structure, and documentation links passed. #22 adds CI to the same PR; verify the exact head before merge. The developer authorizes PR merging after checks pass; do not bypass existing review requirements.
- #18: Specify and implement PR validation, deployment authentication, main-only Firebase Hosting publication, and available repository protections.
- #19: The developer confirmed the existing collector runs locally. Temporary script inventory and its limitations are summarized in specs/23-news-quality/. No cloud collector migration is assumed.
- #20: Specify daily multilingual generation and publishing, informed by #19. Sources, scheduling/timezone, editorial policy, failure handling, cost limits, Indonesian rollout, and automatic article merge authority remain open.
- #22: Free-tier PR validation; #23: Event-level quality design and offline baseline. See their specs for validation and open product decisions.
- The private GitHub Project News Publishing tracks the setup and publishing issues.
- GitHub inspection: public repository, Actions enabled, default workflow token read-only; main requires one approving review and code-owner review, has no required status checks, and does not enforce rules for admins. Any solo-compatible protection change requires explicit approval; never use admin bypass to avoid the review requirement.
- Rebuilt-container validation passed on 2026-10-10: Codex 0.162.1 starts, ChatGPT authentication is retained, and npm run check builds EN/JP. Startup update configuration is present, but the original startup update log has not been verified.
- Full Access executes commands successfully. workspace-write sandbox execution fails with namespace EPERM under container seccomp restrictions; host inspection confirmed no security options, extra capabilities, or privileged mode.
