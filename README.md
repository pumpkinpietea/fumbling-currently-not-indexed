# fumbling-currently-not-indexed

A news collection and website publishing application for
[blog.pumpkinpie-tea.com](https://blog.pumpkinpie-tea.com/).

The current implementation generates an English and Japanese static website using
Hugo / PaperMod and publishes it to Firebase Hosting (`blog-pumpkinpie`).
The target public content languages are Japanese, English, and Indonesian.
Indonesian support remains planned. Bounded automated EN/JP news collection and publication are implemented under #55; private generation and bot PR/merge/delivery are verified. Production configuration is enabled; runtime image rollout and Scheduler activation are recorded in specs/55-daily-production/tasks.md.

Daily scope and separate editions: [two-edition guide](docs/two-daily-editions.md). Visual UI review: [browser guide](docs/ui-review.md).

News browsing and search: [interface guide](docs/news-interface.md). Bounded personal discovery and newsletter intake: [discovery guide](docs/private-discovery.md).

## Development approach and language policy

The project uses lightweight specification-driven development (SDD): define
requirements and acceptance criteria, document the design and implementation tasks,
then implement and validate against those specifications.

All repository documentation, specifications, developer explanations, and code
comments must be written in English. Public website content uses its intended
language. Communication with the user remains in Japanese.
See [AGENTS.md](AGENTS.md) for persistent project instructions and handoff notes,
[the development guide](docs/development.md) for the issue-to-PR workflow,
[architecture and decisions](docs/architecture.md) for verified state and open questions,
and [specification templates](specs/templates/) for feature planning.
GitHub Issues are the task entry point; detailed specifications live in `specs/`.
See the [publishing design](specs/20-daily-publishing/spec.md),
[cost assumptions](specs/20-daily-publishing/costs.md), and
[product roadmap](docs/roadmap.md) for proposed next steps.
Codex and Claude Code share the same guide through `AGENTS.md` and `CLAUDE.md`.

## Branch and release workflow

Use a separate branch for every change and open a pull request targeting `main`,
even for solo development. Review staged changes for personal information and
secrets before committing, and validate changes in CI before merging.

The intended release flow is:

```text
Feature branch -> Pull request -> Passing CI -> Merge into main -> Automatic publication
```

The validation workflow checks pull requests targeting `main` and pushes to `main`
using portable documentation/form checks and EN/JP builds. Firebase delivery is implemented behind a disabled-by-default activation variable;
Dedicated OIDC setup and live main-only Hosting delivery were verified on 2026-10-10. See [Hosting delivery](docs/hosting-delivery.md).
Pull requests will not publish to production. Deployment authentication and
delivery details are documented. Main requires a PR, a passing Validate
check and an up-to-date branch, including for administrators. Separate reviewer
approval is optional for solo development. Force pushes and deletion are prohibited.

## Dev Container

Install Docker and the VS Code Dev Containers extension on the host, open this
repository, and run **Dev Containers: Rebuild and Reopen in Container**.
Host installations of Hugo and cloud CLIs are unnecessary.

The container provides Ubuntu 24.04, Node.js 22, Hugo Extended 0.147.9, GitHub CLI
(`gh`), Google Cloud CLI (`gcloud`), Codex CLI, and the VS Code Codex extension.
On creation, it initializes PaperMod at the recorded Git submodule commit,
installs Firebase CLI 15.33.0 and dependencies from the lockfile using `npm ci`,
and checks the site build. Initial setup requires network access to distribution services.

```bash
npm run dev    # Serve the preview on port 1313
npm run check  # Verify container CLIs, documentation/forms, and EN/JP builds
npm run check:ci  # Run portable tests, documentation/forms, and EN/JP builds
npm run build  # Generate the production site in public/
npm run check:edition -- tests/fixtures/edition-valid.json  # Offline candidate contract example
```

The offline [edition contract](specs/28-edition-contract/spec.md) checks news
identity/provenance references across languages. It does not validate fact text or
activate publishing. The separate [draft renderer](docs/news-drafts.md) creates
previewable EN/JP Markdown from validated identities and localized fact text.
The [offline source selector](docs/source-selection.md) filters supplied publication
metadata and groups normalized URLs before event and fact preparation.
The [manual RSS trial](docs/rss-trial.md) connects reviewed official feeds from the
[source registry](docs/source-registry.md) to that selector, preserving collection
health and date evidence without model calls.
The [event-pair evaluator](docs/event-pairs.md) measures a bounded lexical
shortlist against explicit labels; it does not automatically group or publish news.
The [evidence-linked draft command](docs/evidence-drafts.md) connects prepared body
quotes and canonical claims to bilingual drafts and a private integrity audit.

To update Hugo, change its version in `.devcontainer/devcontainer.json` and rebuild.
To update Firebase CLI, run `npm install --save-dev --save-exact firebase-tools@<version>`
and commit both `package.json` and `package-lock.json`.
The base image, Features, Node.js patch version, gh, and gcloud may change on rebuild.

The local [ChatGPT plan transport](docs/chatgpt-plan.md) supports bounded private inference
from separately authorized app OAuth credentials. Browser sign-in and live model discovery succeeded; bounded generation and skeptical review succeeded in a private source-reviewed rehearsal. Codex credentials are never imported.

The [daily start guide](docs/daily-start.md) records the confirmed 07:30 Jakarta
clock, activation boundaries, runtime costs and rollout prerequisites. See the
[automation guide](docs/daily-automation.md) for the implemented runtime and content-only PR flow.

## Codex

Container creation installs `@openai/codex@latest`. The startup
`postStartCommand` also updates it to the latest version. If an update fails,
the existing installation is used; if none exists, setup reports an error.
To retry manually:

```bash
bash .devcontainer/update-codex.sh
codex --version
codex
```

Sign in to Codex on first use. A Docker named volume persists `~/.codex`, including
authentication, personal settings, and history, across rebuilds of the same container.
Authentication stored only in an existing container is not automatically migrated
into the new volume, so the first rebuild with this configuration may require signing in again.

The repository's `.codex/config.toml` specifies workspace-write sandboxing and
AUTO approval review (`approvals_reviewer = "auto_review"`). Trust the project
before using its configuration. Managed policies take precedence where applicable.
`AGENTS.md` also instructs Codex to proceed autonomously by default.

After the current rebuild, nested namespace creation is blocked by container
security restrictions. The developer uses a session-level Full Access override;
this does not change the repository configuration or remove Docker isolation.
Mounted workspace files and persistent credential volumes remain accessible
inside the container. Full Access does not itself authorize merge or deployment.

### Handoff across sessions

The root `AGENTS.md` contains project instructions, architecture context, validation
commands, and outstanding work. Keep durable decisions up to date and commit this
file to Git so other clones receive the same instructions. It remains available
after rebuilding the same workspace.

Persisted `~/.codex` history serves a separate purpose: a new session does not
automatically read every previous conversation.

## Initial account authentication

Sign in to the required services using your own accounts:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
gcloud auth login --no-launch-browser
gcloud config set project blog-pumpkinpie
npx --no-install firebase login --no-localhost
```

Firebase Hosting deployment requires Firebase CLI authentication separately from
`gcloud` authentication. Git author settings are inherited from the host. If missing,
set `git config --global user.name` and `git config --global user.email`.

Service-specific Docker named volumes preserve credentials across rebuilds of the
same Dev Container. Changing the container identifier or deleting volumes requires
reauthentication. Do not store credentials in the repository.

## Manual publication

```bash
npm run deploy
```

After a successful build, this publishes to Hosting in `blog-pumpkinpie`.
Bounded daily RSS collection, article generation and protected publication are
implemented under #55; private generation and protected bot delivery are verified. See the #55 execution evidence for runtime activation and the first scheduled run.
