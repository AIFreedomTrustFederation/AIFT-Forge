const SVG_NS = "http://www.w3.org/2000/svg";

export const DEFAULT_TREE_MANIFEST_URL =
  "https://raw.githubusercontent.com/AIFreedomTrustFederation/AIFT-Genesis/main/manifests/tree.manifest.json";

export const DEFAULT_GENESIS_BASE_URL =
  "https://github.com/AIFreedomTrustFederation/AIFT-Genesis/blob/main/";

const DOMAIN_LABELS = {
  "metaphysical-doctrinal": "Energence",
  physical: "Physical",
  chemical: "Chemistry",
  biological: "Life",
  ecological: "Ecology",
  cognitive: "Mind",
  "human-cultural": "Civilization",
  technological: "Technology",
  ai: "Artificial Intelligence",
  federation: "Federation",
  future: "New Seeds",
};

const DOMAIN_SHORT_LABELS = {
  "metaphysical-doctrinal": "Root",
  physical: "Physical",
  chemical: "Chemical",
  biological: "Life",
  ecological: "Ecology",
  cognitive: "Mind",
  "human-cultural": "Culture",
  technological: "Technology",
  ai: "AI",
  federation: "Federation",
  future: "Seeds",
};

const EPISTEMIC_MARKS = {
  empirical: "OBS",
  "scientific-consensus": "SCI",
  "active-research": "RES",
  interpretive: "INT",
  philosophical: "PHI",
  doctrinal: "DOC",
  engineering: "ENG",
  prototype: "PRO",
  architectural: "ARC",
  aspirational: "ASP",
};

export function formatDomainLabel(domainId) {
  return DOMAIN_LABELS[domainId] || titleize(domainId);
}

export function formatDomainShortLabel(domainId) {
  return DOMAIN_SHORT_LABELS[domainId] || formatDomainLabel(domainId);
}

