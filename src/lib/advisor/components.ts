/**
 * Building blocks the Advisor can place in a starting architecture, and where each sits
 * in the request path. Every architecture starts from client → application → database;
 * rules add the rest.
 */

export interface Component {
  id: string;
  label: string;
  /** Position in the request path, top (client) to bottom (storage). */
  tier: 'edge' | 'entry' | 'compute' | 'async' | 'data';
  /** Chapter to read about this component. */
  chapter?: string;
}

export const COMPONENTS = [
  { id: 'client', label: 'Clients', tier: 'edge' },
  { id: 'cdn', label: 'CDN', tier: 'edge', chapter: 'cdn' },
  { id: 'load-balancer', label: 'Load balancer', tier: 'entry', chapter: 'load-balancer' },
  { id: 'app', label: 'Application', tier: 'compute', chapter: 'anatomy-of-a-web-application' },
  { id: 'multiple-app-instances', label: 'Several application instances', tier: 'compute', chapter: 'horizontal-scaling' },
  { id: 'queue', label: 'Queue', tier: 'async', chapter: 'message-queue' },
  { id: 'workers', label: 'Background workers', tier: 'async', chapter: 'worker' },
  { id: 'cache', label: 'Cache', tier: 'data', chapter: 'caching' },
  { id: 'database', label: 'Relational database', tier: 'data', chapter: 'relational-databases' },
  { id: 'read-replicas', label: 'Read replicas', tier: 'data', chapter: 'read-replicas' },
  { id: 'object-storage', label: 'Object storage', tier: 'data', chapter: 'object-storage' },
  { id: 'search-index', label: 'Search index', tier: 'data', chapter: 'search-system' },
] as const satisfies readonly Component[];

export type ComponentId = (typeof COMPONENTS)[number]['id'];
export const COMPONENT_IDS = COMPONENTS.map((c) => c.id) as [ComponentId, ...ComponentId[]];

/** Present in every recommendation. */
export const BASE_COMPONENTS: ComponentId[] = ['client', 'app', 'database'];

/** Components that make no sense alone bring their partner (a queue needs a consumer). */
export const IMPLIES: Partial<Record<ComponentId, ComponentId[]>> = {
  queue: ['workers'],
  workers: ['queue'],
  'multiple-app-instances': ['load-balancer'],
};

export const TIERS = [
  { id: 'edge', label: 'Edge' },
  { id: 'entry', label: 'Entry' },
  { id: 'compute', label: 'Application' },
  { id: 'async', label: 'Background work' },
  { id: 'data', label: 'Data' },
] as const;

const BY_ID = new Map<string, Component>(COMPONENTS.map((c) => [c.id, c]));

export function componentById(id: string): Component | undefined {
  return BY_ID.get(id);
}
