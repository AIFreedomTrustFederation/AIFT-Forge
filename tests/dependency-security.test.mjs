import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));

describe("critical dependency security floors", () => {
  it("pins patched direct dependencies", () => {
    const forgeCore = readJson("packages/forge-core/package.json");
    const android = readJson("apps/android/package.json");

    expect(forgeCore.dependencies["simple-git"]).toBe("4.0.1");
    expect(android.dependencies["@capacitor/android"]).toBe("8.4.3");
    expect(android.dependencies["@capacitor/core"]).toBe("8.4.3");
    expect(android.devDependencies["@capacitor/cli"]).toBe("8.4.3");
  });

  it("forces and locks the patched argv parser", () => {
    const workspace = readFileSync(
      path.join(repoRoot, "pnpm-workspace.yaml"),
      "utf8",
    );
    const lockfile = readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8");

    expect(workspace).toContain("'@simple-git/argv-parser': 2.0.1");
    expect(lockfile).toContain("'@simple-git/argv-parser@2.0.1':");
    expect(lockfile).not.toContain("'@simple-git/argv-parser@1.1.1':");
    expect(lockfile).not.toContain("'@capacitor/android@8.4.2':");
    expect(lockfile).not.toContain("simple-git@3.36.0:");
  });
});