export function titleize(value) {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function classToken(value) {
  return String(value || "unknown")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
}

export function epistemicMark(value) {
  return EPISTEMIC_MARKS[value] || titleize(value).slice(0, 3).toUpperCase();
}

export function normalizeTreeManifest(manifest) {
  if (!manifest || manifest.kind !== "tree-manifest") {
    throw new Error("Expected a Genesis tree-manifest object.");
  }
  if (!Array.isArray(manifest.nodes) || !Array.isArray(manifest.edges)) {
    throw new Error("Tree manifest must include nodes and edges arrays.");
  }

  const sourceRefsById = new Map(
    (manifest.sourceRefs || []).map((source) => [source.id, source]),
  );
  const epistemicClasses = manifest.epistemicClasses || {};
  const declaredDomains = Array.isArray(manifest.domains)
    ? manifest.domains
    : [];
  const discoveredDomains = [];
  const nodesById = new Map();

  manifest.nodes.forEach((node, index) => {
    if (!node.id)
      throw new Error(`Tree node at index ${index} is missing an id.`);
    if (nodesById.has(node.id))
      throw new Error(`Duplicate Tree node id: ${node.id}`);
    if (node.domain && !discoveredDomains.includes(node.domain)) {
      discoveredDomains.push(node.domain);
    }
    nodesById.set(node.id, {
      ...node,
      index,
      depth: 0,
      domainLabel: formatDomainLabel(node.domain),
      domainShortLabel: formatDomainShortLabel(node.domain),
      epistemicLabel:
        epistemicClasses[node.epistemicClass]?.label ||
        titleize(node.epistemicClass),
      epistemicDefinition:
        epistemicClasses[node.epistemicClass]?.definition || null,
      epistemicMark: epistemicMark(node.epistemicClass),
      epistemicToken: classToken(node.epistemicClass),
      sourceObjects: resolveSources(node.sourceRefs, sourceRefsById),
    });
  });

  const edgeObjects = manifest.edges.map((edge, index) => {
    if (!edge.id)
      throw new Error(`Tree edge at index ${index} is missing an id.`);
    if (!nodesById.has(edge.from))
      throw new Error(
        `Tree edge ${edge.id} has unknown from node: ${edge.from}`,
      );
    if (!nodesById.has(edge.to))
      throw new Error(`Tree edge ${edge.id} has unknown to node: ${edge.to}`);
    return {
      ...edge,
      index,
      source: nodesById.get(edge.from),
      target: nodesById.get(edge.to),
      epistemicLabel:
        epistemicClasses[edge.epistemicClass]?.label ||
        titleize(edge.epistemicClass),
      epistemicDefinition:
        epistemicClasses[edge.epistemicClass]?.definition || null,
      epistemicMark: epistemicMark(edge.epistemicClass),
      epistemicToken: classToken(edge.epistemicClass),
      relationLabel: titleize(edge.relation),
      roleLabel: edge.role === "primary" ? "Primary lineage" : "Cross-link",
      sourceObjects: resolveSources(edge.sourceRefs, sourceRefsById),
    };
  });

  const incomingByNode = mapEdges(edgeObjects, "to");
  const outgoingByNode = mapEdges(edgeObjects, "from");
  const primaryEdges = edgeObjects.filter((edge) => edge.role === "primary");
  const crossEdges = edgeObjects.filter((edge) => edge.role !== "primary");
  const primaryIncomingByNode = mapEdges(primaryEdges, "to");
  const primaryOutgoingByNode = mapEdges(primaryEdges, "from");
  const rootNodeIds = (manifest.rootNodeIds || []).filter((id) =>
    nodesById.has(id),
  );
  const roots =
    rootNodeIds.length > 0
      ? rootNodeIds
      : [...nodesById.keys()].filter(
          (id) => (primaryIncomingByNode.get(id) || []).length === 0,
        );
  const depths = computePrimaryDepths(roots, primaryOutgoingByNode);

  for (const [nodeId, depth] of depths) {
    const node = nodesById.get(nodeId);
    if (node) node.depth = depth;
  }

  const domains = [...new Set([...declaredDomains, ...discoveredDomains])]
    .filter(Boolean)
    .map((domainId, index) => {
      const nodes = [...nodesById.values()].filter(
        (node) => node.domain === domainId,
      );
      const internalEdges = edgeObjects.filter(
        (edge) =>
          edge.source.domain === domainId && edge.target.domain === domainId,
      );
      const inboundEdges = edgeObjects.filter(
        (edge) =>
          edge.target.domain === domainId && edge.source.domain !== domainId,
      );
      const outboundEdges = edgeObjects.filter(
        (edge) =>
          edge.source.domain === domainId && edge.target.domain !== domainId,
      );
      return {
        id: domainId,
        index,
        label: formatDomainLabel(domainId),
        shortLabel: formatDomainShortLabel(domainId),
        nodes,
        count: nodes.length,
        epistemicSummary: summarizeEpistemicClasses(nodes),
        internalEdges,
        inboundEdges,
        outboundEdges,
      };
    });

  return {
    manifest,
    title: manifest.title,
    modelId: manifest.modelId,
    modelVersion: manifest.modelVersion,
    status: manifest.status,
    nodes: [...nodesById.values()],
    edges: edgeObjects,
    primaryEdges,
    crossEdges,
    nodesById,
    sourceRefsById,
    epistemicClasses,
    domains,
    domainsById: new Map(domains.map((domain) => [domain.id, domain])),
    incomingByNode,
    outgoingByNode,
    primaryIncomingByNode,
    primaryOutgoingByNode,
    rootNodeIds: roots,
  };
}

export function createExplorerState(overrides = {}) {
  const view =
    overrides.view ||
    (overrides.nodeId ? "node" : overrides.domainId ? "domain" : "whole");
  return {
    view,
    domainId: overrides.domainId || null,
    nodeId: overrides.nodeId || null,
    edgeId: overrides.edgeId || null,
    search: overrides.search || "",
    epistemicLens: Boolean(overrides.epistemicLens),
    epistemicFilter: overrides.epistemicFilter || "all",
    edgeMode: overrides.edgeMode || "all",
  };
}

export function reduceExplorerState(model, state, action) {
  const current = createExplorerState(state);
  const presentation = {
    search: current.search,
    epistemicLens: current.epistemicLens,
    epistemicFilter: current.epistemicFilter,
    edgeMode: current.edgeMode,
  };

  switch (action.type) {
    case "whole":
      return createExplorerState({ ...presentation });
    case "domain":
      return createExplorerState({
        ...presentation,
        view: "domain",
        domainId: model.domainsById.has(action.domainId)
          ? action.domainId
          : current.domainId,
      });
    case "node": {
      const node = model.nodesById.get(action.nodeId);
      return createExplorerState({
        ...presentation,
        view: "node",
        nodeId: node?.id || current.nodeId,
        domainId: node?.domain || current.domainId,
      });
    }
    case "edge": {
      const edge = model.edges.find(
        (candidate) => candidate.id === action.edgeId,
      );
      if (!edge) return current;
      return createExplorerState({
        ...current,
        edgeId: edge.id,
        domainId: current.domainId || edge.source.domain || edge.target.domain,
      });
    }
    case "toggle-lens":
      return createExplorerState({
        ...current,
        epistemicLens: !current.epistemicLens,
      });
    case "epistemic-filter":
      return createExplorerState({
        ...current,
        epistemicFilter: action.epistemicFilter || "all",
      });
    case "edge-mode":
      return createExplorerState({
        ...current,
        edgeMode: action.edgeMode || "all",
      });
    case "search":
      return createExplorerState({
        ...current,
        search: action.search || "",
      });
    default:
      return current;
  }
}

export function getNodeDetail(
  model,
  nodeId,
  genesisBaseUrl = DEFAULT_GENESIS_BASE_URL,
) {
  const node = model.nodesById.get(nodeId);
  if (!node) return null;
  const incoming = model.incomingByNode.get(node.id) || [];
  const outgoing = model.outgoingByNode.get(node.id) || [];
  return {
    node,
    incoming,
    outgoing,
    sources: node.sourceObjects,
    canonicalUrl: node.canonicalUri
      ? new URL(node.canonicalUri, genesisBaseUrl).href
      : null,
    epistemicDefinition: node.epistemicDefinition || null,
  };
}

export function getEdgeDetail(
  model,
  edgeId,
  genesisBaseUrl = DEFAULT_GENESIS_BASE_URL,
) {
  const edge = model.edges.find((candidate) => candidate.id === edgeId);
  if (!edge) return null;
  return {
    edge,
    source: edge.source,
    target: edge.target,
    sources: edge.sourceObjects,
    sourceUrls: edge.sourceObjects.map((source) => ({
      ...source,
      href: new URL(source.uri || "", genesisBaseUrl).href,
    })),
    epistemicDefinition: edge.epistemicDefinition || null,
  };
}

export function getExplorerView(model, state) {
  const currentState = createExplorerState(state);
  const search = currentState.search.trim().toLowerCase();
  const selectedNode = currentState.nodeId
    ? model.nodesById.get(currentState.nodeId)
    : null;
  const selectedEdge = currentState.edgeId
    ? model.edges.find((edge) => edge.id === currentState.edgeId)
    : null;
  const selectedDomain =
    currentState.domainId || selectedNode?.domain
      ? model.domainsById.get(currentState.domainId || selectedNode.domain)
      : null;
  const matchingNodeIds = new Set(
    model.nodes
      .filter((node) => matchesSearch(node, search))
      .map((node) => node.id),
  );

  if (currentState.view === "whole") {
    const visibleEdges = filterEdgesByMode(
      model.edges,
      currentState.edgeMode,
      selectedEdge?.id,
    );
    return {
      mode: "whole",
      state: currentState,
      domains: model.domains,
      domainEdges: summarizeDomainEdges(visibleEdges),
      selectedDomain: null,
      selectedNode: null,
      selectedEdge,
      visibleNodes: model.nodes.filter((node) => matchingNodeIds.has(node.id)),
      visibleEdges,
      matchingNodeIds,
      nodeDetail: null,
      edgeDetail: selectedEdge ? getEdgeDetail(model, selectedEdge.id) : null,
    };
  }

  if (currentState.view === "node" && selectedNode) {
    const relationshipEdges = [
      ...(model.incomingByNode.get(selectedNode.id) || []),
      ...(model.outgoingByNode.get(selectedNode.id) || []),
    ];
    const visibleNodeIds = new Set([selectedNode.id]);
    relationshipEdges.forEach((edge) => {
      visibleNodeIds.add(edge.from);
      visibleNodeIds.add(edge.to);
    });
    const visibleEdges = filterEdgesByMode(
      relationshipEdges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
      currentState.edgeMode,
      selectedEdge?.id,
    );
    return {
      mode: "node",
      state: currentState,
      domains: model.domains,
      domainEdges: [],
      selectedDomain,
      selectedNode,
      selectedEdge,
      visibleNodes: model.nodes.filter(
        (node) => visibleNodeIds.has(node.id) && matchesSearch(node, search),
      ),
      visibleEdges,
      matchingNodeIds,
      nodeDetail: getNodeDetail(model, selectedNode.id),
      edgeDetail: selectedEdge ? getEdgeDetail(model, selectedEdge.id) : null,
    };
  }

  if (selectedDomain) {
    const focusNodeIds = new Set(selectedDomain.nodes.map((node) => node.id));
    const contextEdges = model.edges.filter(
      (edge) => focusNodeIds.has(edge.from) || focusNodeIds.has(edge.to),
    );
    const visibleNodeIds = new Set(focusNodeIds);
    contextEdges.forEach((edge) => {
      visibleNodeIds.add(edge.from);
      visibleNodeIds.add(edge.to);
    });
    const visibleEdges = filterEdgesByMode(
      contextEdges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
      currentState.edgeMode,
      selectedEdge?.id,
    );
    return {
      mode: "domain",
      state: currentState,
      domains: model.domains,
      domainEdges: [],
      selectedDomain,
      selectedNode: null,
      selectedEdge,
      visibleNodes: model.nodes.filter(
        (node) => visibleNodeIds.has(node.id) && matchesSearch(node, search),
      ),
      visibleEdges,
      matchingNodeIds,
      nodeDetail: null,
      edgeDetail: selectedEdge ? getEdgeDetail(model, selectedEdge.id) : null,
    };
  }

  return getExplorerView(model, createExplorerState());
}

export function layoutExplorerGraph(model, state, options = {}) {
  const view = getExplorerView(model, state);
  const layout =
    view.mode === "whole"
      ? layoutWholeTree(view, options)
      : view.mode === "node"
        ? layoutNodeRelationships(view, options)
        : layoutDomainFocus(view, options);
  return {
    ...layout,
    epistemicLens: view.state.epistemicLens,
    epistemicFilter: view.state.epistemicFilter,
    edgeMode: view.state.edgeMode,
    selectedEdgeId: view.selectedEdge?.id || null,
  };
}

export async function loadTreeManifest(
  url = DEFAULT_TREE_MANIFEST_URL,
  fetcher = globalThis.fetch,
) {
  if (typeof fetcher !== "function")
    throw new Error("A fetch-compatible function is required.");
  const response = await fetcher(url);
  if (!response.ok)
    throw new Error(`Tree manifest request failed: ${response.status}`);
  return response.json();
}

export async function mountTreeExplorer(options) {
  const root = options?.root;
  if (!root) throw new Error("mountTreeExplorer requires a root element.");
  const fetcher = options.fetcher || globalThis.fetch;
  const manifestUrl = options.manifestUrl || DEFAULT_TREE_MANIFEST_URL;
  const genesisBaseUrl = options.genesisBaseUrl || DEFAULT_GENESIS_BASE_URL;
  const state = {
    model: null,
    explorer: createExplorerState(options.initialState || {}),
    error: null,
    loading: true,
  };

  renderMount(root, state, genesisBaseUrl);

  try {
    const manifest = await loadTreeManifest(manifestUrl, fetcher);
    state.model = normalizeTreeManifest(manifest);
    state.loading = false;
    state.explorer = createExplorerState(options.initialState || {});
    renderMount(root, state, genesisBaseUrl);
    if (typeof options.onReady === "function") options.onReady(state.model);
  } catch (error) {
    state.loading = false;
    state.error = error;
    renderMount(root, state, genesisBaseUrl);
  }

  root.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-aift-tree-action]");
    if (!actionTarget || !state.model) return;
    const action = readAction(actionTarget);
    if (!action) return;
    state.explorer = reduceExplorerState(state.model, state.explorer, action);
    renderMount(root, state, genesisBaseUrl);
  });

  root.addEventListener("keydown", (event) => {
    const actionTarget = event.target.closest("[data-aift-tree-action]");
    if (
      !actionTarget ||
      !state.model ||
      (event.key !== "Enter" && event.key !== " ")
    )
      return;
    event.preventDefault();
    const action = readAction(actionTarget);
    if (!action) return;
    state.explorer = reduceExplorerState(state.model, state.explorer, action);
    renderMount(root, state, genesisBaseUrl);
  });

  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-aift-tree-search]");
    if (!input || !state.model) return;
    state.explorer = reduceExplorerState(state.model, state.explorer, {
      type: "search",
      search: input.value,
    });
    renderMount(root, state, genesisBaseUrl, { preserveSearchFocus: true });
  });

  root.addEventListener("change", (event) => {
    if (!state.model) return;
    const filter = event.target.closest("[data-aift-tree-epistemic-filter]");
    if (filter) {
      state.explorer = reduceExplorerState(state.model, state.explorer, {
        type: "epistemic-filter",
        epistemicFilter: filter.value,
      });
      renderMount(root, state, genesisBaseUrl);
      return;
    }

    const edgeMode = event.target.closest("[data-aift-tree-edge-mode]");
    if (edgeMode) {
      state.explorer = reduceExplorerState(state.model, state.explorer, {
        type: "edge-mode",
        edgeMode: edgeMode.value,
      });
      renderMount(root, state, genesisBaseUrl);
    }
  });

  return {
    get model() {
      return state.model;
    },
    get state() {
      return state.explorer;
    },
    dispatch(action) {
      if (!state.model) return;
      state.explorer = reduceExplorerState(state.model, state.explorer, action);
      renderMount(root, state, genesisBaseUrl);
    },
    destroy() {
      root.replaceChildren();
    },
  };
}

