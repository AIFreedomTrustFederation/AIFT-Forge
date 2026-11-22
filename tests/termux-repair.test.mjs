import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

const script = readFileSync(new URL("../hard-fix-termux-install.sh", import.meta.url));
let root;
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const read = (path) => readFileSync(join(root, path), "utf8");
const write = (path, data) => writeFileSync(join(root, path), data);

function repair() {
  return spawnSync("bash", [join(root, "hard-fix-termux-install.sh")], {
    cwd: tmpdir(), encoding: "utf8", env: { ...process.env, PATH: join(root, "bin") + ":" + process.env.PATH },
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "forge-repair-"));
  git("init", "-q");
  mkdirSync(join(root, "bin"));
  mkdirSync(join(root, "scripts"));
  write("hard-fix-termux-install.sh", script);
  write("package.json", '{"scripts":{"typecheck":"tsc","qa:local":"npm run typecheck"}}\n');
  write("package-lock.json", "locked npm inputs\n");
  write("pnpm-lock.yaml", "locked workspace inputs\n");
  write("scripts/aift-platform-pipeline.sh", 'echo pipeline >> .git/commands\n');
  writeFileSync(join(root, "bin/npm"), `#!${process.execPath}\nrequire("node:fs").appendFileSync(".git/commands", process.argv.slice(2).join(" ") + "\\n");\n`, { mode: 0o755 });
  git("add", ".");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

it("repairs the old profile from this revision, preserves the old manifest, and can run twice", () => {
  write("package.json", '{"scripts":{"typecheck":"echo passed"}}');
  rmSync(join(root, "package-lock.json"));
  rmSync(join(root, "pnpm-lock.yaml"));
  expect(repair().status).toBe(0);
  expect(repair().status).toBe(0);
  expect(git("status", "--porcelain")).toBe("");
  const backups = readdirSync(join(root, ".git/termux-profile-backups"));
  expect(backups).toHaveLength(1);
  expect(read(".git/termux-profile-backups/" + backups[0] + "/package.json")).toContain("echo passed");
  expect(read(".git/commands")).toBe("ci --ignore-scripts --no-workspaces\npipeline\n".repeat(2));
});

it("preserves staging and refuses a higher-priority shrinkwrap before running npm", () => {
  write("package.json", "staged\n");
  git("add", "package.json");
  expect(repair().status).toBe(1);
  expect(git("show", ":package.json")).toBe("staged");
  expect(read("package.json")).toBe("staged\n");
  git("restore", "--staged", "package.json");
  write("npm-shrinkwrap.json", "{}");
  expect(repair().status).toBe(1);
  expect(read("package.json")).toBe("staged\n");
  expect(() => read(".git/commands")).toThrow();
});
