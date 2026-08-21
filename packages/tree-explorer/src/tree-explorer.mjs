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
      relationLabel: titleize(edge.relation),
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
    search: overrides.search || "",
  };
}

export function reduceExplorerState(model, state, action) {
  switch (action.type) {
    case "whole":
      return createExplorerState({ search: state.search });
    case "domain":
      return createExplorerState({
        view: "domain",
        domainId: model.domainsById.has(action.domainId)
          ? action.domainId
          : state.domainId,
        search: state.search,
      });
    case "node": {
      const node = model.nodesById.get(action.nodeId);
      return createExplorerState({
        view: "node",
        nodeId: node?.id || state.nodeId,
        domainId: node?.domain || state.domainId,
        search: state.search,
      });
    }
    case "search":
      return createExplorerState({
        ...state,
        search: action.search || "",
      });
    default:
      return state;
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
    epistemicDefinition:
      model.epistemicClasses[node.epistemicClass]?.definition || null,
  };
}

export function getExplorerView(model, state) {
  const currentState = createExplorerState(state);
  const search = currentState.search.trim().toLowerCase();
  const selectedNode = currentState.nodeId
    ? model.nodesById.get(currentState.nodeId)
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
    return {
      mode: "whole",
      state: currentState,
      domains: model.domains,
      domainEdges: summarizeDomainEdges(model.edges),
      selectedDomain: null,
      selectedNode: null,
      visibleNodes: model.nodes.filter((node) => matchingNodeIds.has(node.id)),
      visibleEdges: model.edges,
      matchingNodeIds,
      nodeDetail: null,
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
    return {
      mode: "node",
      state: currentState,
      domains: model.domains,
      domainEdges: [],
      selectedDomain,
      selectedNode,
      visibleNodes: model.nodes.filter(
        (node) => visibleNodeIds.has(node.id) && matchesSearch(node, search),
      ),
      visibleEdges: relationshipEdges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
      matchingNodeIds,
      nodeDetail: getNodeDetail(model, selectedNode.id),
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
    return {
      mode: "domain",
      state: currentState,
      domains: model.domains,
      domainEdges: [],
      selectedDomain,
      selectedNode: null,
      visibleNodes: model.nodes.filter(
        (node) => visibleNodeIds.has(node.id) && matchesSearch(node, search),
      ),
      visibleEdges: contextEdges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
      matchingNodeIds,
      nodeDetail: null,
    };
  }

  return getExplorerView(model, createExplorerState());
}

export function layoutExplorerGraph(model, state, options = {}) {
  const view = getExplorerView(model, state);
  if (view.mode === "whole") return layoutWholeTree(view, options);
  if (view.mode === "node") return layoutNodeRelationships(view, options);
  return layoutDomainFocus(view, options);
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
  const activeSearch = state.explorer.search;
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
  shell.append(renderToolbar(doc, state.model, view, activeSearch));

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

function renderToolbar(doc, model, view, search) {
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

  const searchLabel = doc.createElement("label");
  searchLabel.className = "aift-tree-explorer__search";
  const searchText = doc.createElement("span");
  searchText.textContent = "Search";
  const searchInput = doc.createElement("input");
  searchInput.type = "search";
  searchInput.value = search;
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
    const path = doc.createElementNS(SVG_NS, "path");
    path.setAttribute("d", edge.path);
    path.classList.add("aift-tree-explorer__edge", `is-${edge.role || "edge"}`);
    edgeLayer.append(path);
  });
  svg.append(edgeLayer);

  const nodeLayer = doc.createElementNS(SVG_NS, "g");
  nodeLayer.classList.add("aift-tree-explorer__node-layer");
  if (layout.mode === "whole") {
    layout.domains.forEach((domain) =>
      nodeLayer.append(renderDomainNode(doc, domain)),
    );
  } else {
    layout.nodes.forEach((node) => nodeLayer.append(renderTreeNode(doc, node)));
  }
  svg.append(nodeLayer);

  figure.append(svg);
  return figure;
}

function renderDomainNode(doc, domain) {
  const group = doc.createElementNS(SVG_NS, "g");
  group.classList.add("aift-tree-explorer__domain-node");
  group.setAttribute("transform", `translate(${domain.x} ${domain.y})`);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute(
    "aria-label",
    `${domain.label}, ${domain.count} Tree nodes`,
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
  return group;
}

function renderTreeNode(doc, layoutNode) {
  const node = layoutNode.node;
  const group = doc.createElementNS(SVG_NS, "g");
  group.classList.add(
    "aift-tree-explorer__tree-node",
    layoutNode.focus ? "is-focus" : "is-context",
    layoutNode.selected ? "is-selected" : "is-unselected",
  );
  group.setAttribute("transform", `translate(${layoutNode.x} ${layoutNode.y})`);
  group.setAttribute("role", "button");
  group.setAttribute("tabindex", "0");
  group.setAttribute("aria-label", `${node.label}, ${node.epistemicLabel}`);
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
  return group;
}

function renderDetail(doc, model, view, genesisBaseUrl) {
  const panel = doc.createElement("aside");
  panel.className = "aift-tree-explorer__detail";
  panel.setAttribute("aria-live", "polite");

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
      button.dataset.aiftTreeAction = "node";
      button.dataset.nodeId = targetNode.id;
      button.innerHTML = `<span>${escapeHtml(targetNode.label)}</span><small>${escapeHtml(edge.relationLabel)} · ${escapeHtml(model.epistemicClasses[edge.epistemicClass]?.label || titleize(edge.epistemicClass))}</small>`;
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
  };
}

function curvedPath(x1, y1, x2, y2) {
  const dx = Math.max(80, Math.abs(x2 - x1) * 0.45);
  const c1x = x1 + (x2 >= x1 ? dx : -dx);
  const c2x = x2 - (x2 >= x1 ? dx : -dx);
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
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
    };
    existing.count += 1;
    if (edge.role === "primary") existing.role = "primary";
    summaries.set(id, existing);
  });
  return [...summaries.values()];
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
