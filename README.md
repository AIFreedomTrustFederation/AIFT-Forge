# AI Freedom Trust Federation

**Human-governed agentic infrastructure for sovereign automation, decentralized compute, ethical AI, regenerative value systems, and generational repair.**

## Federation Status

| Field | Value |
| --- | --- |
| Status | Active |
| Federation layer | Federation Core |
| Repository role | Doctrine, templates, coordination patterns, and shared operating language |
| Visibility | Public |
| Primary language | JavaScript / TypeScript |

## Purpose

`AIFT-Forge` is the federation core. It holds the shared language, doctrine, templates, agent patterns, and multi-surface app foundations that other AI Freedom Trust Federation repositories align to.

Use this repository when a change affects the overall operating model, agentic infrastructure language, reusable templates, profile structure, desktop/mobile app foundations, or cross-repository doctrine.

## Current Capabilities

- Federation doctrine and ecosystem map.
- Workspace structure for product web, desktop, Android, API, and core packages.
- Verification and readiness scripts for forge structure.
- Dependency manifest, SBOM, license, lint, test, and formatting scripts.
- Shared coordination language for agentic infrastructure.

## Setup

```bash
npm install
```

## Verification

Current local verification gate:

```bash
npm run qa:local
```

Target checks:

```bash
npm run qa:deps
npm run test
npm run lint
npm audit --audit-level=high
npm run web:build
```

Focused checks:

```bash
npm run verify
npm run readiness
npm run deps:manifest
npm run smoke:git-access
```

`npm run format:check` remains a repository target, but legacy files are not yet normalized. Format files changed in the current work slice and avoid broad formatting-only rewrites unless that is the intended task.

## Roadmap

1. Keep doctrine aligned with `www.aifreedomtrust.com`.
2. Promote reusable templates into clear package boundaries.
3. Keep agent roles and approval boundaries explicit.
4. Maintain readiness checks as the source of truth for federation-core health.

## Public Claims Note

This repository may describe long-term infrastructure and governance direction, but implementation status must stay clear. Distinguish working systems, prototypes, research, plans, and symbolic language.

AI Freedom Trust Federation is an open-source initiative building toward a trust-based future where artificial intelligence is not merely a chatbot, product, or corporate service, but a network of accountable agents, human-governed workflows, decentralized infrastructure, and reusable systems that help people turn disorder into repair.

Our mission is to build AI systems that serve life.

Not hype.  
Not extraction.  
Not dependency.  
Not black-box domination.

We are building tools that help transform broken code, broken workflows, broken infrastructure, broken businesses, broken records, and broken systems into working, transparent, human-aligned operating structures.

At the deepest level, this project is about transmutation:

```text
Lead into gold.
Chaos into order.
Waste into wisdom.
Automation into accountability.
Compute into service.
Knowledge into inheritance.
Mortality into legacy.
```

---

## What We Are Building

AI Freedom Trust Federation is becoming the public doctrine, identity, and coordination layer for a larger ecosystem of agentic systems.

The first major infrastructure focus is the **AIFT Cloud App Foundry / VPS engine**: a mobile-first, open-source, decentralized VPS cloud, app builder, domain control panel, provider-node network, and future `.aft` registry system.

The system is being designed so users can:

- reserve and manage AFT domains, local names, and future `.aft` names
- build websites and apps with templates, WebAI, imported GitHub code, or local source folders
- deploy sites and apps to the AIFT decentralized VPS cloud
- turn phones, laptops, desktops, VPS servers, bare metal, and community hardware into provider nodes
- manage DNS-like records, service records, redirects, SSL, hosting, deployments, backups, logs, analytics, and rollback
- see exactly where every site or app runs through node disclosure and signed service records
- keep websites online through health checks, blue/green deploys, fallback nodes, and portable app profiles
- grow toward a decentralized naming and routing layer that can operate as an open alternative to centralized registry, registrar, DNS, and cloud dependency

The long-term vision is a federation of agents and nodes that can support:

- decentralized app deployment
- open-source automation
- low-power and edge AI
- ethical agent workflows
- human-approved build and release pipelines
- transparent provider-node coordination
- sustainable compute practices
- reusable operational memory
- privacy-respecting learning events
- trust-first AI governance
- sovereign wallet and regenerative value systems
- community-owned technical infrastructure
- decentralized naming and routing governance

This is not just about building apps faster.

It is about building systems that know where every action goes, who owns the next step, what failed, what was learned, where a service actually runs, and how the loop returns to the human operator.

---

## Core Philosophy

### Human-governed

Agents may assist, classify, build, summarize, warn, and recommend, but human operators remain responsible for high-risk decisions involving money, safety, law, identity, private data, deployment, irreversible actions, custody, name ownership, registry governance, or public routing.

### Trust-first

No hidden extraction.  
No secret leakage.  
No private data exported without consent.  
No silent autonomy where approval is required.

### Decentralized where possible

Infrastructure should not depend entirely on centralized platforms when open, local, self-hosted, federated, or provider-node alternatives can serve the mission.

### Transparent by design

Every agent, app, deployment, name record, provider node, gateway route, and service record should have a clear source, status, owner, permission boundary, risk level, and handoff path.

### Built for repair

The purpose of automation is not to replace human meaning. The purpose is to reduce chaos, repair broken workflows, preserve knowledge, and multiply useful labor.

### Cryptographically humble

Security claims must be clear, testable, and status-labeled. Implemented, conventional, prototype, experimental, simulated, planned, and audited features must not be confused.

### Regenerative by intent

Technology should serve living systems: families, communities, founders, veterans, repair workers, local businesses, open-source builders, and future generations.

---

## The Agentic Operating Model

AI Freedom Trust Federation is moving beyond isolated GPTs into role-based agents.

A GPT can talk.

An agent owns a workflow.

Every agent in this ecosystem should follow a simple operating pattern:

```text
Input -> Classification -> Action -> State Update -> Handoff -> Report -> Learning Event
```

A strong agent does not merely answer questions. It moves work through a lifecycle.

The first agent family includes:

### Owner Orchestrator Agent

Coordinates the full system, assigns tasks, tracks unresolved loops, and reports mission-critical issues to the human operator.

### Source Intake Agent

Receives repositories, app ideas, support requests, node registrations, name reservations, domain records, or build requests and classifies them into the correct workflow.

### Repo Reviewer Agent

Inspects a codebase, identifies its framework, build path, dependencies, runtime needs, environment requirements, and risks.

### Compliance Gate Agent

Checks licensing, privacy, secrets, dependency risk, security claims, registry rules, and release boundaries before a project is built, published, routed, or distributed.

### Build Runner Agent

Turns an approved source into a build run, tracks install/build/preview states, and records success or failure.

### Provider Node Agent

Represents a VPS, server, phone, Termux device, local machine, or future decentralized node that can report health, capacity, runtime status, and workload updates.

### Scheduler Agent

Evaluates node health, capacity, trust level, region, runtime readiness, and workload requirements before assigning a signed job.

### Gateway Agent

Resolves names, domains, slugs, and signed service records, then routes users to healthy deployments with fallback behavior when needed.

### Registry Governance Agent

Supports reserved names, abuse review, transfer policy, disputes, signed ownership records, and future decentralized naming governance.

### Dependency Issue Agent

Classifies blockers such as missing packages, missing runtimes, insufficient memory, missing secrets, build errors, storage limits, network failures, unsigned records, invalid routing records, or approval requirements.

### Learning Event Agent

Records reusable system patterns without exposing private user data, secrets, private messages, or private repository contents.

### Operator Report Agent

Summarizes system state for the human operator: active builds, failed builds, healthy nodes, stale nodes, routing warnings, registry warnings, capacity issues, unresolved blockers, and recommended next actions.

---

## AIFT Cloud App Foundry / VPS Doctrine

The AIFT VPS repo contributes the **Cloud App Foundry, decentralized provider-node, registry, gateway, and naming doctrine** to AI Freedom Trust Federation.

AIFT is not only a VPS dashboard. It is the foundation for a community-governed naming, routing, and hosting network.