function renderMount(root, state, genesisBaseUrl, renderOptions = {}) {
  const doc = root.ownerDocument;
  root.replaceChildren();
  root.classList.add("aift-tree-explorer");

  if (state.loading) {
    const loading = doc.createElement("div");
    loading.className = "aift-tree-explorer__loading";
    loading.textContent = "Loading canonical Tree manifest...";
    root.append(loading);
    return;
  }

  if (state.error) {
    const error = doc.createElement("div");
    error.className = "aift-tree-explorer__error";
    error.setAttribute("role", "alert");
    error.textContent = `Tree Explorer unavailable: ${state.error.message}`;
    root.append(error);
    return;
  }

  const view = getExplorerView(state.model, state.explorer);
  const shell = doc.createElement("div");
  shell.className = "aift-tree-explorer__shell";
  shell.append(renderToolbar(doc, state.model, view));

  const body = doc.createElement("div");
  body.className = "aift-tree-explorer__body";
  body.append(renderGraph(doc, state.model, state.explorer));
  body.append(renderDetail(doc, state.model, view, genesisBaseUrl));
  shell.append(body);
  root.append(shell);

  if (renderOptions.preserveSearchFocus) {
    const input = root.querySelector("[data-aift-tree-search]");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function renderToolbar(doc, model, view) {
  const toolbar = doc.createElement("div");
  toolbar.className = "aift-tree-explorer__toolbar";

  const whole = doc.createElement("button");
  whole.type = "button";
  whole.className = buttonClass(view.mode === "whole");
  whole.dataset.aiftTreeAction = "whole";
  whole.textContent = "Whole Tree";
  toolbar.append(whole);

  const domainRail = doc.createElement("div");
  domainRail.className = "aift-tree-explorer__domains";
  domainRail.setAttribute("aria-label", "Tree domains");
  model.domains.forEach((domain) => {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = buttonClass(view.selectedDomain?.id === domain.id);
    button.dataset.aiftTreeAction = "domain";
    button.dataset.domainId = domain.id;
    button.textContent = domain.shortLabel;
    button.title = `${domain.label}: ${domain.count} nodes`;
    domainRail.append(button);
  });
  toolbar.append(domainRail);

  const lensPanel = doc.createElement("div");
  lensPanel.className = "aift-tree-explorer__lens-panel";

  const lens = doc.createElement("button");
  lens.type = "button";
  lens.className = buttonClass(view.state.epistemicLens);
  lens.dataset.aiftTreeAction = "toggle-lens";
  lens.setAttribute("aria-pressed", String(view.state.epistemicLens));
  lens.textContent = view.state.epistemicLens ? "Lens On" : "Lens Off";
  lensPanel.append(lens);

  const filterLabel = doc.createElement("label");
  filterLabel.className = "aift-tree-explorer__select";
  const filterText = doc.createElement("span");
  filterText.textContent = "Epistemic";
  const filterSelect = doc.createElement("select");
  filterSelect.dataset.aiftTreeEpistemicFilter = "true";
  filterSelect.append(selectOption(doc, "all", "All classes"));
  Object.entries(model.epistemicClasses).forEach(([id, value]) => {
    filterSelect.append(selectOption(doc, id, value.label || titleize(id)));
  });
  filterSelect.value = view.state.epistemicFilter;
  filterLabel.append(filterText, filterSelect);
  lensPanel.append(filterLabel);

  const edgeLabel = doc.createElement("label");
  edgeLabel.className = "aift-tree-explorer__select";
  const edgeText = doc.createElement("span");
  edgeText.textContent = "Edges";
  const edgeSelect = doc.createElement("select");
  edgeSelect.dataset.aiftTreeEdgeMode = "true";
  edgeSelect.append(
    selectOption(doc, "all", "All edges"),
    selectOption(doc, "primary", "Primary lineage"),
    selectOption(doc, "cross-link", "Cross-links"),
  );
  edgeSelect.value = view.state.edgeMode;
  edgeLabel.append(edgeText, edgeSelect);
  lensPanel.append(edgeLabel);
  toolbar.append(lensPanel);

  const searchLabel = doc.createElement("label");
  searchLabel.className = "aift-tree-explorer__search";
  const searchText = doc.createElement("span");
  searchText.textContent = "Search";
  const searchInput = doc.createElement("input");
  searchInput.type = "search";
  searchInput.value = view.state.search;
  searchInput.autocomplete = "off";
  searchInput.dataset.aiftTreeSearch = "true";
  searchLabel.append(searchText, searchInput);
  toolbar.append(searchLabel);

  return toolbar;
}

function renderGraph(doc, model, state) {
  const layout = layoutExplorerGraph(model, state);
  const figure = doc.createElement("figure");
  figure.className = `aift-tree-explorer__figure is-${layout.mode}`;

  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-labelledby",
    "aift-tree-graph-title aift-tree-graph-desc",
  );
  svg.classList.add("aift-tree-explorer__svg");

  const title = doc.createElementNS(SVG_NS, "title");
  title.id = "aift-tree-graph-title";
  title.textContent = graphTitle(layout);
  const desc = doc.createElementNS(SVG_NS, "desc");
  desc.id = "aift-tree-graph-desc";
  desc.textContent = graphDescription(layout);
  svg.append(title, desc);

  const edgeLayer = doc.createElementNS(SVG_NS, "g");
  edgeLayer.classList.add("aift-tree-explorer__edge-layer");
  layout.edges.forEach((edge) => {
    edgeLayer.append(renderGraphEdge(doc, edge, layout));
  });
  svg.append(edgeLayer);

  const nodeLayer = doc.createElementNS(SVG_NS, "g");
  nodeLayer.classList.add("aift-tree-explorer__node-layer");
  if (layout.mode === "whole") {
    layout.domains.forEach((domain) =>
      nodeLayer.append(renderDomainNode(doc, domain, layout)),
    );
  } else {
    layout.nodes.forEach((node) =>
      nodeLayer.append(renderTreeNode(doc, node, layout)),
    );
  }
  svg.append(nodeLayer);

  figure.append(svg);
  return figure;
}

function renderGraphEdge(doc, edge, layout) {
  const canonical = Boolean(edge.source && edge.target);
  const group = doc.createElementNS(SVG_NS, "g");
  group.classList.add(
    "aift-tree-explorer__edge-group",
    `is-${edge.role || "edge"}`,
    `is-epistemic-${edge.epistemicToken || classToken(edge.epistemicClass)}`,
    edge.id === layout.selectedEdgeId ? "is-selected" : "is-unselected",
    isEdgeDimmed(edge, layout.epistemicFilter) ? "is-dimmed" : "is-visible",
  );
  group.setAttribute("role", canonical ? "button" : "img");
  group.setAttribute("aria-label", graphEdgeLabel(edge));

  if (canonical) {
    group.setAttribute("tabindex", "0");
    group.dataset.aiftTreeAction = "edge";
    group.dataset.edgeId = edge.id;

    const hit = doc.createElementNS(SVG_NS, "path");
    hit.setAttribute("d", edge.path);
    hit.classList.add("aift-tree-explorer__edge-hit");
    group.append(hit);
  }

  const path = doc.createElementNS(SVG_NS, "path");
  path.setAttribute("d", edge.path);
  path.classList.add("aift-tree-explorer__edge", `is-${edge.role || "edge"}`);
  group.append(path);

  if (layout.epistemicLens && edge.midpoint) {
    const label = doc.createElementNS(SVG_NS, "text");
    label.classList.add("aift-tree-explorer__edge-label");
    label.setAttribute("x", String(edge.midpoint.x));
    label.setAttribute("y", String(edge.midpoint.y - 8));
    label.setAttribute("text-anchor", "middle");
    label.textContent = canonical
      ? `${edge.relationLabel} · ${edge.epistemicMark}`
      : summarizeEdgeLens(edge);
    group.append(label);
  }

  return group;
}

function graphEdgeLabel(edge) {
  if (edge.source && edge.target) {
    return `${edge.source.label} ${edge.relationLabel} ${edge.target.label}. ${edge.roleLabel}. ${edge.epistemicLabel}.`;
  }

  const role = edge.role === "primary" ? "Primary lineage" : "Cross-link";
  const epistemic = edge.epistemicSummary?.length
    ? edge.epistemicSummary
        .map((entry) => `${entry.label} (${entry.count})`)
        .join(", ")
    : "mixed epistemic classes";
  return `${formatDomainLabel(edge.from)} to ${formatDomainLabel(
    edge.to,
  )}. ${role}. ${edge.count} relationships. Epistemic classes: ${epistemic}.`;
}

function renderDomainNode(doc, domain, layout) {
  const group = doc.createElementNS(SVG_NS, "g");
  group.classList.add(
    "aift-tree-explorer__domain-node",
    isDomainDimmed(domain, layout.epistemicFilter) ? "is-dimmed" : "is-visible",
  );
  group.setAttribute("transform", `translate(${domain.x} ${domain.y})`);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute(
    "aria-label",
    `${domain.label}, ${domain.count} Tree nodes. Epistemic classes: ${domain.epistemicSummary
      .map((entry) => entry.label)
      .join(", ")}.`,
  );
  group.dataset.aiftTreeAction = "domain";
  group.dataset.domainId = domain.id;

  const rect = doc.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", "-68");
  rect.setAttribute("y", "-42");
  rect.setAttribute("width", "136");
  rect.setAttribute("height", "84");
  rect.setAttribute("rx", "8");

  const title = doc.createElementNS(SVG_NS, "text");
  title.classList.add("aift-tree-explorer__domain-title");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("y", "-8");
  title.textContent = domain.shortLabel;

  const count = doc.createElementNS(SVG_NS, "text");
  count.classList.add("aift-tree-explorer__domain-count");
  count.setAttribute("text-anchor", "middle");
  count.setAttribute("y", "18");
  count.textContent = `${domain.count} nodes`;

  group.append(rect, title, count);

  if (layout.epistemicLens) {
    const lens = doc.createElementNS(SVG_NS, "text");
    lens.classList.add("aift-tree-explorer__domain-lens");
    lens.setAttribute("text-anchor", "middle");
    lens.setAttribute("y", "34");
    lens.textContent = summarizeDomainLens(domain);
    group.append(lens);
  }

  return group;
}

function renderTreeNode(doc, layoutNode, layout) {
  const node = layoutNode.node;
  const group = doc.createElementNS(SVG_NS, "g");
  group.classList.add(
    "aift-tree-explorer__tree-node",
    layoutNode.focus ? "is-focus" : "is-context",
    layoutNode.selected ? "is-selected" : "is-unselected",
    `is-epistemic-${node.epistemicToken}`,
    isDimmedByEpistemicFilter(node.epistemicClass, layout.epistemicFilter)
      ? "is-dimmed"
      : "is-visible",
  );
  group.setAttribute("transform", `translate(${layoutNode.x} ${layoutNode.y})`);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute(
    "aria-label",
    `${node.label}. ${node.epistemicLabel}. ${node.epistemicDefinition || ""}`,
  );
  group.dataset.aiftTreeAction = "node";
  group.dataset.nodeId = node.id;

  const rect = doc.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", "-88");
  rect.setAttribute("y", "-26");
  rect.setAttribute("width", "176");
  rect.setAttribute("height", "52");
  rect.setAttribute("rx", "8");

  const label = doc.createElementNS(SVG_NS, "text");
  label.classList.add("aift-tree-explorer__node-label");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("y", "-4");
  label.textContent = truncate(node.shortLabel || node.label, 22);

  const epistemic = doc.createElementNS(SVG_NS, "text");
  epistemic.classList.add("aift-tree-explorer__node-meta");
  epistemic.setAttribute("text-anchor", "middle");
  epistemic.setAttribute("y", "16");
  epistemic.textContent = truncate(node.epistemicLabel, 24);

  group.append(rect, label, epistemic);

  if (layout.epistemicLens) {
    const badge = doc.createElementNS(SVG_NS, "text");
    badge.classList.add("aift-tree-explorer__node-badge");
    badge.setAttribute("x", "-78");
    badge.setAttribute("y", "-12");
    badge.textContent = node.epistemicMark;
    group.append(badge);
  }

  return group;
}

function renderDetail(doc, model, view, genesisBaseUrl) {
  const panel = doc.createElement("aside");
  panel.className = "aift-tree-explorer__detail";
  panel.setAttribute("aria-live", "polite");

  if (view.edgeDetail) {
    renderEdgeDetail(panel, doc, view.edgeDetail, genesisBaseUrl);
    return panel;
  }

  if (view.nodeDetail) {
    renderNodeDetail(panel, doc, model, view.nodeDetail, genesisBaseUrl);
    return panel;
  }

  if (view.selectedDomain) {
    renderDomainDetail(panel, doc, view.selectedDomain, view.matchingNodeIds);
    return panel;
  }

  const heading = doc.createElement("h3");
  heading.textContent = model.title || "AIFT Tree of Emergence";
  const metadata = detailGrid(doc, [
    ["Model ID", model.modelId],
    ["Version", model.modelVersion],
    ["Status", model.status],
    ["Nodes", String(model.nodes.length)],
    ["Edges", String(model.edges.length)],
  ]);
  const list = doc.createElement("div");
  list.className = "aift-tree-explorer__domain-list";
  model.domains.forEach((domain) => {
    const button = doc.createElement("button");
    button.type = "button";
    button.dataset.aiftTreeAction = "domain";
    button.dataset.domainId = domain.id;
    button.textContent = `${domain.label} (${domain.count})`;
    list.append(button);
  });
  panel.append(heading, metadata, list);
  return panel;
}

function renderDomainDetail(panel, doc, domain, matchingNodeIds) {
  const heading = doc.createElement("h3");
  heading.textContent = domain.label;
  const metadata = detailGrid(doc, [
    ["Domain ID", domain.id],
    ["Nodes", String(domain.count)],
    [
      "Epistemic classes",
      domain.epistemicSummary
        .map((entry) => `${entry.label} (${entry.count})`)
        .join(", "),
    ],
    ["Internal edges", String(domain.internalEdges.length)],
    ["Incoming edges", String(domain.inboundEdges.length)],
    ["Outgoing edges", String(domain.outboundEdges.length)],
  ]);
  const list = doc.createElement("div");
  list.className = "aift-tree-explorer__node-list";
  domain.nodes
    .filter((node) => matchingNodeIds.has(node.id))
    .forEach((node) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.dataset.aiftTreeAction = "node";
      button.dataset.nodeId = node.id;
      button.innerHTML = `<span>${escapeHtml(node.label)}</span><small>${escapeHtml(node.epistemicLabel)}</small>`;
      list.append(button);
    });
  panel.append(heading, metadata, list);
}

