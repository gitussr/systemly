/**
 * Architecture Playground model: component types (MASTER-PROMPT §12), their properties,
 * the graph a reader builds, presets, and the shareable URL encoding.
 *
 * Edges point in the direction requests and messages flow: client → load balancer → app,
 * producer → queue → consumer.
 */

export type NodeKind = 'edge' | 'entry' | 'compute' | 'async' | 'data';

export interface PropertyOption {
  value: string;
  label: string;
}

export interface PropertyDef {
  id: string;
  label: string;
  options: PropertyOption[];
  default: string;
}

export interface NodeType {
  id: string;
  label: string;
  kind: NodeKind;
  /** Mermaid shape: [open, close] around the label. */
  shape: [string, string];
  chapter?: string;
  properties?: PropertyDef[];
}

const INSTANCES: PropertyDef = {
  id: 'instances',
  label: 'Instances',
  options: [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3 or more' },
  ],
  default: '1',
};

const SESSIONS: PropertyDef = {
  id: 'sessions',
  label: 'User sessions',
  options: [
    { value: 'none', label: 'Not used' },
    { value: 'local', label: 'Kept in instance memory' },
    { value: 'shared', label: 'Kept in a shared store' },
    { value: 'token', label: 'Stateless tokens' },
  ],
  default: 'none',
};

const FILES: PropertyDef = {
  id: 'files',
  label: 'Uploaded files',
  options: [
    { value: 'none', label: 'Not used' },
    { value: 'local-disk', label: 'Saved on local disk' },
    { value: 'shared', label: 'Saved in shared storage' },
  ],
  default: 'none',
};

const COMPUTE_PROPERTIES = [INSTANCES, SESSIONS, FILES];

export const NODE_TYPES = [
  { id: 'client', label: 'Client', kind: 'edge', shape: ['(["', '"])'], chapter: 'client-server-architecture' },
  { id: 'dns', label: 'DNS', kind: 'edge', shape: ['["', '"]'], chapter: 'dns' },
  { id: 'cdn', label: 'CDN', kind: 'edge', shape: ['["', '"]'], chapter: 'cdn' },
  { id: 'reverse-proxy', label: 'Reverse proxy', kind: 'entry', shape: ['["', '"]'], chapter: 'reverse-proxy' },
  { id: 'load-balancer', label: 'Load balancer', kind: 'entry', shape: ['["', '"]'], chapter: 'load-balancer' },
  { id: 'api-gateway', label: 'API gateway', kind: 'entry', shape: ['["', '"]'], chapter: 'api-gateway' },
  { id: 'api', label: 'API', kind: 'compute', shape: ['["', '"]'], chapter: 'apis', properties: COMPUTE_PROPERTIES },
  {
    id: 'application',
    label: 'Application',
    kind: 'compute',
    shape: ['["', '"]'],
    chapter: 'anatomy-of-a-web-application',
    properties: COMPUTE_PROPERTIES,
  },
  { id: 'service', label: 'Service', kind: 'compute', shape: ['["', '"]'], chapter: 'microservices', properties: COMPUTE_PROPERTIES },
  { id: 'worker', label: 'Worker', kind: 'async', shape: ['["', '"]'], chapter: 'worker', properties: [INSTANCES, FILES] },
  { id: 'queue', label: 'Queue', kind: 'async', shape: ['[["', '"]]'], chapter: 'message-queue' },
  {
    id: 'cache',
    label: 'Cache',
    kind: 'data',
    shape: ['{{"', '"}}'],
    chapter: 'caching',
    properties: [
      {
        id: 'invalidation',
        label: 'Invalidation strategy',
        options: [
          { value: 'undefined', label: 'Not decided' },
          { value: 'ttl', label: 'Expire after a time (TTL)' },
          { value: 'on-write', label: 'Delete or update on write' },
          { value: 'ttl-and-on-write', label: 'Both' },
        ],
        default: 'undefined',
      },
    ],
  },
  {
    id: 'database',
    label: 'Database',
    kind: 'data',
    shape: ['[("', '")]'],
    chapter: 'relational-databases',
    properties: [
      {
        id: 'access',
        label: 'Network access',
        options: [
          { value: 'private', label: 'Private network only' },
          { value: 'public', label: 'Reachable from the internet' },
        ],
        default: 'private',
      },
    ],
  },
  { id: 'read-replica', label: 'Read replica', kind: 'data', shape: ['[("', '")]'], chapter: 'read-replicas' },
  { id: 'object-storage', label: 'Object storage', kind: 'data', shape: ['[("', '")]'], chapter: 'object-storage' },
  { id: 'search', label: 'Search', kind: 'data', shape: ['["', '"]'], chapter: 'search-system' },
] as const satisfies readonly NodeType[];

export type NodeTypeId = (typeof NODE_TYPES)[number]['id'];

const TYPES = new Map<string, NodeType>(NODE_TYPES.map((t) => [t.id, t]));

export function nodeType(id: string): NodeType | undefined {
  return TYPES.get(id);
}

export interface GraphNode {
  id: string;
  type: NodeTypeId;
  name: string;
  props: Record<string, string>;
}

export interface Graph {
  nodes: GraphNode[];
  /** [from, to] node ids. */
  edges: [string, string][];
}

export const MAX_NODES = 40;
export const MAX_NAME_LENGTH = 40;

export function defaultProps(type: NodeTypeId): Record<string, string> {
  return Object.fromEntries((nodeType(type)?.properties ?? []).map((p) => [p.id, p.default]));
}

export function nextId(graph: Graph): string {
  let n = graph.nodes.length + 1;
  const used = new Set(graph.nodes.map((node) => node.id));
  while (used.has(`n${n}`)) n++;
  return `n${n}`;
}

