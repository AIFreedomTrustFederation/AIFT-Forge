import { describe, expect, it } from "vitest";
import {
  checkProvider,
  isPrivateOrLocal,
} from "../packages/forge-core/src/providers/registry.mjs";

const allowed = [
  "http://127.0.0.1:11434",
  "http://localhost:8080/health",
  "http://LOCALHOST:1234/v1",
  "http://[::1]:8080",
  "http://10.0.0.1:11434",
  "http://192.168.1.50:11434",
  "http://172.16.0.1:11434",
  "http://172.31.255.255:11434"
];
const blocked = [
  "http://127.0.0.1.attacker.invalid:8080",
  "http://localhost.attacker.invalid:11434",
  "http://10.attacker.invalid:80",
  "http://192.168.1.2.evil.invalid:80",
  "http://172.16.attacker.invalid:80",
  "http://127.0.0.1@public.example:80",
  "http://localhost:11434@public.example:80",
  "http://127.0.0.1:8080@public.example:80",
  "http://8.8.8.8:80",
  "http://172.32.0.1:80",
  "http://192.169.0.1:80",
  "https://127.0.0.1:443",
  "file:///etc/passwd",
  "not a URL",
  "",
  null,
  "http://256.1.1.1:80",
  "http://10.0.0.1:99999",
  "http://10.0.0.1:abc"
];

describe("local-only provider URL policy", () => {
  it.each(allowed)("accepts private endpoint %s", (endpoint) => {
    expect(isPrivateOrLocal(endpoint)).toBe(true);
  });

  it.each(blocked)("rejects unsafe endpoint %s", (endpoint) => {
    expect(isPrivateOrLocal(endpoint)).toBe(false);
  });

  it("rejects a lookalike public host before issuing a health probe", async () => {
    const result = await checkProvider({
      id: "spoofed-public",
      type: "ollama",
      enabled: true,
      requiresApiKey: false,
      endpoint: "http://127.0.0.1.attacker.invalid:11434",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Endpoint is not localhost or private LAN. Forbidden.");
  });
});
