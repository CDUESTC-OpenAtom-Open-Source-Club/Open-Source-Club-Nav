# Contributing Guide

Thank you for helping improve KCOS Open Source Club Nav. This repository is a public open source project, so contributions need to be easy to review, reproducible, and legally clear.

## Code of Conduct

All participants must follow the [Code of Conduct](CODE_OF_CONDUCT.md). Be direct, respectful, and keep discussions focused on the work.

## Contributor License Agreement

Before a pull request can be merged, every human contributor must sign the [Contributor License Agreement](CLA.md).

The CLA check is automated by GitHub Actions. If you have not signed yet, the bot will comment on your pull request. Reply with the exact signature sentence shown by the bot.

Maintainers and automated bots may be allowlisted in the workflow when appropriate.

## Branches

Use short, descriptive branches. Prefer these prefixes:

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
refactor/<short-description>
test/<short-description>
ci/<short-description>
chore/<short-description>
```

Examples:

```text
feat/admin-link-health-table
fix/mobile-resource-card-layout
docs/contribution-guide
ci/pr-title-check
```

Rules:

- Do not push feature work directly to `main`.
- Keep each branch focused on one problem.
- Rebase or merge `main` before requesting review if the branch is stale.
- Do not commit local config files, build output, secrets, or generated artifacts unless the change explicitly requires them.

## Commit Messages

Use Conventional Commits:

```text
<type>(optional-scope): <summary>
```

Allowed types:

```text
feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

Examples:

```text
feat(web): add resource category keyboard support
fix(backend): reject invalid link health status
docs: document local development setup
ci: add pull request title check
```

Use `!` for breaking changes:

```text
feat(api)!: rename resource response fields
```

## Pull Requests

Before opening a PR:

- Make sure the PR targets `main`.
- Fill in the PR template.
- Link related issues.
- Keep the scope reviewable.
- Add screenshots for UI changes.
- Document database migrations, config changes, or deployment impact.

Expected local checks:

```bash
cd backend
GOTOOLCHAIN=auto GOPROXY=https://goproxy.cn,direct GOFLAGS='-p=1' GOMAXPROCS=1 go test ./...

cd ../frontend/apps/web
npm ci
npm run check:resource-seeds
npm run build
```

`npm run lint` is currently being cleaned up. Run it when touching frontend code and fix new issues in files you modify, but do not expand unrelated lint churn in the same PR.

## Review And Merge Policy

Maintainers should require:

- CLA check passed.
- PR title check passed.
- CI passed.
- At least one approving review.
- No unresolved review threads.
- No unrelated generated output or local config changes.

Use squash merge unless a maintainer intentionally preserves a multi-commit history.

## Release Flow

Deployment is tag-driven.

- Test deployment tags use `v*-test`, for example `v0.2.0-test`.
- Production tags use normal semantic versions, for example `v1.2.3`.
- Do not deploy directly from ordinary pushes to `main`.

See [deploy/README.md](deploy/README.md) for deployment details.
