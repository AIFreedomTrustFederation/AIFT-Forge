import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { addProvider, readProviders } from "../packages/forge-core/src/providers/registry.mjs";

test("provider IDs cannot overwrite JSON outside the provider registry", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "aift-forge-provider-"));
  const repoRoot = join(sandbox, "checkout");
  mkdirSync(repoRoot);
  const inside = join(repoRoot, "important.json");
  const outside = join(sandbox, "outside.json");
  const original = '{"preserve":true}\n';
  writeFileSync(inside, original);
  writeFileSync(outside, original);

  try {
    for (const id of ["../../important", "../../../outside"]) {
      assert.throws(
        () => addProvider({ repoRoot }, { id, endpoint: "http://127.0.0.1:11434" }),
        /Provider id/,
        `unsafe provider id ${id} should be rejected`
      );
    }
    assert.equal(readFileSync(inside, "utf8"), original);
    assert.equal(readFileSync(outside, "utf8"), original);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("ordinary provider IDs remain supported", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "aift-forge-provider-"));
  try {
    const provider = addProvider(
      { repoRoot },
      { id: "local-ollama.v1", endpoint: "http://127.0.0.1:11434", type: "ollama" }
    );
    assert.equal(provider.id, "local-ollama.v1");
    assert.equal(existsSync(join(repoRoot, ".forge", "providers", "local-ollama.v1.json")), true);
    assert.equal(readProviders({ repoRoot }).find((item) => item.id === provider.id)?.endpoint, provider.endpoint);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("provider IDs with separators or control characters are rejected", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "aift-forge-provider-"));
  try {
    for (const id of ["../escape", "nested/name", "nested\\name", ".hidden", "bad\nname", ""]) {
      assert.throws(
        () => addProvider({ repoRoot }, { id, endpoint: "http://127.0.0.1:11434" }),
        /Provider id/
      );
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
