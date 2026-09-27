import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

describe("repository hygiene", () => {
  it("does not track corrupt Forge memory backups", () => {
    const tracked = execFileSync(
      "git",
      ["ls-files", "--", ".forge/memory.json.corrupt-*"],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim();

    expect(tracked).toBe("");
  });

  it("ignores future corrupt Forge memory backups", () => {
    const ignored = spawnSync(
      "git",
      ["check-ignore", "--quiet", "--no-index", ".forge/memory.json.corrupt-test"],
      { cwd: repoRoot },
    );

    expect(ignored.status).toBe(0);
  });
});
