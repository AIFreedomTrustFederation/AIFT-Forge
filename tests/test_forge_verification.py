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

    def test_worktree_evidence_command_lists_all_probes(self):
        # The producer invokes three Git checks before and after QA. The
        # machine-readable command description must not omit replace refs.
        self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        record = json.loads(self.output.read_text())
        command = record["checks"][1]["command"]
        for probe in ("git status --porcelain=v1", "git ls-files -v -z", "git replace -l"):
            with self.subTest(probe=probe):
                self.assertIn(probe, command)

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

    def test_hidden_index_flag_detected_after_ordinary_tracked_file(self):
        (self.root / "aaa.txt").write_text("ordinary\\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.root), "add", "aaa.txt"], check=True)
        subprocess.run(["git", "-C", str(self.root), "commit", "-qm", "add first file"], check=True)
        subprocess.run(["git", "-C", str(self.root), "update-index",
                        "--assume-unchanged", "tracked.txt"], check=True)
        (self.root / "tracked.txt").write_text("tampered\\n", encoding="utf-8")
        self.assertEqual(subprocess.check_output(
            ["git", "-C", str(self.root), "status", "--porcelain=v1"], text=True), "")
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        self.assertEqual(json.loads(self.output.read_text())["checks"][1]["status"], "failed")

    def test_skip_worktree_index_flag_cannot_claim_clean_checkout(self):
        subprocess.run(["git", "-C", str(self.root), "update-index",
                        "--skip-worktree", "tracked.txt"], check=True)
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        self.assertEqual(json.loads(self.output.read_text())["checks"][1]["status"], "failed")

    def test_replace_ref_cannot_hide_substituted_source_tree(self):
        (self.root / "tracked.txt").write_text("substituted\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.root), "add", "tracked.txt"], check=True)
        subprocess.run(["git", "-C", str(self.root), "commit", "-qm", "alternate source"], check=True)
        alternate = subprocess.check_output(
            ["git", "-C", str(self.root), "rev-parse", "HEAD"], text=True).strip()
        subprocess.run(["git", "-C", str(self.root), "reset", "--hard", self.sha], check=True,
                       capture_output=True)

        def replace_source(command, root):
            subprocess.run(["git", "-C", str(root), "replace", self.sha, alternate], check=True)
            subprocess.run(["git", "-C", str(root), "reset", "--hard", self.sha], check=True,
                           capture_output=True)
            self.assertEqual((root / "tracked.txt").read_text(encoding="utf-8"), "substituted\n")
            self.assertEqual(subprocess.check_output(
                ["git", "-C", str(root), "status", "--porcelain=v1", "--untracked-files=all"],
                text=True), "")
            self.assertEqual(subprocess.check_output(
                ["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip(), self.sha)
            return 0

        producer.invoke = replace_source
        self.assertEqual(producer.generate(self.root, self.output, {}), 1)
        record = json.loads(self.output.read_text())
        self.assertEqual(record["checks"][0]["status"], "passed")
        self.assertEqual(record["checks"][1]["status"], "failed")
        self.assertEqual(record["checks"][2]["status"], "passed")

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
               "GITHUB_RUN_ATTEMPT": "2",
               "GITHUB_SHA": self.sha, "GITHUB_REPOSITORY": producer.REPOSITORY}
        self.assertEqual(producer.generate(self.root, self.output, env), 0)
        self.assertEqual(json.loads(self.output.read_text())["source"]["run_url"],
                         f"https://github.com/{producer.REPOSITORY}/actions/runs/12345")
        self.assertEqual(json.loads(self.output.read_text())["source"]["run_attempt"], 2)
        self.output.unlink()
        self.assertEqual(producer.generate(self.root, self.output, {**env, "GITHUB_RUN_ID": "nope"}), 2)
        self.assertFalse(self.output.exists())
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_ACTIONS": "true",
                                                                  "GITHUB_RUN_ID": "12345"}), 2)
        self.assertFalse(self.output.exists())


    def test_oversized_github_run_id_fails_closed(self):
        env = {"GITHUB_ACTIONS": "true", "GITHUB_RUN_ATTEMPT": "1",
               "GITHUB_SHA": self.sha, "GITHUB_REPOSITORY": producer.REPOSITORY}
        for valid in ("1", "9" * 20):
            with self.subTest(valid_length=len(valid)):
                self.assertEqual(producer.generate(self.root, self.output,
                                                   {**env, "GITHUB_RUN_ID": valid}), 0)
                self.output.unlink()
        for invalid in ("9" * 21, "1" * 5000):
            with self.subTest(invalid_length=len(invalid)):
                self.assertEqual(producer.generate(self.root, self.output,
                                                   {**env, "GITHUB_RUN_ID": invalid}), 2)
                self.assertFalse(self.output.exists())

    def test_actions_attempt_missing_or_invalid_fails_closed(self):
        env = {"GITHUB_ACTIONS": "true", "GITHUB_RUN_ID": "12345",
               "GITHUB_SHA": self.sha, "GITHUB_REPOSITORY": producer.REPOSITORY}
        for invalid in (None, "0", "1e3", "01", "1" * 5000):
            with self.subTest(attempt=invalid):
                candidate = dict(env)
                if invalid is not None:
                    candidate["GITHUB_RUN_ATTEMPT"] = invalid
                self.assertEqual(producer.generate(self.root, self.output, candidate), 2)
                self.assertFalse(self.output.exists())

    def test_local_source_has_no_run_attempt(self):
        self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        self.assertIsNone(json.loads(self.output.read_text())["source"]["run_attempt"])

    def test_output_symlink_rejected_without_modifying_target(self):
        sentinel = Path(self.temp.name) / "sentinel.json"
        sentinel.write_text("KEEP ME", encoding="utf-8")
        self.output.symlink_to(sentinel)
        self.assertEqual(producer.generate(self.root, self.output, {}), 2)
        self.assertTrue(self.output.is_symlink())
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "KEEP ME")


    def test_atomic_publish_stages_complete_json_before_exposing_output(self):
        actual_link = producer.os.link
        observations = []

        def inspect_then_publish(source, destination):
            self.assertFalse(Path(destination).exists(), "final path must remain absent until publish")
            staged_record = json.loads(Path(source).read_text(encoding="utf-8"))
            self.assertEqual(staged_record["commit_sha"], self.sha)
            self.assertEqual(staged_record["overall_status"], "passed")
            observations.append(True)
            return actual_link(source, destination)

        with mock.patch.object(producer.os, "link", side_effect=inspect_then_publish):
            self.assertEqual(producer.generate(self.root, self.output, {}), 0)
        self.assertEqual(observations, [True])
        self.assertEqual(json.loads(self.output.read_text())["overall_status"], "passed")

    def test_atomic_publish_rejects_racing_destination(self):
        # An unrelated writer can create the upload path after the initial
        # cleanup. Never overwrite that file with a purported QA result.
        actual_link = producer.os.link

        def racing_writer(source, destination):
            Path(destination).write_text("CONCURRENT_WRITER", encoding="utf-8")
            return actual_link(source, destination)

        with mock.patch.object(producer.os, "link", side_effect=racing_writer):
            self.assertEqual(producer.generate(self.root, self.output, {}), 2)
        self.assertEqual(self.output.read_text(encoding="utf-8"), "CONCURRENT_WRITER")
        self.assertEqual(list(self.output.parent.glob(f".{self.output.name}.*.tmp")), [])

    def test_atomic_publish_failure_leaves_no_partial_uploadable_record(self):
        with mock.patch.object(producer.os, "link", side_effect=OSError("simulated publish failure")):
            self.assertEqual(producer.generate(self.root, self.output, {}), 2)
        self.assertFalse(self.output.exists(), "failed publication must not leave a partial record")
        self.assertEqual(list(self.output.parent.glob(f".{self.output.name}.*.tmp")), [],
                         "failed publication must clean up staged evidence")


if __name__ == "__main__":
    unittest.main()