function renderEdgeDetail(panel, doc, detail, genesisBaseUrl) {
  const { edge, source, target, sources, epistemicDefinition } = detail;

  const returnButton = doc.createElement("button");
  returnButton.type = "button";
  returnButton.className = "aift-tree-explorer__back";
  returnButton.dataset.aiftTreeAction = "node";
  returnButton.dataset.nodeId = source.id;
  returnButton.textContent = source.label;

  const heading = doc.createElement("h3");
  heading.textContent = `${source.shortLabel || source.label} -> ${edge.relationLabel} -> ${target.shortLabel || target.label}`;

  const description = doc.createElement("p");
  description.className = "aift-tree-explorer__description";
  description.textContent = edge.description || "";

  const metadata = detailGrid(doc, [
    ["Edge ID", edge.id],
    ["Relation", edge.relationLabel],
    ["Role", edge.roleLabel],
    ["Epistemic class", edge.epistemicLabel],
    ["From", source.label],
    ["To", target.label],
  ]);

  const epistemic = doc.createElement("p");
  epistemic.className = "aift-tree-explorer__epistemic-definition";
  epistemic.textContent = epistemicDefinition || "";

  const traversal = doc.createElement("div");
  traversal.className = "aift-tree-explorer__traversal";
  const sourceButton = doc.createElement("button");
  sourceButton.type = "button";
  sourceButton.dataset.aiftTreeAction = "node";
  sourceButton.dataset.nodeId = source.id;
  sourceButton.textContent = `Open ${source.label}`;
  const targetButton = doc.createElement("button");
  targetButton.type = "button";
  targetButton.dataset.aiftTreeAction = "node";
  targetButton.dataset.nodeId = target.id;
  targetButton.textContent = `Open ${target.label}`;
  traversal.append(sourceButton, targetButton);

  const sourceList = renderSourceList(doc, sources, genesisBaseUrl);
  panel.append(
    returnButton,
    heading,
    description,
    metadata,
    epistemic,
    traversal,
    sourceList,
  );
}

