# Codex Project Instructions and Handoff

## Working preferences

- Communicate with the user in Japanese, including progress updates and final reports.
- Write all repository documentation, specifications, developer explanations, and code comments in English, including this file and README.md.
- Public website content targets Japanese, English, and Indonesian. This content policy is separate from the English-only repository documentation policy.
- Default to AUTO mode: complete requested work and relevant validation autonomously without pausing for routine implementation choices or reversible changes.
- Request confirmation when required by permissions or before destructive actions outside the requested scope.
- Preserve existing uncommitted changes and avoid unrelated edits.

## Product and development direction

- This application collects news and publishes it as a website.
- Evolve the project using specification-driven development (SDD).
- For each feature, document requirements and acceptance criteria, then the design and implementation tasks, before implementing it. Keep these artifacts in English and align implementation and validation with them.
- Record confirmed decisions and unresolved product questions explicitly. Do not present assumptions or planned capabilities as implemented behavior.
- Target public content languages: Japanese, English, and Indonesian.
- Current implementation: Hugo / PaperMod static website with English and Japanese configured. Indonesian support and the automated news collection and publishing pipeline remain to be specified and implemented.
- Production URL: https://blog.pumpkinpie-tea.com/
- Firebase project: `blog-pumpkinpie`.
- Articles: `content/`; site configuration: `hugo.yaml`; template overrides: `layouts/`.
- PaperMod is a Git submodule under `themes/`. Use the recorded commit unless an update is requested.

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
- `.codex/config.toml` specifies workspace-write sandboxing and automatic approval review.
- `~/.codex` is persisted in a Docker named volume for authentication, personal configuration, and session history.
- Keep this `AGENTS.md` in the repository and commit updates so instructions survive rebuilds and are available in other clones.
- Saved conversation history does not mean a new session automatically loads all previous conversations.

## Maintaining the handoff

- Update the relevant sections with durable user preferences, confirmed design decisions, and development procedures.
- Before ending unfinished work, record concrete remaining tasks and validation status below.
- Remove obsolete notes. Never include secrets, tokens, or full conversation transcripts.
- At the start of a new session, read this file and `README.md`, then inspect `git status` and relevant files before continuing.

## Outstanding work

- Codex installation/updating and `npm run check` passed on 2026-10-10.
- Validation after an actual Dev Container rebuild is pending: check Codex startup, retained authentication, and startup updates.
- Establish the initial SDD requirements, design, and task breakdown for news collection, multilingual content generation, and publication. Sources, scheduling, editorial review, and failure handling still need specification.
- Specify and implement Indonesian content support; the current site configuration and build checks cover English and Japanese only.
