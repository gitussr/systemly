/** Roadmap level names, verbatim from MASTER-PROMPT §9. */
export const LEVEL_NAMES: Record<number, string> = {
  0: 'Foundations',
  1: 'The Web Application',
  2: 'Scaling the Application',
  3: 'Making Systems Faster',
  4: 'Data Architecture',
  5: 'Asynchronous Systems',
  6: 'Distributed Systems',
  7: 'Service Architecture',
  8: 'Cloud Architecture',
  9: 'Reliability',
  10: 'Observability',
  11: 'Security',
  12: 'Real-World System Design',
};

export function levelLabel(level: number): string {
  const name = LEVEL_NAMES[level];
  return name ? `Level ${level} · ${name}` : `Level ${level}`;
}
