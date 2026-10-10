# Codex Project Instructions and Handoff

## Working preferences

- Communicate with the user in Japanese, including progress updates and final reports.
- Write all repository documentation, specifications, developer explanations, and code comments in English, including this file and README.md.
- Public website content targets Japanese, English, and Indonesian. This content policy is separate from the English-only repository documentation policy.
- Default to AUTO mode: complete requested work and relevant validation autonomously without pausing for routine implementation choices or reversible changes.
- Request confirmation when required by permissions or before destructive actions outside the requested scope.
- Preserve existing uncommitted changes and avoid unrelated edits.

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
- Automatic publishing is the intended workflow, but CI/CD is not implemented yet. Authentication, checks, and repository protection settings must be specified during implementation.

## Development and validation

- Dev Container: Ubuntu 24.04, Node.js 22, Hugo Extended 0.147.9.
- Firebase CLI is a pinned project dependency. Use `npm ci` to install dependencies.
- `npm run dev`: serve the preview on port 1313.
- `npm run check`: verify CLIs and build the English and Japanese sites in a temporary directory.
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

- #16 tracks initial setup. #17 delivers the SDD foundation; see specs/17-sdd-workflow/.
- #18: Specify and implement PR validation, deployment authentication, main-only Firebase Hosting publication, and available repository protections.
- #19: Inventory the existing Google Cloud news collection process before selecting new infrastructure. gcloud authentication is available, but blog-pumpkinpie has Cloud Run and Scheduler APIs disabled; confirm the collection project before inventory.
- #20: Specify daily multilingual generation and publishing, informed by #19. Sources, scheduling/timezone, editorial policy, failure handling, cost limits, Indonesian rollout, and automatic article merge authority remain open.
- The private GitHub Project News Publishing tracks #16-#20.
- Rebuilt-container validation passed on 2026-10-10: Codex 0.162.1 starts, ChatGPT authentication is retained, and npm run check builds EN/JP. Startup update configuration is present, but the original startup update log has not been verified.
- Full Access executes commands successfully. workspace-write sandbox execution fails with namespace EPERM under container seccomp restrictions; host inspection confirmed no security options, extra capabilities, or privileged mode.
