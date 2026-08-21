import { describe, expect, it } from "vitest";

import {
  createExplorerState,
  getEdgeDetail,
  getAtlasForTreeNode,
  getExplorerView,
  getNodeDetail,
  layoutExplorerGraph,
  normalizeAtlasManifest,
  normalizeTreeManifest,
  reduceExplorerState,
} from "../packages/tree-explorer/src/tree-explorer.mjs";

function manifestFixture() {
  return {
    kind: "tree-manifest",
    modelId: "aift-tree-of-emergence",
    modelVersion: "0.1.0",
    title: "The AIFT Tree of Emergence",
    status: "canonical-draft",
    domains: ["physical", "biological", "technological"],
    epistemicClasses: {
      empirical: { label: "Empirical", definition: "Observed." },
      engineering: { label: "Engineering", definition: "Built." },
    },
    sourceRefs: [
      {
        id: "genesis.tree",
        label: "Tree document",
        uri: "civilization/TREE_OF_EMERGENCE.md",
      },
    ],
    rootNodeIds: ["physical-reality"],
    nodes: [
      {
        id: "physical-reality",
        label: "Physical Reality",
        domain: "physical",
        epistemicClass: "empirical",
        description: "Observable physical existence.",
        sourceRefs: ["genesis.tree"],
        status: "established",
        metadata: { part: "roots" },
      },
      {
        id: "biological-life",
        label: "Biological Life",
        shortLabel: "Life",
        domain: "biological",
        epistemicClass: "empirical",
        description: "Living systems.",
        sourceRefs: ["genesis.tree"],
        status: "established",
        metadata: { part: "trunk" },
      },
      {
        id: "software",
        label: "Software",
        domain: "technological",
        epistemicClass: "engineering",
        description: "Executable symbolic structure.",
        sourceRefs: [],
        status: "established",
        metadata: { part: "leaves" },
      },
    ],
    edges: [
      {
        id: "e-physical-life",
        from: "physical-reality",
        to: "biological-life",
        relation: "enables",
        epistemicClass: "empirical",
        role: "primary",
        sourceRefs: ["genesis.tree"],
      },
      {
        id: "e-life-software",
        from: "biological-life",
        to: "software",
        relation: "influences",
        epistemicClass: "engineering",
        role: "cross-link",
        sourceRefs: [],
      },
    ],
  };
}

function atlasManifestFixture() {
  return {
    kind: "living-atlas-manifest",
    atlasId: "aift-living-atlas",
    atlasVersion: "0.1.0",
    title: "AIFT Living Atlas",
    status: "canonical-draft",
    description: "Public Atlas fixture.",
    entityTypes: {
      repository: {
        label: "Repository",
        definition: "Public source repository.",
      },
      publication: {
        label: "Publication",
        definition: "Public document.",
      },
    },
    mappingRelations: {
      implements: {
        label: "Implements",
        definition: "Implements a Tree concept.",
      },
      documents: {
        label: "Documents",
        definition: "Documents a Tree concept.",
      },
    },
    sourceRefs: [
      {
        id: "forge.readme",
        label: "Forge README",
        uri: "https://example.test/forge",
      },
    ],
    entities: [
      {
        id: "repo-aift-forge",
        type: "repository",
        label: "AIFT-Forge",
        description: "Reusable engine repository.",
        status: "active-foundation",
        visibility: "public",
        evidenceStatus: "public-repository",
        sourceRefs: ["forge.readme"],
        links: [
          {
            label: "Repository",
            uri: "https://example.test/forge",
            type: "repository",
          },
        ],
        tags: ["forge"],
        metadata: {
          claimBoundary: "Fixture repository.",
        },
      },
      {
        id: "publication-software-note",
        type: "publication",
        label: "Software Note",
        description: "Public software note.",
        status: "documented",
        visibility: "public",
        evidenceStatus: "public-document",
        sourceRefs: ["forge.readme"],
        links: [],
        tags: ["software"],
        metadata: {},
      },
    ],
    treeMappings: [
      {
        id: "map-forge-software",
        treeNodeId: "software",
        atlasEntityId: "repo-aift-forge",
        relation: "implements",
        status: "active",
        description: "Forge implements reusable software patterns.",
        sourceRefs: ["forge.readme"],
      },
      {
        id: "map-note-software",
        treeNodeId: "software",
        atlasEntityId: "publication-software-note",
        relation: "documents",
        status: "active",
        description: "The note documents software.",
        sourceRefs: ["forge.readme"],
      },
    ],
  };
}

