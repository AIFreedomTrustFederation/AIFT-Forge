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

test("provider health checks reject lookalike private hosts before making HTTP requests", async () => {
  const { checkProvider } = await import("../packages/forge-core/src/providers/registry.mjs");
  for (const endpoint of [
    "http://localhost.attacker.invalid/collect",
    "http://127.0.0.1.attacker.invalid/collect",
    "http://10.attacker.invalid/collect",
    "http://192.168.attacker.invalid/collect",
    "http://172.16.attacker.invalid/collect",
    "http://127.0.0.1@attacker.invalid/collect",
    "http://127.0.0.1:8080@attacker.invalid/collect",
    "https://127.0.0.1",
    "http://172.32.0.1",
    "http://192.169.0.1",
    "not-a-url"
  ]) {
    const result = await checkProvider({
      id: "host-boundary-test", type: "custom", enabled: true,
      requiresApiKey: false, endpoint
    });
    assert.equal(result.ok, false, endpoint);
    assert.match(result.reason, /Endpoint is not localhost or private LAN/, endpoint);
  }
});

test("local HTTP provider health checks still work", async () => {
  const { createServer } = await import("node:http");
  const { checkProvider } = await import("../packages/forge-core/src/providers/registry.mjs");
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const result = await checkProvider({
      id: "local-health-test", type: "custom", enabled: true,
      requiresApiKey: false, endpoint: `http://127.0.0.1:${server.address().port}`
    });
    assert.equal(result.ok, true, result.reason);
    assert.equal(result.reason, "Provider reachable.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