The end goal is an AIFT provider console that feels as complete as a traditional domain registrar, DNS provider, website builder, hosting provider, deployment platform, and cloud control panel, but powered by a decentralized VPS network instead of one centralized hosting stack.

### Decentralized naming vision

AIFT should interoperate with normal DNS, normal domains, and normal browsers while building a parallel path for names and services that can be resolved through AIFT gateways, provider nodes, signed records, and community-governed registries.

The long-term path is:

```text
Local-first names
  -> signed service records
  -> provider-node routing
  -> public gateway resolution
  -> community registry governance
  -> portable domain and app ownership
  -> decentralized naming layer
```

AIFT is therefore both:

```text
A decentralized cloud provider
and
A decentralized naming and routing authority
```

### Core provider model

```text
The registry decides what should exist.
The builder creates the website or app.
The scheduler chooses where it should run.
The node network hosts it.
The gateway routes users to the healthy deployment.
The disclosure system tells the truth about where it runs.
```

No feature should bypass this model.

### Name-to-app lifecycle

Users should be able to open the dashboard and complete the full name-to-app lifecycle:

```text
Search or reserve a name
  -> create or import an app
  -> generate an app profile
  -> prepare a workspace
  -> install dependencies
  -> build the app
  -> start a local or provider-node runtime
  -> connect a domain or AIFT name
  -> route through the gateway
  -> pass health checks
  -> go live
  -> monitor logs, analytics, sync, and uptime
  -> roll back safely if needed
```

### Provider-node doctrine

The first proven node model is:

```text
Verified servers = stable cloud backbone
Phones and edge devices = decentralized edge compute swarm
```

Production hosting should prioritize verified servers and trusted always-on nodes. Phones and edge devices are valuable for previews, cache, tests, lightweight jobs, mirrors, and future swarm work.

### Target architecture

```text
AIFT Dashboard
  -> Sync Center
  -> Controls Center
  -> Domains UI
  -> Sites UI
  -> App Profiles UI
  -> WebAI Builder
  -> DNS Manager
  -> Service Records Manager
  -> Deployment Console
  -> Node Console
  -> Registry Admin Console

AFT Site, App, and Name Registry
  -> site ownership
  -> app ownership
  -> name reservations
  -> DNS-like records
  -> signed service records
  -> active deployment records
  -> fallback deployment records
  -> disclosure records

AIFT Scheduler
  -> evaluates node health
  -> selects eligible node
  -> assigns signed jobs
  -> tracks build and deploy status

AIFT Node Agent
  -> receives approved jobs
  -> builds or serves workloads
  -> reports heartbeat and capacity
  -> syncs artifacts and mirrors

AIFT Gateway
  -> resolves domains, names, and slugs
  -> routes to healthy deployments
  -> performs blue/green handoff
  -> serves fallback deployment when needed
  -> exposes signed disclosure data

AFT Registry Governance
  -> reserved names
  -> abuse review
  -> ownership transfer
  -> policy enforcement
  -> dispute resolution
  -> decentralized naming policy
  -> future ICANN interoperability or independence
```

### Engine primitives

The VPS engine creates reusable primitives for:

```text
sources
profiles
builds
workloads
nodes
updates
issues
reports
learning events
compliance checks
names
service records
gateways
disclosure records
registry governance
```

A typical workload lifecycle may look like:

```text
source-added
profile-created
build-requested
resources-approved
node-assigned
dependencies-installed
build-running
preview-running
build-passed
release-ready
released
```

If something breaks, it should not disappear into a vague error.

It should become a classified issue:

```text
missing-package
missing-runtime
missing-model
insufficient-memory
insufficient-storage
network-unavailable
battery-limited
build-error
secret-required
approval-required
unsigned-record
invalid-routing-record
health-check-failed
fallback-required
```

The system should always answer:

```text
What happened?
What state is it in?
Who owns the next step?
What risk level is involved?
What was learned?
Where does the loop return?
Where does this service actually run?
Is the current route signed, healthy, and disclosed?
```

### VPS non-negotiables

