# Engineering command contract

Run commands from the repository root. Source QA remains separate from live
capability, security, dependency provenance and deployment acceptance.

| Command | Prerequisites | Effects and success meaning |
| --- | --- | --- |
| `npm ci --ignore-scripts` | Node/npm, lockfile; registry access or populated cache | Recreates locked node_modules; skips lifecycle scripts. Does not imply dependencies were audited. |
| `npm run qa:local` | Installed dependencies | Mandatory lint, active Android/Termux typecheck, tests and build. Missing or failing stage exits nonzero. Does not build native desktop/Android installers or deploy portal. |
| Manifest `commands.verify` | Same QA prerequisites | Delegates to `npm run qa:local`; no installation, synchronization or clean-tree certification. |
| `python3 -B scripts/run_forge_verification.py --output /absolute/outside-checkout/new.json` | Python 3.10+, QA prerequisites, clean commit, absent destination | Runs QA and publishes unsigned commit-bound evidence; outputs outside checkout. Exit 0 checks passed, 1 failed checks, 2 generation/publication error. |

The manifest change reconciles the existing gate; it does not activate new
runtime capabilities. Disposable npm fixtures prove success, missing-script and
failing-stage behavior without installing dependencies or contacting services.

Preparation PR #14 passed hosted `qa` at
`20470a73bf9862438dbc39a3bf6f98578f48addb`
([run](https://github.com/AIFreedomTrustFederation/AIFT-Forge/actions/runs/44213262777)).

After verification run `git diff --check` and inspect `git status --short`.
After committing, require a clean worktree. Hosted evidence must match the final
PR head; older green checks do not certify subsequent commits.
