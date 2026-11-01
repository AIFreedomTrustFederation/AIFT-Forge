"""Real Git and synthetic npm regressions for Forge evidence production."""

import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

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
        self.assertEqual([c["id"] for c in record["checks"]], ["forge_qa", "worktree"])
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

    def test_checkout_sha_mismatch_fails_closed(self):
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_SHA": "0" * 40}), 2)
        self.assertFalse(self.output.exists())

    def test_repository_mismatch_fails_closed(self):
        self.assertEqual(producer.generate(self.root, self.output, {"GITHUB_REPOSITORY": "other/repo"}), 2)
        self.assertFalse(self.output.exists())

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


if __name__ == "__main__":
    unittest.main()
