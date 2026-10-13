import { describe, expect, it } from 'vitest';
import { inSection, site } from '../src/config/site';

const sectionOf = (path: string) => site.nav.filter((item) => inSection(path, item)).map((item) => item.label);

describe('site sections', () => {
  it('has two sections', () => {
    expect(site.nav.map((item) => item.label)).toEqual(['Roadmap', 'System Lab']);
  });

  it('puts the roadmap and every chapter page under Roadmap', () => {
    expect(sectionOf('/roadmap')).toEqual(['Roadmap']);
    expect(sectionOf('/roadmap/')).toEqual(['Roadmap']);
    expect(sectionOf('/learn/dns/')).toEqual(['Roadmap']);
  });

  it('puts the Lab, the Library index and the five tools under System Lab', () => {
    for (const path of ['/lab', '/learn', '/learn/', '/advisor', '/evolution/', '/playground', '/decisions', '/decisions/use-postgres', '/why-not/reduce-database-read-load']) {
      expect(sectionOf(path), path).toEqual(['System Lab']);
    }
  });

  it('leaves other pages in neither section', () => {
    expect(sectionOf('/')).toEqual([]);
    expect(sectionOf('/search')).toEqual([]);
    expect(sectionOf('/learner')).toEqual([]);
  });
});
