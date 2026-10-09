# AIFT Forge Validation

This document is the local validation source of truth for AIFT Forge. Do not report a check as passing unless the command has actually run in the current environment.

## Local verification gate

Run the current local verification gate from the repository root:

```bash
npm run qa:local
```

This gate runs ESLint, the Android/Termux type-check profile, the Vitest suite,
and the Android/Termux build profile. The test suite includes locked dependency
security floors for `simple-git`, `@simple-git/argv-parser`, and Capacitor.

## Command matrix

| Command                    | Purpose                                                        | Required for                 |
| -------------------------- | -------------------------------------------------------------- | ---------------------------- |
| `npm ci --ignore-scripts` | Reproduce the locked graph without dependency lifecycle hooks. | Full local verification.     |
| `npm run qa:local`         | Run the complete active Android/Termux-safe gate.               | Every change.                |
| `npm run lint`             | Run ESLint.                                                    | JavaScript source changes.   |
| `npm run typecheck`        | Run the Android/Termux type-check profile.                      | Type-sensitive changes.      |
| `npm test`                 | Run Vitest, including dependency security floors.              | Code and dependency changes. |
| `npm run build`            | Run the Android/Termux build profile.                           | Build-sensitive changes.     |

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
