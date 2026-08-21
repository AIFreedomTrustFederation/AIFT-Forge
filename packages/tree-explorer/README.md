# AIFT Tree Explorer

Reusable browser engine for exploring the canonical AIFT Tree of Emergence.

Ownership boundaries:

- `AIFT-Genesis` owns `manifests/tree.manifest.json`, schemas, generated canonical artifacts, and source doctrine.
- `AIFT-Forge` owns this reusable Explorer engine and component behavior.
- `www.aifreedomtrust.com` owns the public composition that mounts the engine and styles the public experience.

Current Explorer support includes:

- loading a Genesis Tree manifest;
- optionally loading a Genesis Living Atlas manifest;
- normalizing nodes, domains, edges, source references, and epistemic classes;
- resolving explicit Tree node ID to Atlas entity mappings;
- navigating Whole Tree -> Domain -> Node;
- traversing relationship edges and connected nodes;
- toggling the Epistemic Lens and edge visibility modes;
- opening a Tree-to-Atlas detail panel while preserving the Tree breadcrumb;
- rendering an accessible SVG graph projection;
- rendering node details with ID, canonical description, epistemic classification, relationships, and sources.

The engine does not mutate the manifest and does not become a source of truth.
Tree meaning remains in Genesis `tree.manifest.json`; Atlas instantiation remains
in Genesis `living-atlas.manifest.json`; live Runtime state is out of scope for
this package.
