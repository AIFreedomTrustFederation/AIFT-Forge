# AIFT-Forge — Federation Forge

**The forge layer of the AI Freedom Trust Federation: technical coordination, repository and package patterns, build discipline, agent orchestration, and reusable foundations for systems that must remain human-governed.**

| Federation metadata | Value |
| --- | --- |
| Layer | `forge` |
| Role | technical coordination core, repo/build/package/agent orchestration |
| Workspace | `AIFT/AIFT-Forge` |
| Control plane | AIFT workspace / AIFT-OS |
| Verification | `npm run lint --if-present && npm run typecheck --if-present && npm run test --if-present && npm run build --if-present` |
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

---

## Book III — SOP-ALOHA-001 in the Forge

The Federation loop is:

```text
Receive → Inspect → Name → Propose → Consent → Act → Verify → Record → Return
```

In AIFT-Forge, **Receive** begins with a repository need, package need, agent workflow, or reusable application pattern. **Inspect** means reading the actual consumer constraints before creating abstraction. **Name** means identifying whether the work belongs in a shared package, a template, an agent contract, a product repository, or nowhere at all. **Propose** means the Forge may offer a reusable structure without silently forcing downstream repositories to reorganize around it. **Consent** matters whenever a shared change alters public interfaces, build assumptions, release behavior, permissions, or cross-repository contracts. **Act** means implementing the smallest reusable change in the proper package or foundation. **Verify** means the repository's lint, typecheck, tests, builds, readiness checks, and dependency inspection must support the claim that the pattern works. **Record** means version control, manifests, package boundaries, and documentation preserve the reason and integration contract. **Return** means downstream projects receive a usable component and a clear statement of what they still own.

Primary setup and checks remain technical and explicit:

```bash
npm install
npm run qa:local
```

The metadata-level verification path is:

```bash
npm run lint --if-present
npm run typecheck --if-present
npm run test --if-present
npm run build --if-present
```

Focused repository tooling may also include:

```bash
npm run verify
npm run readiness
npm run deps:manifest
npm run smoke:git-access
```

Security and truthfulness remain part of the Forge contract. No package should hide a secret requirement, claim an unavailable capability, convert a planned integration into a production statement, or make an irreversible external action the silent default.

---

## Book IV — From Pattern to Inheritance

AIFT-Forge is successful when a downstream repository can inherit a useful pattern without losing its name. The infrastructure project should still read like infrastructure. The publishing project should still read like publishing. The economy layer should still preserve financial and custody boundaries. A model hub should still describe models and provenance rather than pretending to be a deployment system. Shared architecture becomes healthy when it increases coherence without producing sameness.

This is why repository metadata is part of the Forge's living grammar. `aift.repo.json` declares this project's layer and role to the Federation; downstream repositories declare their own. The control plane can coordinate them because the differences are named rather than erased.

### The Return of the Word

In the Forge, the Word returns as an interface that still remembers why it exists. Doctrine becomes a package, package becomes capability, capability becomes verified use, and verified use returns to the human builder without concealing what was inherited, what was changed, or who owns the next decision. That is how technical reuse remains covenant rather than conformity.