function renderNodeDetail(panel, doc, model, detail, genesisBaseUrl) {
  const {
    node,
    incoming,
    outgoing,
    sources,
    canonicalUrl,
    epistemicDefinition,
  } = detail;
  const domainButton = doc.createElement("button");
  domainButton.type = "button";
  domainButton.className = "aift-tree-explorer__back";
  domainButton.dataset.aiftTreeAction = "domain";
  domainButton.dataset.domainId = node.domain;
  domainButton.textContent = node.domainLabel;

  const heading = doc.createElement("h3");
  heading.textContent = node.label;

  const description = doc.createElement("p");
  description.className = "aift-tree-explorer__description";
  description.textContent = node.description || "";

  const metadata = detailGrid(doc, [
    ["Node ID", node.id],
    ["Domain", node.domainLabel],
    ["Epistemic class", node.epistemicLabel],
    ["Status", node.status],
    ["Tree part", node.metadata?.part || ""],
  ]);

  const epistemic = doc.createElement("p");
  epistemic.className = "aift-tree-explorer__epistemic-definition";
  epistemic.textContent = epistemicDefinition || "";

  const relationships = doc.createElement("div");
  relationships.className = "aift-tree-explorer__relationships";
  relationships.append(
    relationshipGroup(doc, "Incoming", incoming, (edge) => edge.source, model),
    relationshipGroup(doc, "Outgoing", outgoing, (edge) => edge.target, model),
  );

  const sourceList = renderSourceList(doc, sources, genesisBaseUrl);
  const links = doc.createElement("div");
  links.className = "aift-tree-explorer__links";
  if (canonicalUrl) {
    const canonical = doc.createElement("a");
    canonical.href = canonicalUrl;
    canonical.textContent = "Canonical document";
    links.append(canonical);
  }

  panel.append(
    domainButton,
    heading,
    description,
    metadata,
    epistemic,
    relationships,
    sourceList,
    links,
  );
}