export function addNode(graph: Graph, type: NodeTypeId, name?: string): Graph {
  if (graph.nodes.length >= MAX_NODES) return graph;
  const id = nextId(graph);
  const label = name ?? nodeType(type)?.label ?? type;
  return { ...graph, nodes: [...graph.nodes, { id, type, name: label, props: defaultProps(type) }] };
}

export function removeNode(graph: Graph, id: string): Graph {
  return {
    nodes: graph.nodes.filter((n) => n.id !== id),
    edges: graph.edges.filter(([a, b]) => a !== id && b !== id),
  };
}

export function connect(graph: Graph, from: string, to: string): Graph {
  if (from === to || graph.edges.some(([a, b]) => a === from && b === to)) return graph;
  if (!graph.nodes.some((n) => n.id === from) || !graph.nodes.some((n) => n.id === to)) return graph;
  return { ...graph, edges: [...graph.edges, [from, to]] };
}

export function disconnect(graph: Graph, from: string, to: string): Graph {
  return { ...graph, edges: graph.edges.filter(([a, b]) => !(a === from && b === to)) };
}

// ---------- presets (MASTER-PROMPT §7, V1–V4) ----------

type PresetNode = [id: string, type: NodeTypeId, name: string, props?: Record<string, string>];

function build(nodes: PresetNode[], edges: [string, string][]): Graph {
  return {
    nodes: nodes.map(([id, type, name, props]) => ({ id, type, name, props: { ...defaultProps(type), ...props } })),
    edges,
  };
}

export const PRESETS: { id: string; label: string; graph: () => Graph }[] = [
  { id: 'blank', label: 'Blank', graph: () => ({ nodes: [], edges: [] }) },
  {
    id: 'v1',
    label: 'V1 — Monolith',
    graph: () =>
      build(
        [
          ['n1', 'client', 'Client'],
          ['n2', 'application', 'Monolith'],
          ['n3', 'database', 'Database'],
        ],
        [
          ['n1', 'n2'],
          ['n2', 'n3'],
        ],
      ),
  },
  {
    id: 'v2',
    label: 'V2 — Load-balanced instances',
    graph: () =>
      build(
        [
          ['n1', 'client', 'Client'],
          ['n2', 'load-balancer', 'Load Balancer'],
          ['n3', 'application', 'Application Instances', { instances: '2' }],
          ['n4', 'database', 'Database'],
        ],
        [
          ['n1', 'n2'],
          ['n2', 'n3'],
          ['n3', 'n4'],
        ],
      ),
  },
  {
    id: 'v3',
    label: 'V3 — CDN and cache',
    graph: () =>
      build(
        [
          ['n1', 'client', 'Client'],
          ['n2', 'cdn', 'CDN'],
          ['n3', 'load-balancer', 'Load Balancer'],
          ['n4', 'application', 'Application Instances', { instances: '2' }],
          ['n5', 'cache', 'Cache'],
          ['n6', 'database', 'Database'],
        ],
        [
          ['n1', 'n2'],
          ['n1', 'n3'],
          ['n3', 'n4'],
          ['n4', 'n5'],
          ['n4', 'n6'],
        ],
      ),
  },
  {
    id: 'v4',
    label: 'V4 — Queue and workers',
    graph: () =>
      build(
        [
          ['n1', 'client', 'Client'],
          ['n2', 'load-balancer', 'Load Balancer'],
          ['n3', 'application', 'Application', { instances: '2' }],
          ['n4', 'queue', 'Queue'],
          ['n5', 'worker', 'Workers', { instances: '2' }],
          ['n6', 'database', 'Database'],
          ['n7', 'object-storage', 'Object Storage'],
        ],
        [
          ['n1', 'n2'],
          ['n2', 'n3'],
          ['n3', 'n4'],
          ['n3', 'n6'],
          ['n4', 'n5'],
          ['n5', 'n6'],
          ['n5', 'n7'],
        ],
      ),
  },
];

export const DEFAULT_PRESET = 'v1';

// ---------- shareable encoding ----------

type Encoded = { n: [string, string, string, Record<string, string>][]; e: [string, string][] };

export function encodeGraph(graph: Graph): string {
  const data: Encoded = {
    n: graph.nodes.map((n) => [n.id, n.type, n.name, n.props]),
    e: graph.edges,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodes and validates untrusted input; returns undefined if anything is off. */
export function decodeGraph(text: string): Graph | undefined {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Encoded;
    if (!Array.isArray(data.n) || !Array.isArray(data.e) || data.n.length > MAX_NODES) return undefined;

    const nodes: GraphNode[] = [];
    for (const [id, type, name, props] of data.n) {
      const def = nodeType(type);
      if (typeof id !== 'string' || !/^n\d{1,4}$/.test(id) || !def || typeof name !== 'string') return undefined;
      const clean: Record<string, string> = defaultProps(def.id as NodeTypeId);
      for (const p of def.properties ?? []) {
        const value = props?.[p.id];
        if (typeof value === 'string' && p.options.some((o) => o.value === value)) clean[p.id] = value;
      }
      nodes.push({ id, type: def.id as NodeTypeId, name: name.slice(0, MAX_NAME_LENGTH), props: clean });
    }
    const ids = new Set(nodes.map((n) => n.id));
    if (ids.size !== nodes.length) return undefined;
    const edges = data.e.filter(
      (edge): edge is [string, string] =>
        Array.isArray(edge) && ids.has(edge[0]) && ids.has(edge[1]) && edge[0] !== edge[1],
    );
    return { nodes, edges };
  } catch {
    return undefined;
  }
}
