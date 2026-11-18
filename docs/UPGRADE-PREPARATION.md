# Federation upgrade preparation

This is an engineering proposal, not a change to constitutional authority or a
claim that the federation is ready. Preserve local ownership, inspectable source,
provider interfaces, existing licenses, and explicit review boundaries.

## Reviewed baseline

| Repository | Inspected main revision | Concrete finding | Canonical gate |
| --- | --- | --- | --- |
| AIFT-OS | edad4a12d1368a69e385d9e0784fa42f30cef1ae | Root metadata declares name/layer/role only; README distinguishes planned CLI groups from implemented commands. | `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm run typecheck`, `make verify` |
| AIFT-Runtime | 060391f9b2f187b1609b47b106d0b90de1ce7c0e | Manifest doctor/status reference machine-local `$HOME/AIFT`; source QA must remain separate from bootstrap or repair. | `bash qa-local.sh` |
| AIFT-Forge | 5a255964f6acab42a67aa7816d4a5d92c873503e | Manifest verify uses optional scripts; AGENTS requires mandatory `qa:local`. `docs/status.md` records an October 8 pass, not a current-head certification. | `npm ci --ignore-scripts`, `npm run qa:local` |

Reviewed README, root AGENTS, root repository/package manifests and available
status/verification sources. These three repositories are the first preparation
slice; the other repositories have not received a complete source audit here.
Existing OS cloud-controller PRs #73/#74 and portal #43/#44 are separate work;
this proposal must not duplicate or implicitly activate them.

## Implementation sequence and acceptance

| Stage | Concrete work | Verification required before advancing |
| --- | --- | --- |
| 1: Baseline | Inventory exact revisions, tracked source hashes, instructions, dependency locks and missing metadata. Preserve missing/unknown states. | Inventory must not execute manifest commands, fetch remote resources or write target repositories; malformed metadata and unavailable Git evidence must be explicit. |
| 2: Documentation contracts | Give each repository a command table with prerequisites, side effects, offline scope, output and failure meaning. Reconcile Forge verify guidance through a separate reviewed change. | Every documented supported command exists; canonical gate is mandatory; planned capabilities remain labelled; relative links resolve. |
| 3: Regression coverage | Add negative fixtures for missing tools, malformed manifests, unavailable providers and stale evidence. Use each repository's existing test framework. | Fixtures fail against reproduced defects and pass after focused fixes; tests require no credentials, model downloads or production calls. |
| 4: Local-first integration | Define versioned OS/Runtime/Forge evidence fixtures, then add one adapter at a time. Model/provider adapters remain replaceable. | Same fixture yields consistent unknown/blocked/failure meanings across producers and consumers; disconnect network after dependency provisioning and exercise fixture tests. |
| 5: Product upgrades | Build cinematic public exploration and operator-console integration on the verified contracts. Keep public prose free of internal engineering jargon. | Android 360/390px and desktop interaction, keyboard focus, reduced motion, low-data behavior, safe destinations and no horizontal overflow; record browser evidence separately. |
| 6: Release preparation | Reconcile dependent PRs, capture exact-head hosted check URLs, license/provenance inventory and rollback steps. | Required checks pass on final head, reviewers approve applicable boundaries, and rollback is concrete. Deployment remains a separate decision. |

## Evidence record

Each subsequent PR should record repository, base/head SHA, changed scope,
canonical command, tool/platform versions, exit code, test totals, log/check URL,
remaining blockers, dependency PRs and rollback. A source hash is an inventory
fact, not signed provenance. A clean checkout is not a passed test. Local tests
are not hosted CI, browser acceptance or production verification.

## Immediate next step

Review this preparation slice, run the canonical gates on its final commits,
and reconcile documentation command contracts before expanding runtime behavior.
For Forge, inspect callers before proposing `commands.verify` reconciliation;
for Runtime, add portable fixtures before changing environment discovery.
Governance, identity, credentials, security policy, custody and production
behavior require their own scoped review; this roadmap does not authorize them.

## Preparation validation (2026-11-17 Pacific)

- Runtime: canonical `bash qa-local.sh` passed: 135 tests plus validation of
  76 shell scripts, 60 Python sources, one JSON document and one model pointer.
- Forge: locked lifecycle-disabled install and `npm run qa:local` passed;
  25 Vitest tests and two five-test Node suites passed. This covers only the
  active Android/Termux profile, not native installers or the public portal.
- OS: locked lifecycle-disabled install and TypeScript checks passed.
  `make verify` stopped at missing `gofmt` (exit 127); full OS gate is blocked
  by this environment. Five new inventory regressions passed independently.
- Hosted checks on the final PR commits remain separate and must be reviewed.