function relationshipGroup(doc, title, edges, endpoint, model) {
  const group = doc.createElement("section");
  const heading = doc.createElement("h4");
  heading.textContent = title;
  const list = doc.createElement("div");
  list.className = "aift-tree-explorer__relationship-list";

  if (edges.length === 0) {
    const empty = doc.createElement("p");
    empty.textContent = "None";
    list.append(empty);
  } else {
    edges.forEach((edge) => {
      const targetNode = endpoint(edge);
      const button = doc.createElement("button");
      button.type = "button";
      button.dataset.aiftTreeAction = "edge";
      button.dataset.edgeId = edge.id;
      button.innerHTML = `<span>${escapeHtml(targetNode.label)}</span><small>${escapeHtml(edge.relationLabel)} · ${escapeHtml(edge.roleLabel)} · ${escapeHtml(model.epistemicClasses[edge.epistemicClass]?.label || titleize(edge.epistemicClass))}</small>`;
      list.append(button);
    });
  }

  group.append(heading, list);
  return group;
}

function renderSourceList(doc, sources, genesisBaseUrl) {
  const section = doc.createElement("section");
  section.className = "aift-tree-explorer__sources";
  const heading = doc.createElement("h4");
  heading.textContent = "Sources";
  const list = doc.createElement("div");
  list.className = "aift-tree-explorer__source-list";

  if (sources.length === 0) {
    const empty = doc.createElement("p");
    empty.textContent = "No source references listed for this node.";
    list.append(empty);
  } else {
    sources.forEach((source) => {
      const link = doc.createElement("a");
      link.href = new URL(source.uri || "", genesisBaseUrl).href;
      link.textContent = source.label || source.id;
      list.append(link);
    });
  }

  section.append(heading, list);
  return section;
}

