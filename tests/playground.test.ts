import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  addNode,
  connect,
  decodeGraph,
  disconnect,
  encodeGraph,
  removeNode,
  type Graph,
} from '../src/lib/playground/model';
import { CHECK_IDS, displayName, runChecks } from '../src/lib/playground/checks';
import { escapeLabel, toMermaid } from '../src/lib/playground/mermaid';

const preset = (id: string): Graph => PRESETS.find((p) => p.id === id)!.graph();
const checks = (g: Graph) => runChecks(g).map((f) => f.check).sort();
const setProp = (g: Graph, id: string, prop: string, value: string): Graph => ({
  ...g,
  nodes: g.nodes.map((n) => (n.id === id ? { ...n, props: { ...n.props, [prop]: value } } : n)),
});

describe('graph editing', () => {
  it('adds, connects, disconnects and removes components', () => {
    let g: Graph = { nodes: [], edges: [] };
    g = addNode(addNode(g, 'client'), 'application');
    expect(g.nodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    g = connect(g, 'n1', 'n2');
    expect(connect(g, 'n1', 'n2').edges).toHaveLength(1); // no duplicates
    expect(connect(g, 'n1', 'n1').edges).toHaveLength(1); // no self-links
    expect(disconnect(g, 'n1', 'n2').edges).toEqual([]);
    g = removeNode(g, 'n2');
    expect(g).toEqual({ nodes: [expect.objectContaining({ id: 'n1' })], edges: [] });
  });
});

describe('checks', () => {
  it('flags the single instance in V1 and the undefined cache strategy in V3', () => {
    expect(checks(preset('v1'))).toEqual(['no-redundancy']);
    expect(checks(preset('v2'))).toEqual([]);
    expect(checks(preset('v3'))).toEqual(['cache-invalidation-undefined']);
    expect(checks(preset('v4'))).toEqual([]);
  });

  it('flags a database reached from a public entry point or set to public', () => {
    const g = connect(preset('v1'), 'n1', 'n3'); // client → database
    expect(checks(g)).toContain('database-public');
    expect(checks(setProp(preset('v2'), 'n4', 'access', 'public'))).toContain('database-public');
  });

  it('flags local disks and in-memory sessions only with several instances', () => {
    expect(checks(setProp(preset('v1'), 'n2', 'files', 'local-disk'))).not.toContain('local-filesystem');
    expect(checks(setProp(preset('v2'), 'n3', 'files', 'local-disk'))).toContain('local-filesystem');
    expect(checks(setProp(preset('v2'), 'n3', 'sessions', 'local'))).toContain('local-sessions');
    expect(checks(setProp(preset('v2'), 'n3', 'sessions', 'shared'))).not.toContain('local-sessions');
  });

  it('flags a queue without a consumer', () => {
    const g = disconnect(preset('v4'), 'n4', 'n5');
    const finding = runChecks(g).find((f) => f.check === 'queue-without-consumer');
    expect(finding?.nodes).toEqual(['n4']);
  });

  it('has a known id for every finding', () => {
    for (const p of PRESETS) for (const f of runChecks(p.graph())) expect(CHECK_IDS).toContain(f.check);
  });
});

describe('mermaid', () => {
  it('escapes names so they cannot break the diagram', () => {
    expect(escapeLabel('Say "hi" <b>[x]</b> #1')).toBe('Say #quot;hi#quot; #lt;b#gt;#91;x#93;#lt;/b#gt; #35;1');
  });

  it('draws nodes with instance counts, edges, and highlights flagged components', () => {
    const src = toMermaid(preset('v1'), runChecks(preset('v1')));
    expect(src).toContain('n1(["Client"])');
    expect(src).toContain('n3[("Database")]');
    expect(src).toContain('n1 --> n2');
    expect(src).toContain('class n2 warning');
    expect(displayName(preset('v2').nodes[2]!)).toBe('Application Instances (×2)');
  });

  it('returns nothing for an empty design', () => {
    expect(toMermaid({ nodes: [], edges: [] })).toBe('');
  });
});

describe('shareable encoding', () => {
  it('round-trips a design', () => {
    const g = setProp(preset('v4'), 'n3', 'sessions', 'shared');
    expect(decodeGraph(encodeGraph(g))).toEqual(g);
  });

  it('rejects or cleans untrusted input', () => {
    expect(decodeGraph('not base64 !!')).toBeUndefined();
    const hostile = btoa(
      JSON.stringify({
        n: [
          ['n1', 'client', 'A', {}],
          ['n2', 'database', 'B', { access: 'wide-open', extra: 'x' }],
        ],
        e: [['n1', 'n2'], ['n1', 'n9'], ['n2', 'n2']],
      }),
    );
    expect(decodeGraph(hostile)).toEqual({
      nodes: [
        { id: 'n1', type: 'client', name: 'A', props: {} },
        { id: 'n2', type: 'database', name: 'B', props: { access: 'private' } },
      ],
      edges: [['n1', 'n2']],
    });
    expect(decodeGraph(btoa(JSON.stringify({ n: [['x', 'rocket', 'A', {}]], e: [] })))).toBeUndefined();
  });
});