```text
No fake green status.
No mock production data in live operational paths.
No hidden infrastructure claims.
No switching traffic until health checks pass.
No automatic destructive sync when a repo is ahead or diverged.
No browser button should pretend the node updated until the local action actually completed.
No reload prompt should appear until the dashboard reports ready after restart.
```

### Near-term operator flow

```text
/sync
  -> Update dashboard files
  -> Restart dashboard
  -> Wait for Ready
  -> Reload app

/app-profiles
  -> Save repo and create profile
  -> Sync workspace
  -> Install dependencies
  -> Run build
  -> Start local URL
  -> Open app

/logs
  -> Read real output
  -> Fix first reported issue
  -> Retry the failed step
```

This is how AIFT becomes a real node-operated cloud instead of a demo UI.

---

## Context Trust Doctrine

AI Freedom Trust Federation does not treat all information equally.

Every important record should carry a trust label.

Useful truth levels include:

- **Official** — confirmed source of truth, such as a durable database record or owner override
- **Working** — useful operational memory that may still need verification
- **Inferred** — AI-generated synthesis that must be checked before action
- **Pending review** — customer, driver, node, route, registry, gateway, or system information awaiting confirmation

This creates an epistemology for agents:

```text
Know the source.
Label the confidence.
Explain the reason.
Verify before irreversible action.
Escalate uncertainty to the operator.
```

---

## Human Approval and No-Secret Doctrine

AIFT agents should be useful without becoming reckless.

The pattern is:

```text
AI drafts.
The system remembers.
The owner approves.
External action stays controlled.
Secrets do not live in unsafe places.
```

For high-risk actions, agents should prepare, classify, summarize, and recommend — not silently execute.

Examples of actions requiring explicit human approval:

- sending money
- signing transactions
- deploying production systems
- switching live traffic
- publishing private code
- registering, transferring, or revoking names
- using secrets or credentials
- deleting data
- changing legal, financial, or safety-sensitive records
- making claims about audited security

No agent should require secrets to be stored in a public repo. Credentials, tokens, mailbox passwords, API keys, wallet keys, registry signing keys, and private signing material must never be committed.

---

## Aetherion / Biozonecurrency Doctrine

The Aether Coin Biozonecurrency project contributes the sovereign wallet, regenerative value, cryptographic humility, and AI-guardian doctrine to AI Freedom Trust Federation.

AIFT treats financial, identity, and trust systems as high-risk human-governed domains.

AI may assist with clarity, risk detection, explanation, smart-contract summaries, escrow context, dispute support, and workflow guidance, but consent, custody, cryptographic claims, and transaction authority must remain explicit, auditable, and human-controlled.

Aetherion principles:

### Sovereign Consent

No wallet action, transaction, escrow release, credential use, AI recommendation, or smart-contract interaction should bypass informed human consent.

### Cryptographic Humility

Post-quantum and advanced-security language must clearly distinguish implemented features, conventional security practices, prototypes, simulations, experiments, planned features, and audited production guarantees.

### Regenerative Value

Aetherion tokens should represent stewardship, trust, identity, contribution, covenant memory, mutual aid, coherence, and regenerative coordination rather than extraction-first speculation.

### AI as Guardian, Not Ruler

AI may explain, warn, classify, simulate, and evaluate risk, but it must not silently authorize financial action, hide uncertainty, or override human agency.

### Fractal Maintainability

Every major system should be modular, typed, documented, testable, and recursively understandable from component to system level.

---

## Security Doctrine

AIFT projects should practice security by default:

- validate all user input
- avoid hardcoded credentials
- avoid leaking sensitive information in errors
- use HTTPS for production deployments
- use secure session and cookie handling where applicable
- encrypt sensitive data at rest and in transit where applicable
- run dependency and license audits
- prefer official, maintained packages
- document incident response and recovery paths
- separate symbolic language from engineering claims
- refuse unsigned or invalid routing records where signed records are required
- disclose infrastructure truthfully instead of hiding where services run

Future cryptographic research may include post-quantum readiness, hybrid cryptography, decentralized identity, signed service records, gateway verification, and long-term key resilience, but production claims must remain honest and auditable.