function layoutWholeTree(view, options) {
  const width = options.width || 1280;
  const height = options.height || 620;
  const columns = Math.min(
    4,
    Math.max(1, Math.ceil(Math.sqrt(view.domains.length))),
  );
  const rows = Math.ceil(view.domains.length / columns);
  const xStep = width / columns;
  const yStep = height / rows;
  const domains = view.domains.map((domain, index) => ({
    ...domain,
    x: xStep * (index % columns) + xStep / 2,
    y: yStep * Math.floor(index / columns) + yStep / 2,
  }));
  const domainPositions = new Map(domains.map((domain) => [domain.id, domain]));
  const edges = view.domainEdges
    .map((edge) => {
      const source = domainPositions.get(edge.from);
      const target = domainPositions.get(edge.to);
      if (!source || !target) return null;
      return {
        ...edge,
        path: curvedPath(source.x, source.y, target.x, target.y),
        midpoint: midpoint(source.x, source.y, target.x, target.y),
      };
    })
    .filter(Boolean);
  return { mode: "whole", width, height, domains, edges, nodes: [] };
}

function layoutDomainFocus(view, options) {
  const width = options.width || 1280;
  const height = options.height || 700;
  const focusDomainId = view.selectedDomain.id;
  const focus = view.visibleNodes.filter(
    (node) => node.domain === focusDomainId,
  );
  const left = view.visibleNodes.filter(
    (node) =>
      node.domain !== focusDomainId &&
      hasOutgoingTo(node, focusDomainId, view.visibleEdges),
  );
  const right = view.visibleNodes.filter(
    (node) => node.domain !== focusDomainId && !left.includes(node),
  );
  const nodes = [
    ...positionColumn(left, 220, height, false, false),
    ...positionColumn(focus, 640, height, true, false),
    ...positionColumn(right, 1060, height, false, false),
  ];
  const positions = new Map(
    nodes.map((layoutNode) => [layoutNode.node.id, layoutNode]),
  );
  const edges = view.visibleEdges
    .map((edge) => edgeWithPath(edge, positions))
    .filter(Boolean);
  return { mode: "domain", width, height, domains: [], nodes, edges };
}

function layoutNodeRelationships(view, options) {
  const width = options.width || 1280;
  const height = options.height || 620;
  const selectedNodeId = view.selectedNode.id;
  const incoming = view.visibleEdges
    .filter((edge) => edge.to === selectedNodeId)
    .map((edge) => edge.source);
  const outgoing = view.visibleEdges
    .filter((edge) => edge.from === selectedNodeId)
    .map((edge) => edge.target);
  const selected = [view.selectedNode];
  const nodes = [
    ...positionColumn(uniqueNodes(incoming), 230, height, false, false),
    ...positionColumn(selected, 640, height, true, true),
    ...positionColumn(uniqueNodes(outgoing), 1050, height, false, false),
  ];
  const positions = new Map(
    nodes.map((layoutNode) => [layoutNode.node.id, layoutNode]),
  );
  const edges = view.visibleEdges
    .map((edge) => edgeWithPath(edge, positions))
    .filter(Boolean);
  return { mode: "node", width, height, domains: [], nodes, edges };
}

function positionColumn(nodes, x, height, focus, selected) {
  const sorted = [...uniqueNodes(nodes)].sort((a, b) => a.index - b.index);
  const top = Math.max(70, (height - (sorted.length - 1) * 76) / 2);
  return sorted.map((node, index) => ({
    node,
    x,
    y: top + index * 76,
    focus,
    selected: selected || false,
  }));
}

function edgeWithPath(edge, positions) {
  const source = positions.get(edge.from);
  const target = positions.get(edge.to);
  if (!source || !target) return null;
  return {
    ...edge,
    path: curvedPath(source.x, source.y, target.x, target.y),
    midpoint: midpoint(source.x, source.y, target.x, target.y),
  };
}

