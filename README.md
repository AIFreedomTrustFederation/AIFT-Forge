# AIFT-Forge — Federation Forge

**The forge layer of the AI Freedom Trust Federation: technical coordination, repository and package patterns, build discipline, agent orchestration, and reusable foundations for systems that must remain human-governed.**

| Federation metadata | Value |
| --- | --- |
| Layer | `forge` |
| Role | technical coordination core, repo/build/package/agent orchestration |
| Workspace | `AIFT/AIFT-Forge` |
| Control plane | AIFT workspace / AIFT-OS |
| Verification | `npm ci --ignore-scripts && npm run qa:local` |
| Operating standards | local-first, inspectable, sovereign by default, AI behind governed provider interfaces |

AIFT-Forge is where the Federation turns shared covenant into reusable technical form. It does not define the constitutional genome—that belongs to AIFT-Genesis—and it does not become the operating-system control plane—that belongs to AIFT-OS. Its work is the middle transformation: templates, packages, agent patterns, application foundations, build rules, verification gates, and coordination language that allow independent projects to inherit the Federation pattern without becoming copies of one another.

The shared covenant is carried by the [One Eternal Scroll of ALO'ha](https://aifreedomtrustfederation.github.io/AI-Freedom-Trust/docs/pdf/one-eternal-scroll-of-aloha.pdf) and operationalized through [SOP-ALOHA-001](https://github.com/AIFreedomTrustFederation/AI-Freedom-Trust/blob/main/SOP-ALOHA-001.md).

---

## Book I — The Forge as Covenant Made Technical

The Forge begins where doctrine meets consequence. A principle such as human sovereignty has little technical meaning unless it becomes permission boundaries, inspectable state, explicit approval points, provider interfaces, testable packages, and failure modes that tell the truth. A principle such as decentralization has little meaning if every project quietly depends on one hidden service. A principle such as AI stewardship has little meaning if an agent can act without knowing the source, scope, risk, or human handoff of its work.

AIFT-Forge therefore shapes reusable infrastructure around one question: **how can a system become more capable without becoming less accountable?** Agents may classify, build, inspect, summarize, generate, coordinate, and report, but the architecture must preserve source, state, ownership, delegated authority, and the route back to the human operator.

### Illuminated passage — circulation through the forge

![Harmonic Krystal Torus](https://raw.githubusercontent.com/AIFreedomTrustFederation/AI-Freedom-Trust/main/docs/images/aetherion/harmonic-krystal-torus.png)

The toroidal image belongs here as an engineering metaphor for a closed operational loop. Input does not disappear into automation. It passes through classification, transformation, validation, state update, handoff, and report, then returns with evidence. Forge patterns should make that return visible in code.

---

## Book II — What AIFT-Forge Owns

AIFT-Forge owns **shared technical patterns**, not every downstream product. Its domain includes repository and workspace conventions, reusable templates, package boundaries, agent roles, multi-surface application foundations, dependency and readiness tooling, and the coordination vocabulary used when systems hand work to one another.

Its integration boundaries are deliberate:

- **AIFT-Genesis → Forge:** Genesis provides constitutional identity, trust structures, schemas, and the civilization genome that reusable technical patterns must respect.
- **AI-Freedom-Trust → Forge:** the doctrine repository provides covenant, alignment language, research, and public philosophy. Forge translates applicable principles into technical boundaries without rewriting the doctrine as code comments.
- **Forge → AIFT-OS:** Forge supplies reusable structures and conventions; AIFT-OS discovers actual repositories and capabilities from evidence and orchestrates them through the control plane.
- **Forge → AIFT-Runtime:** runtime-oriented patterns may be consumed by the local intelligence and execution layer, but Runtime remains responsible for its own shell/runtime behavior.
- **Forge → VPS:** the Cloud App Foundry and provider-node infrastructure may use Forge packages and agent patterns while keeping infrastructure authority inside the VPS repository.
- **Forge → BookSmith and Aetherion:** publishing and economic projects may inherit provider interfaces, governance patterns, agent contracts, and verification conventions without giving Forge authority over authorship, custody, or transactions.

The practical rule is that Forge should make reuse easier than duplication while still allowing each repository to declare its own metadata, dependencies, commands, and source of truth.

### Tree Explorer: source and public-portal boundary

The browser engine [`@aift/tree-explorer`](packages/tree-explorer/README.md) is implemented in [`packages/tree-explorer/src/tree-explorer.mjs`](packages/tree-explorer/src/tree-explorer.mjs) and declared as a **private** package in its [manifest](packages/tree-explorer/package.json). It consumes the canonical Genesis Tree manifest and optional Living Atlas mappings to provide navigable SVG views, epistemic filtering, relationship details, and Tree-to-Atlas navigation. Genesis owns the source manifests; Forge does not edit them or supply live AIFT-OS/Runtime state.

The [public portal homepage](https://github.com/AIFreedomTrustFederation/www.aifreedomtrust.com/blob/main/index.html) mounts this engine with browser `import()`: it first tries a commit-pinned Forge module on jsDelivr, then a mutable `main` CDN URL, then a GitHub Pages path. Its Tree and Atlas JSON URLs also point to Genesis `main`. External module and manifest availability, cross-origin fetching, and mutable fallbacks therefore affect the deployed experience; the pinned-first module URL does **not** make the entire integration immutable or prove that it renders successfully in browsers.

For focused, fixture-based regression coverage after `npm ci --ignore-scripts`, run:

```bash
npx vitest run tests/tree-explorer.test.mjs
```

The [Explorer tests](tests/tree-explorer.test.mjs) exercise manifest normalization and navigation state, not public-site loading, external fetches, or a live browser session. The active root QA profile does not build or deploy the public portal. Verify the browser integration separately when changing the engine, manifest schemas, or module URLs.

---

## Book III — SOP-ALOHA-001 in the Forge

The Federation loop is:

```text
Receive → Inspect → Name → Propose → Consent → Act → Verify → Record → Return
```

In AIFT-Forge, **Receive** begins with a repository need, package need, agent workflow, or reusable application pattern. **Inspect** means reading the actual consumer constraints before creating abstraction. **Name** means identifying whether the work belongs in a shared package, a template, an agent contract, a product repository, or nowhere at all. **Propose** means the Forge may offer a reusable structure without silently forcing downstream repositories to reorganize around it. **Consent** matters whenever a shared change alters public interfaces, build assumptions, release behavior, permissions, or cross-repository contracts. **Act** means implementing the smallest reusable change in the proper package or foundation. **Verify** means the repository's lint, typecheck, tests, builds, readiness checks, and dependency inspection must support the claim that the pattern works. **Record** means version control, manifests, package boundaries, and documentation preserve the reason and integration contract. **Return** means downstream projects receive a usable component and a clear statement of what they still own.

Primary setup and checks remain technical and explicit:

```bash
npm ci --ignore-scripts
npm run qa:local
```

The active Android/Termux-safe QA gate expands to:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Verification coverage caveat (current implementation)

The root `typecheck` and `build` commands currently invoke [`scripts/aift-typecheck-check.mjs`](scripts/aift-typecheck-check.mjs) and [`scripts/aift-build-check.mjs`](scripts/aift-build-check.mjs). **Both scripts only print a success message and exit with status 0; neither runs a TypeScript compiler or produces build artifacts.** Consequently, `npm run qa:local` executes the configured lint and Vitest commands but **must not be described as proof of successful typechecking or compilation**. The test command retains Vitest's `--passWithNoTests` for its existing suite, but now also runs `node --test tests/provider-registry.check.mjs` for mandatory provider-registry filesystem regression coverage. Inspect both test runners' results; a successful QA gate still does not establish full TypeScript compilation or application build artifacts.

**Federation manifest versus hosted QA:** [`aift.repo.json`](aift.repo.json) advertises lint, typecheck, test, and build commands with `--if-present`. All four scripts currently exist in [`package.json`](package.json), but that manifest command neither installs locked dependencies nor checks checkout cleanliness. The [hosted Local QA workflow](.github/workflows/qa.yml) separately checks the inert-install policy, installs dependencies, runs the QA gate, and checks for a clean checkout. If a script is removed, `--if-present` can silently skip it. A successful manifest command is therefore not evidence that the full hosted QA workflow ran.

### Local provider registry path boundary

The Forge provider CLI stores JSON definitions in `.forge/providers/`. `aift-forge provider add <id> <endpoint> [type]` now accepts only IDs beginning with an ASCII letter or digit and containing letters, digits, dots, underscores, or hyphens. Path separators, traversal strings, and control characters are rejected before any provider file is written. This prevents a caller-supplied ID such as `../../important` from writing outside the registry; the [provider registry regression tests](tests/provider-registry.check.mjs) exercise both rejected paths and ordinary IDs. Existing valid provider IDs are unchanged.

**Scope:** this check restricts the *filename derived from an ID*. It does not authenticate callers, protect against pre-existing filesystem symlinks or hard links, or prove that configured endpoints are reachable or trustworthy. Treat the local registry directory as operator-controlled, and do not expose provider management to untrusted users.

### Local provider health-check destination boundary

The [provider registry](packages/forge-core/src/providers/registry.mjs) now parses configured HTTP endpoints before health-checking them. Only the exact `localhost` name, `127.0.0.1`, and complete IPv4 addresses in the RFC1918 private ranges (`10/8`, `172.16/12`, `192.168/16`) are eligible; URL userinfo, public hosts, HTTPS, and hostname lookalikes such as `localhost.example.invalid` are rejected **before any HTTP request**. This closes the previous prefix-matching bypass in the local-only provider policy. Run `node --test tests/provider-registry.check.mjs` to verify rejected destinations and a real loopback health check.

**Limitations:** This is an outbound destination allowlist, not authentication, authorization, or a comprehensive SSRF defense. It deliberately permits HTTP calls to operator-configured private-LAN addresses, which may host sensitive services. It does not validate the provider's identity, resolve trust in local DNS/hosts-file mappings, or guarantee that an endpoint remains trustworthy. Only register endpoints you control.

### JSON API request limits

The local Forge JSON API now caps each JSON request body at **1 MiB**. Oversized
JSON requests return HTTP 413 (`request-body-too-large`), and malformed JSON
returns HTTP 400 (`invalid-json`). This is a bounded-memory safeguard for
the JSON routes, not an authentication mechanism. Git smart HTTP RPC traffic
uses a separate reader and is **not** covered by this limit. The API is still
a development foundation; its JSON mutation routes do not yet enforce the
token actor path used by Git smart HTTP. Do not expose it to untrusted networks.

The JSON body-limit behavior has a focused [Vitest regression suite](tests/request-json-limit.test.mjs). After installing the root dependencies, verify it with:

```bash
npm test -- tests/request-json-limit.test.mjs
```

These tests exercise empty and valid JSON, the exact 1 MiB ceiling, oversized single- and multi-chunk bodies, and malformed JSON. They call the parser directly; passing them does **not** demonstrate live HTTP routing, Git smart HTTP request limits, or JSON endpoint authorization.

### Local API authentication boundary

The Forge API entry point is [`apps/forge-api/server.mjs`](apps/forge-api/server.mjs). It listens on `127.0.0.1:4177` by default (overridable with `AIFT_FORGE_API_HOST` and `AIFT_FORGE_API_PORT`); `/api/health` checks only HTTP responsiveness. Unlike the token-checked Git smart HTTP handler, the JSON route dispatcher does **not** authenticate requests. Its unauthenticated endpoints include state reads, state reset, permission grants, and token creation/seeding; the seed helper uses a built-in development-token fallback if `AIFT_FORGE_BOOTSTRAP_TOKEN` is unset. JSON responses also allow cross-origin access; CORS is not an authorization control. Keep this server bound to loopback in a trusted development environment. Do not expose it through a public bind or reverse proxy until JSON route authorization and bootstrap-token handling are hardened.

### Root install versus preserved workspace lockfile

The active `npm ci --ignore-scripts` command installs the root [`package.json`](package.json) dependency graph using [`package-lock.json`](package-lock.json); it does **not** install the separate pnpm workspace described by [`pnpm-workspace.yaml`](pnpm-workspace.yaml) and [`pnpm-lock.yaml`](pnpm-lock.yaml). Those preserved workspace files include Android, desktop, and Forge-core dependencies outside the active root QA profile.

The [`dependency security regression tests`](tests/dependency-security.test.mjs) check specific declared versions and lockfile entries for `simple-git`, `@simple-git/argv-parser`, and Capacitor. They are **static regression checks**, not a package-manager install of every workspace, an advisory audit, or proof that all dependencies are free of vulnerabilities. Before restoring or releasing any preserved workspace, separately resolve, install, audit, build, and test its actual dependency graph on a supported platform.

For a reproducible local check of the active root profile, run:

```bash
npm ci --ignore-scripts
npm run qa:local
npm run deps:doctor
```

`deps:doctor` reports platform information and scans manifests for selected desktop-native dependency references; its current implementation also exits successfully when such references are found. It is diagnostic, **not** a dependency-vulnerability scan. Consult [`docs/validation.md`](docs/validation.md) for the active profile, and independently verify dependency advisories and lockfile resolutions before making security claims.

Desktop, web, native Android, live Git, audit, SBOM, license, and release
commands are preserved but inactive in this profile. See
[`docs/validation.md`](docs/validation.md) and [`docs/status.md`](docs/status.md),
and do not report those checks as passing unless their profiles are restored and
run.

Security and truthfulness remain part of the Forge contract. No package should hide a secret requirement, claim an unavailable capability, convert a planned integration into a production statement, or make an irreversible external action the silent default.

---

## Book IV — From Pattern to Inheritance

AIFT-Forge is successful when a downstream repository can inherit a useful pattern without losing its name. The infrastructure project should still read like infrastructure. The publishing project should still read like publishing. The economy layer should still preserve financial and custody boundaries. A model hub should still describe models and provenance rather than pretending to be a deployment system. Shared architecture becomes healthy when it increases coherence without producing sameness.

This is why repository metadata is part of the Forge's living grammar. `aift.repo.json` declares this project's layer and role to the Federation; downstream repositories declare their own. The control plane can coordinate them because the differences are named rather than erased.

**Federation synchronization metadata boundary:** [`.aift/capabilities.json`](.aift/capabilities.json) declares `sync` as `ready` with the descriptor `git remote/status`, but this is not an executable synchronization command; [`.aift/commands/status.sh`](.aift/commands/status.sh) only runs `git status --short`. [`aift.repo.json`](aift.repo.json) separately declares `git pull --ff-only`, which can change the checkout if executed. Neither declaration proves that synchronization ran, local and remote revisions agree, or an operation was authorized. Treat these as discovery and inspection metadata until execution evidence and resulting revisions are independently verified.

### The Return of the Word

In the Forge, the Word returns as an interface that still remembers why it exists. Doctrine becomes a package, package becomes capability, capability becomes verified use, and verified use returns to the human builder without concealing what was inherited, what was changed, or who owns the next decision. That is how technical reuse remains covenant rather than conformity.