describe("AIFT Tree Explorer engine", () => {
  it("normalizes manifest domains, sources, and graph relationships", () => {
    const model = normalizeTreeManifest(manifestFixture());

    expect(model.nodes).toHaveLength(3);
    expect(model.edges).toHaveLength(2);
    expect(model.domainsById.get("biological").label).toBe("Life");
    expect(model.primaryEdges).toHaveLength(1);
    expect(model.crossEdges).toHaveLength(1);
    expect(model.nodesById.get("biological-life").sourceObjects[0].label).toBe(
      "Tree document",
    );
    expect(model.incomingByNode.get("biological-life")[0].id).toBe(
      "e-physical-life",
    );
  });

  it("reduces Whole Tree to Domain to Node state", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const whole = createExplorerState();
    const domain = reduceExplorerState(model, whole, {
      type: "domain",
      domainId: "biological",
    });
    const node = reduceExplorerState(model, domain, {
      type: "node",
      nodeId: "biological-life",
    });

    expect(whole.view).toBe("whole");
    expect(domain).toMatchObject({ view: "domain", domainId: "biological" });
    expect(node).toMatchObject({
      view: "node",
      domainId: "biological",
      nodeId: "biological-life",
    });
  });

  it("builds node details with canonical relationships and sources", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const detail = getNodeDetail(
      model,
      "biological-life",
      "https://example.test/",
    );

    expect(detail.node.description).toBe("Living systems.");
    expect(detail.incoming.map((edge) => edge.id)).toEqual(["e-physical-life"]);
    expect(detail.outgoing.map((edge) => edge.id)).toEqual(["e-life-software"]);
    expect(detail.sources[0].uri).toBe("civilization/TREE_OF_EMERGENCE.md");
    expect(detail.epistemicDefinition).toBe("Observed.");
  });

  it("lays out a deterministic domain focus view", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const state = createExplorerState({ domainId: "biological" });
    const view = getExplorerView(model, state);
    const layout = layoutExplorerGraph(model, state);

    expect(view.mode).toBe("domain");
    expect(view.selectedDomain.id).toBe("biological");
    expect(layout.nodes.map((entry) => entry.node.id)).toEqual([
      "physical-reality",
      "biological-life",
      "software",
    ]);
    expect(layout.edges).toHaveLength(2);
    expect(
      layout.nodes.find((entry) => entry.node.id === "biological-life").focus,
    ).toBe(true);
  });

  it("summarizes whole-map aggregate edges for lens rendering", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const layout = layoutExplorerGraph(
      model,
      createExplorerState({ epistemicLens: true }),
    );

    expect(layout.mode).toBe("whole");
    expect(layout.edges).toHaveLength(2);
    expect(layout.edges[0]).toMatchObject({
      from: "physical",
      to: "biological",
      role: "primary",
      count: 1,
      epistemicSummary: [
        { id: "empirical", label: "Empirical", mark: "OBS", count: 1 },
      ],
    });
    expect(layout.edges[0].source).toBeUndefined();
  });

  it("keeps position while toggling the epistemic lens and filtering classes", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const state = createExplorerState({
      domainId: "technological",
      nodeId: "software",
    });
    const lens = reduceExplorerState(model, state, { type: "toggle-lens" });
    const filtered = reduceExplorerState(model, lens, {
      type: "epistemic-filter",
      epistemicFilter: "engineering",
    });

    expect(lens).toMatchObject({
      view: "node",
      domainId: "technological",
      nodeId: "software",
      epistemicLens: true,
    });
    expect(filtered).toMatchObject({
      nodeId: "software",
      epistemicLens: true,
      epistemicFilter: "engineering",
    });
  });

  it("focuses relationship edges before traversing to connected nodes", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const state = createExplorerState({ nodeId: "biological-life" });
    const edgeState = reduceExplorerState(model, state, {
      type: "edge",
      edgeId: "e-life-software",
    });
    const view = getExplorerView(model, edgeState);
    const detail = getEdgeDetail(model, "e-life-software");

    expect(edgeState).toMatchObject({
      view: "node",
      nodeId: "biological-life",
      edgeId: "e-life-software",
    });
    expect(view.edgeDetail.edge.relationLabel).toBe("Influences");
    expect(detail.source.id).toBe("biological-life");
    expect(detail.target.id).toBe("software");
    expect(detail.edge.roleLabel).toBe("Cross-link");
  });

  it("filters edge visibility by primary lineage or cross-link mode", () => {
    const model = normalizeTreeManifest(manifestFixture());
    const primaryState = createExplorerState({
      domainId: "biological",
      edgeMode: "primary",
    });
    const crossState = createExplorerState({
      domainId: "biological",
      edgeMode: "cross-link",
    });

    expect(
      getExplorerView(model, primaryState).visibleEdges.map((edge) => edge.id),
    ).toEqual(["e-physical-life"]);
    expect(
      getExplorerView(model, crossState).visibleEdges.map((edge) => edge.id),
    ).toEqual(["e-life-software"]);
  });

  it("normalizes Atlas entities and resolves explicit Tree mappings", () => {
    const tree = normalizeTreeManifest(manifestFixture());
    const atlas = normalizeAtlasManifest(atlasManifestFixture(), tree);
    const softwareAtlas = getAtlasForTreeNode(atlas, "software");

    expect(atlas.entities).toHaveLength(2);
    expect(softwareAtlas.count).toBe(2);
    expect(
      softwareAtlas.mappings.map((mapping) => mapping.relationLabel),
    ).toEqual(["Implements", "Documents"]);
    expect(softwareAtlas.entities.map((entity) => entity.id)).toEqual([
      "repo-aift-forge",
      "publication-software-note",
    ]);
  });

  it("opens an Atlas panel without losing the selected Tree node", () => {
    const tree = normalizeTreeManifest(manifestFixture());
    const atlas = normalizeAtlasManifest(atlasManifestFixture(), tree);
    const nodeState = createExplorerState({ nodeId: "software" });
    const atlasState = reduceExplorerState(tree, nodeState, {
      type: "atlas",
      treeNodeId: "software",
    });
    const entityState = reduceExplorerState(tree, atlasState, {
      type: "atlas-entity",
      treeNodeId: "software",
      atlasEntityId: "publication-software-note",
    });
    const view = getExplorerView(tree, entityState, atlas);

    expect(entityState).toMatchObject({
      view: "node",
      nodeId: "software",
      domainId: "technological",
      atlasTreeNodeId: "software",
      atlasEntityId: "publication-software-note",
    });
    expect(view.nodeDetail.node.id).toBe("software");
    expect(view.atlasDetail.count).toBe(2);
    expect(view.atlasDetail.selectedEntity.id).toBe(
      "publication-software-note",
    );
  });
});
