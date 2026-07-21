#!/usr/bin/env node

import { doctor } from "../commands/doctor.mjs";
import provider from "../commands/provider.mjs";
import inference from "../commands/inference.mjs";
import lanOllama from "../commands/lan-ollama.mjs";

const command = process.argv[2] ?? "help";
const args = process.argv.slice(3);

function help() {
  console.log("AIFT Forge CLI");
  console.log("");
  console.log("Usage:");
  console.log("  node packages/forge-core/src/cli/index.mjs <command>");
  console.log("");
  console.log("Commands:");
  console.log("  doctor       Check federation tools, repos, and AIFT-Forge structure");
  console.log("  provider     Provider registry management");
  console.log("  inference    Local inference management");
  console.log("  lan-ollama   LAN Ollama provider helper");
  console.log("  help         Show this help");
}

async function main() {
  switch (command) {
    case "doctor":
      await doctor(...args);
      break;

    case "provider":
      await provider(args);
      break;

    case "inference":
      await inference(args);
      break;

    case "lan-ollama":
      await lanOllama(args);
      break;

    case "help":
    case "--help":
    case "-h":
      help();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      help();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ AIFT Forge CLI error");
  console.error(err);
  process.exit(1);
});
