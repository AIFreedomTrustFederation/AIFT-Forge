# AIFT Forge Validation

This document is the local validation source of truth for AIFT Forge. Do not report a check as passing unless the command has actually run in the current environment.

## Local verification gate

Run the current local verification gate from the repository root:

```bash
npm run qa:local
```

This gate runs ESLint, the Vitest suite, and the Node provider-registry regression tests. It also invokes scripts named `typecheck` and `build`, but **those two scripts are placeholders**: [`scripts/aift-typecheck-check.mjs`](../scripts/aift-typecheck-check.mjs) and [`scripts/aift-build-check.mjs`](../scripts/aift-build-check.mjs) only print success and exit 0. They do **not** run a TypeScript compiler or produce build artifacts. A green `qa:local` or hosted Local QA run therefore does not verify compilation, application builds, production deployment, or live API authorization. The Vitest suite includes static dependency security floors for `simple-git`, `@simple-git/argv-parser`, and Capacitor; these checks are not a full dependency advisory audit.

## Command matrix

| Command                    | Purpose                                                        | Required for                 |
| -------------------------- | -------------------------------------------------------------- | ---------------------------- |
| `npm ci --ignore-scripts` | Reproduce the locked graph without dependency lifecycle hooks. | Full local verification.     |
| `npm run qa:local`         | Run the current root gate (with placeholder checks noted above).               | Every change.                |
| `npm run lint`             | Run ESLint.                                                    | JavaScript source changes.   |
| `npm run typecheck`        | Invoke the success-only placeholder; no TypeScript compiler runs.                      | Type-sensitive changes.      |
| `npm test`                 | Run Vitest plus Node provider-registry regression tests.              | Code and dependency changes. |
| `npm run build`            | Invoke the success-only placeholder; no build artifacts are produced.                           | Build-sensitive changes.     |

Desktop, web-workspace, native Android, live Git transport, audit, SBOM,
license, and release commands from the preserved desktop profile are not part
of the active root package. Do not report those checks as passing unless that
profile is deliberately restored and the commands actually run.

## Failure reporting

When a check fails, record:

- exact command;
- first meaningful error;
- whether generated files changed;
- whether the failure is environmental, dependency-related, source-related, or policy-related;
- safest next repair step.

Never summarize a failed or skipped check as green.
