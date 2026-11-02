"""Real Git and synthetic npm regressions for Forge evidence production."""

import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/run_forge_verification.py"
spec = importlib.util.spec_from_file_location("run_forge_verification", SCRIPT)
producer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(producer)


class ForgeVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.email", "audit@example.invalid"], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.name", "Audit"], check=True)
        (self.root / "tracked.txt").write_text("baseline\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.root), "add", "tracked.txt"], check=True)
        subprocess.run(["git", "-C", str(self.root), "commit", "-qm", "baseline"], check=True)
        self.sha = subprocess.check_output(["git", "-C", str(self.root), "rev-parse", "HEAD"], text=True).strip()
        self.output = Path(self.temp.name) / "result.json"
        self.original_invoke = producer.invoke
        self.addCleanup(lambda: setattr(producer, "invoke", self.original_invoke))
        producer.invoke = lambda command, root: 0

    def test_pass_emits_schema_commit_and_explicit_gaps(self):
        self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        record = json.loads(self.output.read_text())
        self.assertEqual(record["repository"], producer.REPOSITORY)
        self.assertEqual(record["commit_sha"], self.sha)
        self.assertEqual(record["overall_status"], "passed")
        self.assertEqual([c["id"] for c in record["checks"]], ["forge_qa", "worktree", "checkout_identity"])
        self.assertEqual(record["security"]["status"], "not_checked")
        self.assertEqual(record["dependencies"]["status"], "not_checked")
        self.assertEqual(record["deployment"]["status"], "not_applicable")

    def test_qa_failure_publishes_negative_evidence(self):
        producer.invoke = lambda command, root: 7
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        record = json.loads(self.output.read_text())
        self.assertEqual(record["overall_status"], "failed")
        self.assertEqual(record["checks"][0]["exit_code"], 7)

    def test_dirty_worktree_fails_even_if_qa_passes(self):
        (self.root / "unexpected.txt").write_text("untracked\n")
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        self.assertEqual(json.loads(self.output.read_text())["checks"][1]["status"], "failed")

    def test_assume_unchanged_cannot_hide_mutated_tracked_source(self):
        def hide_mutation(command, root):
            subprocess.run(["git", "-C", str(root), "update-index",
                            "--assume-unchanged", "tracked.txt"], check=True)
            (root / "tracked.txt").write_text("tampered\\n", encoding="utf-8")
            self.assertEqual(subprocess.check_output(
                ["git", "-C", str(root), "status", "--porcelain=v1"], text=True), "")
            return 0

        producer.invoke = hide_mutation
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        record = json.loads(self.output.read_text())
        self.assertEqual(record["checks"][0]["status"], "passed")
        self.assertEqual(record["checks"][1]["status"], "failed")
        self.assertEqual(record["checks"][2]["status"], "passed")

    def test_skip_worktree_index_flag_cannot_claim_clean_checkout(self):
        subprocess.run(["git", "-C", str(self.root), "update-index",
                        "--skip-worktree", "tracked.txt"], check=True)
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        self.assertEqual(json.loads(self.output.read_text())["checks"][1]["status"], "failed")

    def test_clean_worktree_cannot_hide_checkout_head_drift(self):
        def advance_head(command, root):
            (root / "tracked.txt").write_text("new commit\\n", encoding="utf-8")
            subprocess.run(["git", "-C", str(root), "add", "tracked.txt"], check=True)
            subprocess.run(["git", "-C", str(root), "commit", "-qm", "advance HEAD"], check=True)
            return 0

        producer.invoke = advance_head
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        record = json.loads(self.output.read_text())
        self.assertEqual(record["commit_sha"], self.sha)
        self.assertEqual(record["checks"][0]["status"], "passed")
        self.assertEqual(record["checks"][1]["status"], "passed")
        self.assertEqual(record["checks"][2]["status"], "failed")
        self.assertEqual(record["overall_status"], "failed")

    def test_checkout_sha_mismatch_fails_closed(self):
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_SHA": "0" * 40}), 2)
        self.assertFalse(self.output.exists())

    def test_repository_mismatch_fails_closed(self):
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_REPOSITORY": "other/repo"}), 2)
        self.assertFalse(self.output.exists())

    def test_identity_failure_removes_stale_success_evidence(self):
        self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        self.assertEqual(json.loads(self.output.read_text())["overall_status"], "passed")
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_SHA": "0" * 40}), 2)
        self.assertFalse(self.output.exists(), "invalid rerun must not leave uploadable success evidence")

    def test_output_inside_checkout_rejected(self):
        self.assertEqual(producer.generate(self.root, self.root / "evidence.json", {}), 2)
        self.assertFalse((self.root / "evidence.json").exists())

    def test_actions_run_url_requires_valid_run_id(self):
        env = {"GITHUB_ACTIONS": "true", "GITHUB_RUN_ID": "12345",
               "GITHUB_SHA": self.sha, "GITHUB_REPOSITORY": producer.REPOSITORY}
        self.assertEqual(producer.generate(self.root, self.output, env), 0)
        self.assertEqual(json.loads(self.output.read_text())["source"]["run_url"],
                         f"https://github.com/{producer.REPOSITORY}/actions/runs/12345")
        self.output.unlink()
        self.assertEqual(producer.generate(self.root, self.output, {**env, "GITHUB_RUN_ID": "nope"}), 2)
        self.assertFalse(self.output.exists())
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_ACTIONS": "true",
                                                                  "GITHUB_RUN_ID": "12345"}), 2)
        self.assertFalse(self.output.exists())


    def test_output_symlink_rejected_without_modifying_target(self):
        sentinel = Path(self.temp.name) / "sentinel.json"
        sentinel.write_text("KEEP ME", encoding="utf-8")
        self.output.symlink_to(sentinel)
        self.assertEqual(producer.generate(self.root, self.output, {}), 2)
        self.assertTrue(self.output.is_symlink())
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "KEEP ME")


    def test_atomic_publish_stages_complete_json_before_exposing_output(self):
        actual_replace = producer.os.replace
        observations = []

        def inspect_then_publish(source, destination):
            self.assertFalse(Path(destination).exists(), "final path must remain absent until publish")
            staged_record = json.loads(Path(source).read_text(encoding="utf-8"))
            self.assertEqual(staged_record["commit_sha"], self.sha)
            self.assertEqual(staged_record["overall_status"], "passed")
            observations.append(True)
            return actual_replace(source, destination)

        with mock.patch.object(producer.os, "replace", side_effect=inspect_then_publish):
            self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        self.assertEqual(observations, [True])
        self.assertEqual(json.loads(self.output.read_text())["overall_status"], "passed")

    def test_atomic_publish_failure_leaves_no_partial_uploadable_record(self):
        with mock.patch.object(producer.os, "replace", side_effect=OSError("simulated publish failure")):
            self.assertEqual(producer.generate(self.root, self.output, {}), 2)
        self.assertFalse(self.output.exists(), "failed publication must not leave a partial record")
        self.assertEqual(list(self.output.parent.glob(f".{self.output.name}.*.tmp")), [],
                         "failed publication must clean up staged evidence")


if __name__ == "__main__":
    unittest.main()
