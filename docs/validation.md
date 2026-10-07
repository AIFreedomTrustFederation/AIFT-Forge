# AIFT Forge Validation

This document is the local validation source of truth for AIFT Forge. Do not report a check as passing unless the command has actually run in the current environment.

## Local verification gate

Run the current local verification gate from the repository root:

```bash
npm run qa:local
```

This gate runs structure/dependency checks, unit tests, lint, Git access smoke coverage, high-severity audit, the web build, and production license summary.

## Command matrix

| Command                        | Purpose                                                                   | Required for                             |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------- |
| `npm ci --ignore-scripts`     | Reproduce the locked dependency graph without lifecycle scripts.          | Any full local verification.             |
| `npm run deps:manifest`        | Generate `dist/aift-forge-dependencies.json`.                             | Dependency inventory and package review. |
| `npm run verify`               | Verify required files, workspaces, scripts, and policy labels.            | Structure readiness.                     |
| `npm run readiness`            | Generate `dist/aift-forge-readiness.json`.                                | Readiness reporting.                     |
| `npm run qa:deps`              | Run dependency manifest, structure verification, and readiness report.    | Documentation and structure changes.     |
| `npm test`                     | Run Vitest behavior tests.                                                | Code changes.                            |
| `npm run lint`                 | Run ESLint over JS/MJS/CJS code.                                          | Code changes.                            |
| `npm run smoke:git-access`     | Exercise Smart HTTP token gate behavior against an isolated temp store.   | Git transport or auth changes.           |
| `npm run smoke:git-live`       | Run live Git clone/fetch/push against a disposable local Smart HTTP server. | Runtime transport evidence.              |
| `npm audit --audit-level=high` | Fail on high or critical dependency vulnerabilities.                      | Dependency changes and release prep.     |
| `npm run web:build`            | Build the Vite product web shell.                                         | UI and release prep.                     |
| `npm run license:check`        | Summarize production license data.                                        | Release prep.                            |

Current license note: the private root workspace may appear as `UNLICENSED`. That is not a third-party dependency finding, but it should remain visible until the federation chooses a root package license label.

## Formatting

`npm run format:check` is the long-term formatting gate. It is not yet the required current gate because legacy files need a scoped normalization pass. Until then:

- run Prettier on files changed in the current work slice;
- avoid broad formatting-only rewrites mixed with behavior changes;
- record any skipped formatting scope in the handoff.

## Optional platform checks

Run these only when the required platform tooling is installed:

| Command                       | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `npm run desktop:build:win`   | Build Windows installer and portable targets.                          |
| `npm run android:build`       | Build and sync the Android shell.                                      |
| `npm run android:apk:collect` | Collect generated APK artifacts into `dist/android`.                   |
| `npm run test:e2e`            | Run Playwright browser tests after browser dependencies are installed. |

## Failure reporting

When a check fails, record:

- exact command;
- first meaningful error;
- whether generated files changed;
- whether the failure is environmental, dependency-related, source-related, or policy-related;
- safest next repair step.

Never summarize a failed or skipped check as green.
