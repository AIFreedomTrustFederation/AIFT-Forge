# AIFT-Forge — Universal OS SDK and Agent Framework Alignment

> **Draft engineering integration proposal.** AIFT-Forge currently owns reusable technical/build/agent patterns, not a host kernel, certified robotics controller or deployed AIFT device SDK. The canonical proposal and infographics are in [AIFT-OS PR #92](https://github.com/AIFreedomTrustFederation/AIFT-OS/pull/92).

## Ownership and boundaries

Forge should provide a portable, versioned **AIFT application and capability SDK** spanning native Linux, hosted isolated sessions, and selected simulated mobile/robot devices. Its runtime adapters must expose environment-specific availability rather than inventing universal hardware capabilities. AIFT-OS remains the coordinator; Runtime owns host introspection; VPS owns deployment; Genesis governs canonical schemas.

## Planned contracts

| Interface | Required fields and negative cases | Actual verification needed |
|---|---|---|
| App manifest | Owner, version, supported targets, package digest, entry point, storage scope, requested permissions | Reject incompatible host, unknown entry point and untrusted artifact |
| Capability API | Scope, provenance, explicit grant, expiry, revoke, unsupported state | Denied browser-to-native privileges and revoked access |
| Agent / skill package | Model/provider, provenance, bounded tool set, proposal/validation and audit | Test unauthorized tool request, timeout and deterministic fallback |
| Portable workspace | Opt-in encrypted state, data export and deletion, no transfer of physical privilege | Virtual cross-device handoff with consent and rollback |
| Build/release | Pinned build/toolchain, target architecture, artifact SHA and reproducible steps | Clean-build verification and dependency/license audit |

~~~mermaid
flowchart LR
  SOURCE["Application / agent sources"] --> FORGE["Forge: manifest and SDK contracts"]
  FORGE --> NATIVE["AIFT native adapter: proposed"]
  FORGE --> HOSTED["Hosted session adapter: proposed"]
  FORGE --> DEVICE["Mobile / simulated robot adapter: proposed"]
  GUARD["Consent and risk review"] --> FORGE
  TEST["Independent target and negative tests"] --> FORGE
~~~

## Deliverable milestones

**SDK-00:** Versioned manifest schema with truthful unavailable states; **SDK-01:** one real AIFT app launched in isolated native VM and hosted browser via tested adapters; **SDK-02:** local-first AI skill with explicit permission denial; **SDK-03:** opt-in virtual phone/robot state handoff without privilege inheritance.

## Safety and source rules

Respect Forge AGENTS.md and source permissions. Do not directly actuate robots, flash firmware, change boot policies, access private phone sensors or alter production systems. Experimental UXI/Mobile/Robot contracts remain explicitly proposed until tested. No security, identity, governance or signing policy change is authorized by this document. Validate with the repository's documented QA gate and exact-head CI.

See also the [central platform diagram and verification gates](https://github.com/AIFreedomTrustFederation/AIFT-OS/pull/92) and [AIFT-Runtime](https://github.com/AIFreedomTrustFederation/AIFT-Runtime).