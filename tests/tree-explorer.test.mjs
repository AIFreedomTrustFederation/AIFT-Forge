import { describe, expect, it } from "vitest";

import {
  createExplorerState,
  getExplorerView,
  getNodeDetail,
  layoutExplorerGraph,
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
});
