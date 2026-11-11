# AIFT-Forge Phase 8: Local Model Orchestration

Phase 8 adds a local model registry and routing policy layer.

This sits above the provider registry.

## Storage

Model records:

    .forge/models/

Route records:

    .forge/model-routes/

Model run records:

    .forge/model-runs/

## Model Object

A model contains:

- id
- name
- provider id
- provider type
- capabilities
- tags
- priority
- enabled flag
- discovery metadata

## Route Object

A route describes how Forge chooses models for a purpose.

Default routes:

- `chat`
- `completion`
- `embeddings`
- `planner`
- `coder`
- `reviewer`

## Commands

Initialize default routes:

    aift-forge model init

Discover models from live providers:

    aift-forge model refresh

Register a model manually:

    aift-forge model register llama-local --name llama3.2 --provider ollama-localhost --type ollama --tags chat,planner

List models:

    aift-forge model list

List routes:

    aift-forge model routes

Select route model:

    aift-forge model select chat

Run through a route:

    aift-forge model run chat "Say hello"

Show model runs:

    aift-forge model runs

## Model-to-provider execution evidence boundary

The [model orchestrator](../packages/forge-core/src/models/orchestrator.mjs) selects a model record with a `providerId`, but `runModelRoute` sends only the model name and request to the [provider router](../packages/forge-core/src/providers/router.mjs). That router independently chooses the first reachable provider advertising the requested capability, without binding the request to the selected model record's `providerId`. Consequently, `aift-forge model select` proves only metadata selection; a successful `model run` and its recorded `providerId` do not independently prove which provider actually served the model. Verify the model-to-provider binding and actual inference response separately, especially with multiple configured providers. This is a source-level limitation, not an observed misrouting incident.

## Governance

Local model orchestration is:

- local-first
- provider-registry based
- route-policy based
- no cloud fallback
- inspectable
- JSON-backed
- Android/Termux-compatible
