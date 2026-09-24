/**
 * Educational checks for a Playground design (MASTER-PROMPT §12).
 * Each check returns the components it concerns; the wording and explanations live in
 * content/playground/checks.yaml, keyed by check id.
 */
import { nodeType, type Graph, type GraphNode } from './model';

export const CHECK_IDS = [
  'database-public',
  'local-filesystem',
  'queue-without-consumer',
  'no-redundancy',
  'local-sessions',
  'cache-invalidation-undefined',
] as const;

export type CheckId = (typeof CHECK_IDS)[number];

export interface Finding {
  check: CheckId;
  /** Components the finding is about. */
  nodes: string[];
}

/** Components that accept traffic from the internet. */
const PUBLIC_ENTRY = new Set(['client', 'dns', 'cdn', 'load-balancer', 'reverse-proxy', 'api-gateway']);
const COMPUTE = new Set(['api', 'application', 'service', 'worker']);

const instances = (n: GraphNode) => Number(n.props.instances ?? '1');

export function runChecks(graph: Graph): Finding[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const incoming = (id: string) => graph.edges.filter(([, to]) => to === id).map(([from]) => byId.get(from)!);
  const outgoing = (id: string) => graph.edges.filter(([from]) => from === id).map(([, to]) => byId.get(to)!);
  const findings: Finding[] = [];
  const add = (check: CheckId, nodes: GraphNode[]) => {
    if (nodes.length > 0) findings.push({ check, nodes: nodes.map((n) => n.id) });
  };

  // A database reached directly from a public entry point, or set to public access.
  add(
    'database-public',
    graph.nodes.filter(
      (n) =>
        (n.type === 'database' || n.type === 'read-replica') &&
        (n.props.access === 'public' || incoming(n.id).some((from) => PUBLIC_ENTRY.has(from.type))),
    ),
  );

  // Several instances writing files to their own disks.
  add(
    'local-filesystem',
    graph.nodes.filter((n) => COMPUTE.has(n.type) && instances(n) > 1 && n.props.files === 'local-disk'),
  );

  // A queue nothing reads from.
  add(
    'queue-without-consumer',
    graph.nodes.filter((n) => n.type === 'queue' && !outgoing(n.id).some((to) => COMPUTE.has(to.type))),
  );

  // Every application-side component runs as a single instance.
  const compute = graph.nodes.filter((n) => COMPUTE.has(n.type) && n.type !== 'worker');
  if (compute.length > 0 && compute.every((n) => instances(n) === 1)) add('no-redundancy', compute);

  // Sessions in instance memory while requests can reach different instances.
  add(
    'local-sessions',
    graph.nodes.filter((n) => COMPUTE.has(n.type) && instances(n) > 1 && n.props.sessions === 'local'),
  );

  // A cache without a decision on how stale data is removed.
  add(
    'cache-invalidation-undefined',
    graph.nodes.filter((n) => n.type === 'cache' && n.props.invalidation === 'undefined'),
  );

  return findings;
}

/** Display name for a component, e.g. "Application Instances (×2)". */
export function displayName(node: GraphNode): string {
  const count = node.props.instances;
  const suffix = count && count !== '1' ? ` (×${count === '3' ? '3+' : count})` : '';
  return `${node.name.trim() || nodeType(node.type)?.label || node.type}${suffix}`;
}
