import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it, expect } from "vitest";

const manifest = JSON.parse(readFileSync(new URL("../aift.repo.json", import.meta.url)));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

describe("mandatory manifest verification", () => {
  it("uses the canonical QA chain without optional stages", () => {
    expect(manifest.commands.verify).toBe("npm run qa:local");
    expect(pkg.scripts["qa:local"]).toBe("npm run lint && npm run typecheck && npm run test && npm run build");
  });
  for (const mode of ["pass", "missing", "failed"]) {
    it(`preserves ${mode} gate behavior through the manifest command`, () => {
      const root = mkdtempSync(join(tmpdir(), "forge-contract-"));
      try {
        const scripts = { "qa:local": pkg.scripts["qa:local"] };
        for (const stage of ["lint", "typecheck", "test", "build"]) {
          if (mode === "missing" && stage === "typecheck") continue;
          scripts[stage] = `node -e "process.exit(${mode === "failed" && stage === "test" ? 7 : 0})"`;
        }
        writeFileSync(join(root, "package.json"), JSON.stringify({ private: true, scripts }));
        let result;
        for (const command of manifest.commands.verify.split(" && ")) {
          expect(command).toMatch(/^npm run [a-z:-]+(?: --if-present)?$/);
          result = spawnSync("npm", command.split(" ").slice(1), {
            cwd: root, encoding: "utf8", timeout: 15000,
          });
          expect(result.error).toBeUndefined();
          if (result.status !== 0) break;
        }
        if (mode === "pass") expect(result.status).toBe(0);
        else expect(result.status).not.toBe(0);
      } finally { rmSync(root, { recursive: true, force: true }); }
    });
  }
});
