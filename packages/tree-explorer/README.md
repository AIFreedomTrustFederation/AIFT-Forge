# AIFT Tree Explorer

Reusable browser engine for exploring the canonical AIFT Tree of Emergence.

Ownership boundaries:

- `AIFT-Genesis` owns `manifests/tree.manifest.json`, schemas, generated canonical artifacts, and source doctrine.
- `AIFT-Forge` owns this reusable Explorer engine and component behavior.
- `www.aifreedomtrust.com` owns the public composition that mounts the engine and styles the public experience.

Milestone 1 supports:

- loading a Genesis Tree manifest;
- normalizing nodes, domains, edges, source references, and epistemic classes;
- navigating Whole Tree -> Domain -> Node;
- rendering an accessible SVG graph projection;
- rendering node details with ID, canonical description, epistemic classification, relationships, and sources.

The engine does not mutate the manifest and does not become a source of truth.