function curvedPath(x1, y1, x2, y2) {
  const dx = Math.max(80, Math.abs(x2 - x1) * 0.45);
  const c1x = x1 + (x2 >= x1 ? dx : -dx);
  const c2x = x2 - (x2 >= x1 ? dx : -dx);
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
}

function midpoint(x1, y1, x2, y2) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
}

function summarizeDomainEdges(edges) {
  const summaries = new Map();
  edges.forEach((edge) => {
    if (edge.source.domain === edge.target.domain) return;
    const id = `${edge.source.domain}->${edge.target.domain}`;
    const existing = summaries.get(id) || {
      id,
      from: edge.source.domain,
      to: edge.target.domain,
      role: edge.role,
      count: 0,
      epistemicSummary: [],
    };
    existing.count += 1;
    if (edge.role === "primary") existing.role = "primary";
    addEpistemicSummaryEntry(existing.epistemicSummary, edge);
    summaries.set(id, existing);
  });
  return [...summaries.values()].map((summary) => ({
    ...summary,
    epistemicSummary: summary.epistemicSummary.sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    ),
  }));
}

function summarizeEpistemicClasses(nodes) {
  const counts = new Map();
  nodes.forEach((node) => {
    const key = node.epistemicClass || "unknown";
    const existing = counts.get(key) || {
      id: key,
      label: node.epistemicLabel || titleize(key),
      mark: node.epistemicMark || epistemicMark(key),
      count: 0,
    };
    existing.count += 1;
    counts.set(key, existing);
  });
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function summarizeDomainLens(domain) {
  return domain.epistemicSummary
    .slice(0, 2)
    .map((entry) => `${entry.mark}:${entry.count}`)
    .join(" ");
}

function summarizeEdgeLens(edge) {
  if (!edge.epistemicSummary?.length) return `${edge.count || 1} links`;
  return edge.epistemicSummary
    .slice(0, 2)
    .map((entry) => `${entry.mark}:${entry.count}`)
    .join(" ");
}

function addEpistemicSummaryEntry(summary, item) {
  const id = item.epistemicClass || "unknown";
  const existing = summary.find((entry) => entry.id === id);
  if (existing) {
    existing.count += 1;
    return;
  }
  summary.push({
    id,
    label: item.epistemicLabel || titleize(id),
    mark: item.epistemicMark || epistemicMark(id),
    count: 1,
  });
}

function filterEdgesByMode(edges, edgeMode, selectedEdgeId) {
  if (!edgeMode || edgeMode === "all") return edges;
  return edges.filter(
    (edge) => edge.role === edgeMode || edge.id === selectedEdgeId,
  );
}

function isEdgeDimmed(edge, epistemicFilter) {
  if (!epistemicFilter || epistemicFilter === "all") return false;
  if (edge.epistemicSummary) {
    return !edge.epistemicSummary.some((entry) => entry.id === epistemicFilter);
  }
  return edge.epistemicClass !== epistemicFilter;
}

function isDimmedByEpistemicFilter(epistemicClass, epistemicFilter) {
  return Boolean(
    epistemicFilter &&
    epistemicFilter !== "all" &&
    epistemicClass !== epistemicFilter,
  );
}

function isDomainDimmed(domain, epistemicFilter) {
  if (!epistemicFilter || epistemicFilter === "all") return false;
  return !domain.epistemicSummary.some((entry) => entry.id === epistemicFilter);
}

function computePrimaryDepths(roots, outgoingByNode) {
  const depths = new Map();
  const queue = roots.map((id) => [id, 0]);
  while (queue.length > 0) {
    const [nodeId, depth] = queue.shift();
    if (depths.has(nodeId) && depths.get(nodeId) <= depth) continue;
    depths.set(nodeId, depth);
    (outgoingByNode.get(nodeId) || []).forEach((edge) =>
      queue.push([edge.to, depth + 1]),
    );
  }
  return depths;
}

function mapEdges(edges, key) {
  const map = new Map();
  edges.forEach((edge) => {
    const nodeId = edge[key];
    const group = map.get(nodeId) || [];
    group.push(edge);
    map.set(nodeId, group);
  });
  return map;
}

function resolveSources(sourceIds = [], sourceRefsById) {
  return sourceIds.map((id) => sourceRefsById.get(id)).filter(Boolean);
}

function matchesSearch(node, search) {
  if (!search) return true;
  return [
    node.id,
    node.label,
    node.shortLabel,
    node.description,
    node.domain,
    node.epistemicClass,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(search));
}

function hasOutgoingTo(node, domainId, edges) {
  return edges.some(
    (edge) => edge.from === node.id && edge.target.domain === domainId,
  );
}

function uniqueNodes(nodes) {
  return [...new Map(nodes.map((node) => [node.id, node])).values()];
}

function readAction(target) {
  const type = target.dataset.aiftTreeAction;
  if (type === "whole") return { type };
  if (type === "domain") return { type, domainId: target.dataset.domainId };
  if (type === "node") return { type, nodeId: target.dataset.nodeId };
  if (type === "edge") return { type, edgeId: target.dataset.edgeId };
  if (type === "toggle-lens") return { type };
  return null;
}

function buttonClass(active) {
  return active
    ? "aift-tree-explorer__button is-active"
    : "aift-tree-explorer__button";
}

function detailGrid(doc, rows) {
  const grid = doc.createElement("dl");
  grid.className = "aift-tree-explorer__meta-grid";
  rows
    .filter((row) => row[1])
    .forEach(([key, value]) => {
      const term = doc.createElement("dt");
      term.textContent = key;
      const detail = doc.createElement("dd");
      detail.textContent = value;
      grid.append(term, detail);
    });
  return grid;
}

function selectOption(doc, value, label) {
  const option = doc.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function graphTitle(layout) {
  if (layout.mode === "whole") return "AIFT Tree of Emergence domain map";
  if (layout.mode === "node")
    return "AIFT Tree of Emergence node relationships";
  return "AIFT Tree of Emergence domain focus";
}

function graphDescription(layout) {
  if (layout.mode === "whole")
    return "Whole-tree view grouped by canonical Genesis domain.";
  if (layout.mode === "node")
    return "Selected node with incoming and outgoing relationships.";
  return "Selected domain with adjacent context nodes.";
}

function truncate(value, length) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
