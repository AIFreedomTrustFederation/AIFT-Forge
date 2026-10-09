# AIFT Forge Status

This is the canonical status record for AIFT Forge. It separates implemented behavior, local verification evidence, prototypes, planned work, and claims that are not yet supported.

## Current implementation status

| Area                  | Status                 | Evidence                                                                         |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Repository role       | Active federation core | README, manifests, and agent docs exist.                                         |
| Installable product   | Foundation             | Web, desktop, Android, API, and core workspaces exist.                           |
| Web build             | Not currently verified | The web workspace is preserved, but its build is outside the active Android/Termux-safe root profile. |
| Local API             | Foundation             | Health, state, records, Git, token, setup, and artifact routes exist.            |
| Persistent state      | Foundation             | JSON-backed local state helpers exist.                                           |
| Git read operations   | Foundation             | Branch, tag, commit, tree, blob, and diff readers exist.                         |
| Smart HTTP transport  | Partial                | Token-aware access behavior has portable test coverage; the disposable live clone/fetch/push smoke command is not active. |
| Protected writes      | Partial                | Protected-ref behavior has portable test coverage; live smoke and review-status merge policy remain pending. |
| Desktop package       | Not built              | Electron metadata exists; installer output is not verified.                      |
| Android package       | Not built              | Android shell exists; native project/APK output is not verified.                 |
| AI provider execution | Not built              | AI request records exist; real provider adapters are not active.                 |
| Stable release        | Not claimed            | No stable release, signed artifact, or audited package is claimed.               |

## Current verification evidence

Last local verification pass: 2026-10-08 using the active Android/Termux-safe
profile. The matching hosted `Local QA` run also passed.

Passing checks:

- `npm ci --ignore-scripts`
- `npm run lint`
- `npm run typecheck`
- `npm test` (20 tests, including dependency security floors)
- `npm run build`
- `npm run qa:local`
- hosted `Local QA`

Not verified by the active gate:

- desktop and web workspace builds;
- native Android project generation or APK output;
- live Git transport smoke coverage;
- dependency audit, SBOM, license, formatting, or release checks from the
  preserved desktop profile.

## Public claim boundaries

- No stable release is claimed.
- No production deployment is claimed.
- No audited security status is claimed.
- No artifact signing guarantee is claimed.
- No live Git push workflow is production-trusted until review-status policy, request limits, and release hardening exist.

## Known blockers

- Review-status merge policy beyond protected-ref approval.
- JSON transport request routes need the same token actor path as Smart HTTP.
- Request size limits and streaming for Git RPC paths.
- Windows installer build and inspection.
- Android native project generation and APK inspection.
- Artifact storage, download, signing, and release signing.
- Real AI provider adapters with no-secret prompt boundaries.
- Federation/mirror sync execution.

## Next best repair

Implement review-status merge policy beyond protected-ref approval, then harden Git RPC request size limits and streaming.
