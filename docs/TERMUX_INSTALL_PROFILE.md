# Android / Termux Install Profile

AIFT-Forge uses a protected Android/Termux install profile because Termux reports `process.platform` as `android`.

Many native Node packages only publish binaries for `linux`, `darwin`, or `win32`, so the Termux profile intentionally disables workspace-wide native dependency installation.

The Termux profile validates:

- provider registry
- local-only inference policy
- CLI command syntax
- portable JavaScript test runner
- repository health
- no cloud fallback

To repair the install from a Git checkout, run:

    bash hard-fix-termux-install.sh

The repair restores the root package manifest and both lockfiles from the current
commit, installs the root dependencies with `npm ci --ignore-scripts --no-workspaces`,
and runs the existing platform pipeline. Review or commit intended manifest and
lockfile edits first. The repair preserves unstaged versions of files it replaces
under the checkout's Git directory in `termux-profile-backups/` and prints the
backup path. It stops on staged profile changes or an npm shrinkwrap file.

To run the platform checks separately on Termux:

    npm run pipeline
