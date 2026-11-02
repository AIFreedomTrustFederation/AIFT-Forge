#!/usr/bin/env python3
"""Run Forge's existing local QA gate and emit unsigned, commit-bound v1 evidence."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

REPOSITORY = "AIFreedomTrustFederation/AIFT-Forge"
ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r"[0-9a-f]{40}\Z")
RUN_ID = re.compile(r"[1-9][0-9]*\Z")
RUN_ATTEMPT = re.compile(r"[1-9][0-9]{0,9}\Z")


def invoke(command: list[str], root: Path) -> int:
    try:
        return subprocess.run(command, cwd=root, check=False).returncode
    except OSError as exc:
        print(f"cannot execute {command[0]}: {exc}", file=sys.stderr)
        return 127


def worktree_status(root: Path) -> int:
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain=v1", "--untracked-files=all"],
            cwd=root, capture_output=True, text=True, check=False,
        )
    except OSError:
        return 127
    if result.returncode or result.stdout:
        return result.returncode or 1
    # Git can hide tracked-file modifications when assume-unchanged or
    # skip-worktree is set. Reject such index flags instead of claiming QA
    # exercised an ordinary, fully observable checkout.
    try:
        flags = subprocess.run(
            ["git", "ls-files", "-v", "-z"], cwd=root,
            capture_output=True, check=False,
        )
    except OSError:
        return 127
    if flags.returncode:
        return flags.returncode
    if any(entry and entry[:1] != b"H" for entry in flags.stdout.split(b"\0")):
        return 1
    # Replacement refs can substitute a different source tree without changing
    # the reported HEAD SHA or making git status show a dirty checkout.
    try:
        replacements = subprocess.run(
            ["git", "replace", "-l"], cwd=root,
            capture_output=True, text=True, check=False,
        )
    except OSError:
        return 127
    if replacements.returncode:
        return replacements.returncode
    return 1 if replacements.stdout.strip() else 0


def generate(root: Path, output: Path, env: dict[str, str] | None = None) -> int:
    env = os.environ if env is None else env
    try:
        root = root.resolve()
        # Preserve the final path component: resolve() would follow an output symlink
        # and cause the cleanup below to delete its target instead of the link.
        output = output.absolute()
        if output.is_symlink():
            raise ValueError("verification output must not be a symlink")
        if output.resolve().is_relative_to(root):
            raise ValueError("verification output must be outside the checkout")
        # Fail closed: an invalid rerun must not leave a prior success record for upload.
        output.unlink(missing_ok=True)
        result = subprocess.run(["git", "rev-parse", "--verify", "HEAD"], cwd=root,
                                capture_output=True, text=True, check=False)
        commit = result.stdout.strip()
        if result.returncode or not SHA.fullmatch(commit):
            raise ValueError("cannot establish exact checkout commit")
        if env.get("GITHUB_SHA") and env["GITHUB_SHA"] != commit:
            raise ValueError("GITHUB_SHA differs from checkout HEAD")
        if env.get("GITHUB_REPOSITORY") and env["GITHUB_REPOSITORY"] != REPOSITORY:
            raise ValueError("GITHUB_REPOSITORY differs from Forge")
        source_type = "github-actions" if env.get("GITHUB_ACTIONS") == "true" else "local"
        if source_type == "github-actions" and (env.get("GITHUB_SHA") != commit or
                                                env.get("GITHUB_REPOSITORY") != REPOSITORY):
            raise ValueError("GitHub Actions checkout identity is missing or inconsistent")
        run_url = None
        run_attempt = None
        if source_type == "github-actions":
            run_id = env.get("GITHUB_RUN_ID", "")
            if not RUN_ID.fullmatch(run_id):
                raise ValueError("GitHub Actions requires a valid run ID")
            run_url = f"https://github.com/{REPOSITORY}/actions/runs/{run_id}"
            attempt_text = env.get("GITHUB_RUN_ATTEMPT", "")
            if not RUN_ATTEMPT.fullmatch(attempt_text):
                raise ValueError("GitHub Actions requires a valid run attempt")
            run_attempt = int(attempt_text)
        before = worktree_status(root)
        qa_code = invoke(["npm", "run", "qa:local"], root)
        after = worktree_status(root)
        # A clean worktree does not prove the QA command left HEAD unchanged.
        final_head = subprocess.run(
            ["git", "rev-parse", "--verify", "HEAD"], cwd=root,
            capture_output=True, text=True, check=False,
        )
        identity_code = 0 if (final_head.returncode == 0 and
                              final_head.stdout.strip() == commit) else 1
        tree_code = before or after
        checks = [
            {"id": "forge_qa", "command": "npm run qa:local",
             "status": "passed" if qa_code == 0 else "failed", "exit_code": qa_code},
            {"id": "worktree", "command": "git status --porcelain=v1 --untracked-files=all; git ls-files -v -z (before and after)",
             "status": "passed" if tree_code == 0 else "failed", "exit_code": tree_code},
            {"id": "checkout_identity", "command": "git rev-parse --verify HEAD (before and after QA)",
             "status": "passed" if identity_code == 0 else "failed", "exit_code": identity_code},
        ]
        record = {
            "schema": "aift.verification.v1",
            "repository": REPOSITORY,
            "commit_sha": commit,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": {"type": source_type, "run_url": run_url,
                       "run_attempt": run_attempt},
            "checks": checks,
            "overall_status": "passed" if all(c["status"] == "passed" for c in checks) else "failed",
            "security": {"status": "not_checked", "reason": "Forge local QA is not a security assessment."},
            "dependencies": {"status": "not_checked", "reason": "Cross-repository dependency contracts are not exercised."},
            "deployment": {"status": "not_applicable", "reason": "This workflow does not deploy."},
            "limitations": [
                "QA runs lint, typecheck, tests and build; this is not a live Federation integration test.",
                "No Genesis authorization, Runtime integration, TheMindofAll provenance or VPS deployment is checked.",
                "Evidence is self-reported and unsigned; the AIFT-OS collector does not yet support Forge.",
                "Git worktree checks exclude ignored files and external state.",
            ],
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        # Stage a complete record beside its destination; a failed/interrupted write
        # must never leave partial JSON at the path uploaded by the workflow.
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=output.parent,
                prefix=f".{output.name}.", suffix=".tmp", delete=False,
            ) as staged:
                temporary = Path(staged.name)
                staged.write(json.dumps(record, sort_keys=True, indent=2) + "\n")
                staged.flush()
                os.fsync(staged.fileno())
            os.replace(temporary, output)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
        print(f"Forge verification evidence: {output} ({record['overall_status']})")
        return 0 if record["overall_status"] == "passed" else 1
    except (OSError, ValueError) as exc:
        print(f"Forge verification could not run: {exc}", file=sys.stderr)
        return 2


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    return generate(ROOT, args.output)


if __name__ == "__main__":
    sys.exit(main())