---

## Public Language Doctrine

Public users should not be forced to understand internal machinery.

AIFT may use agent, model, workflow, node, build, gateway, registry, and service-record language in technical docs, but customer-facing and public-service experiences should use clear human language:

- guide
- support
- concierge
- review
- route check
- customer care
- operator report
- trust record
- service workflow
- human approval
- provider console
- name record
- health check
- live route

The public surface should feel clear, calm, trustworthy, and useful — not desperate, over-technical, or inflated.

---

## Safe Development Doctrine

When agents or contributors modify AIFT repositories, they should follow a safe workflow:

1. Inspect relevant files first.
2. Make the smallest safe change.
3. Avoid destructive Git commands unless explicitly authorized.
4. Preserve backup-first behavior when rescuing work.
5. Validate with typecheck, build, tests, health checks, logs, or documented checks where available.
6. Explain exactly what changed.
7. Call out what was not completed.
8. Stop and ask before risky infrastructure changes.

Destructive operations such as hard resets, forced pushes, branch deletion, cleanup of unsynced work, destructive sync, live traffic switching, and registry mutation require explicit permission and backup-first discipline.

---

## Ecosystem Map

This repository is the public identity and doctrine layer for AI Freedom Trust Federation.

Related ecosystem repositories include:

- **AIFreedomTrustFederation/AIFreedomTrustFederation** — public profile, doctrine, mission, and ecosystem map
- **AIFreedomTrustFederation/VPS** — AIFT Cloud App Foundry, decentralized VPS cloud, provider-node network, app builder, domain control panel, and future `.aft` registry
- **AIFreedomTrustFederation/Aether_Coin_biozonecurrency** — sovereign wallet, biozonecurrency, AI-guardian, and regenerative token laboratory
- **AIFreedomTrustFederation/capital-city-provisions** — real-world business workflow, customer trust, route, message, and operations doctrine
- **AIFreedomTrustFederation/c-848263** — Mysterion Mind Map Cortex and sacred/fractal governance interface
- **AIFreedomTrustFederation/www.aifreedomtrust.com** — future public web presence

---

## Current Focus

The current focus areas are:

1. Define the AIFT agent model.
2. Build the AIFT Cloud App Foundry / VPS engine.
3. Create reusable source, profile, build, workload, node, issue, report, learning-event, name, service-record, gateway, and disclosure primitives.
4. Support file-backed storage first, then PostgreSQL-backed durable storage.
5. Design provider-node update flows.
6. Create operator dashboards.
7. Build compliance gates for connected repositories.
8. Support local-first and decentralized compute pathways.
9. Develop human-approved app-building workflows.
10. Build the native AFT site, app, and name registry.
11. Build signed service records and truthful node disclosure.
12. Build gateway routing with health checks, blue/green deploys, fallback nodes, and safe rollback.
13. Align Aether Coin Biozonecurrency around sovereign consent, regenerative token taxonomy, and truthful security claims.
14. Turn reusable operational patterns into privacy-respecting learning signals.

---

## Collaboration Areas

We are interested in collaboration around:

- decentralized AI infrastructure
- open-source agent frameworks
- sustainable and low-power compute
- local-first AI
- edge deployment
- self-hosted app platforms
- ethical automation
- build orchestration
- provider-node networks
- AI governance
- trust-based system design
- privacy-respecting operational learning
- post-quantum security research
- regenerative value systems
- decentralized naming systems
- signed service records
- gateway routing and disclosure
- open registry governance
- veteran and community-owned technical infrastructure

---

## Contact

For now, connect through the GitHub organization:

**@AIFreedomTrustFederation**

Website and public contact channels will be added as they become ready.

---

## Bottom Line

AI Freedom Trust Federation is building toward a future where AI agents do not merely generate words.

They help govern workflows, repair systems, coordinate infrastructure, preserve knowledge, protect trust, support sovereign stewardship, disclose where services actually run, and return every loop to human conscience.

This is automation with a soul-boundary.

This is infrastructure for repair.

This is lead into gold.
