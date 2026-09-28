import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function trackedFiles(args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

describe("shell source integrity", () => {
  it("parses every tracked shell source with its declared interpreter", () => {
    const shellFiles = new Set([
      ...trackedFiles(["ls-files", "-z", "*.sh"]),
      ...trackedFiles(["grep", "-Ilz", "^#!.*bash", "--"]),
    ]);

    expect(shellFiles.size).toBeGreaterThan(0);

    for (const file of shellFiles) {
      const firstLine = readFileSync(path.join(repoRoot, file), "utf8").split("\n", 1)[0];
      const shell = firstLine === "#!/usr/bin/env sh" ? "sh" : firstLine.includes("bash") ? "bash" : null;

      expect(shell, `${file} has an unsupported shell shebang`).not.toBeNull();

      const result = spawnSync(shell, ["-n", file], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      expect(result.status, `${file}: ${(result.stderr || result.stdout).trim()}`).toBe(0);
    }
  });
});
