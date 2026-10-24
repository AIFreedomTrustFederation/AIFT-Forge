import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";

const defaultProviders = [
  {
    id: "ollama-localhost",
    type: "ollama",
    label: "Ollama Localhost",
    endpoint: "http://127.0.0.1:11434",
    localOnly: true,
    openSource: true,
    requiresApiKey: false,
    enabled: true,
    priority: 100
  },
  {
    id: "llama-cpp-localhost",
    type: "llama-cpp",
    label: "llama.cpp Localhost",
    endpoint: "http://127.0.0.1:8080",
    localOnly: true,
    openSource: true,
    requiresApiKey: false,
    enabled: false,
    priority: 50
  },
  {
    id: "local-openai-compatible",
    type: "openai-compatible-local",
    label: "Local OpenAI-Compatible Server",
    endpoint: "http://127.0.0.1:1234/v1",
    localOnly: true,
    openSource: true,
    requiresApiKey: false,
    enabled: false,
    priority: 40
  }
];

function providerDir(paths) {
  return join(paths.repoRoot, ".forge", "providers");
}

function validateProviderId(id) {
  if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
    throw new Error(
      "Provider id must start with a letter or digit and contain only letters, digits, dots, underscores, or hyphens."
    );
  }
  return id;
}

function providerFile(paths, id) {
  return join(providerDir(paths), `${validateProviderId(id)}.json`);
}

function ensureProviderDir(paths) {
  mkdirSync(providerDir(paths), { recursive: true });
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

export function ensureProviderRegistry(paths) {
  ensureProviderDir(paths);

  for (const provider of defaultProviders) {
    const file = providerFile(paths, provider.id);

    if (!existsSync(file)) {
      writeJson(file, {
        schema: "aift.forge.local-provider.v1",
        ...provider,
        createdAt: new Date().toISOString()
      });
    }
  }
}

export function readProviders(paths) {
  ensureProviderRegistry(paths);

  const dir = providerDir(paths);
  const providers = [];

  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;

    try {
      providers.push(JSON.parse(readFileSync(join(dir, file), "utf8")));
    } catch {
      providers.push({
        id: file.replace(/\.json$/, ""),
        enabled: false,
        error: "Invalid provider JSON"
      });
    }
  }

  return providers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function addProvider(paths, provider) {
  const id = validateProviderId(provider.id);
  if (!provider.endpoint) throw new Error("Provider endpoint is required.");
  ensureProviderDir(paths);

  const next = {
    schema: "aift.forge.local-provider.v1",
    id,
    type: provider.type ?? "ollama",
    label: provider.label ?? id,
    endpoint: provider.endpoint,
    localOnly: true,
    openSource: provider.openSource ?? true,
    requiresApiKey: false,
    enabled: provider.enabled ?? true,
    priority: provider.priority ?? 80,
    updatedAt: new Date().toISOString()
  };

  writeJson(providerFile(paths, id), next);
  return next;
}

function getJson(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let parsed;

    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, error: "invalid url" });
      return;
    }

    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        timeout: timeoutMs
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: JSON.parse(body)
            });
          } catch {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              text: body
            });
          }
        });
      }
    );

    req.on("error", (error) => {
      resolve({ ok: false, error: error.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });

    req.end();
  });
}

function isPrivateOrLocal(endpoint) {
  return endpoint.startsWith("http://127.0.0.1") ||
    endpoint.startsWith("http://localhost") ||
    /^http:\/\/10\./.test(endpoint) ||
    /^http:\/\/192\.168\./.test(endpoint) ||
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(endpoint);
}

function healthUrl(provider) {
  const endpoint = provider.endpoint.replace(/\/$/, "");

  if (provider.type === "ollama") return `${endpoint}/api/tags`;
  if (provider.type === "llama-cpp") return `${endpoint}/health`;
  if (provider.type === "openai-compatible-local") return `${endpoint}/models`;

  return endpoint;
}

export async function checkProvider(provider) {
  if (provider.error) {
    return {
      ...provider,
      ok: false,
      reason: provider.error
    };
  }

  if (!provider.enabled) {
    return {
      ...provider,
      ok: false,
      reason: "Provider disabled."
    };
  }

  if (provider.requiresApiKey) {
    return {
      ...provider,
      ok: false,
      reason: "Provider requires API key. Forbidden by local-only governance."
    };
  }

  if (!isPrivateOrLocal(provider.endpoint)) {
    return {
      ...provider,
      ok: false,
      reason: "Endpoint is not localhost or private LAN. Forbidden."
    };
  }

  const result = await getJson(healthUrl(provider));

  if (!result.ok) {
    return {
      ...provider,
      ok: false,
      reason: result.error ?? `Health check failed with status ${result.status ?? "unknown"}.`
    };
  }

  return {
    ...provider,
    ok: true,
    reason: "Provider reachable."
  };
}

export async function providerHealth(paths) {
  const providers = readProviders(paths);
  const results = [];

  for (const provider of providers) {
    results.push(await checkProvider(provider));
  }

  return results;
}

export async function bestProvider(paths) {
  const health = await providerHealth(paths);
  return health.find((provider) => provider.ok) ?? null;
}
