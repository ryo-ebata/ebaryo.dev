import { describe, expect, it } from 'vitest';
import { githubContributions, githubContributionsSchema } from './github-contributions';

describe('githubContributionsSchema', () => {
  it('同期済みの公開貢献データを検証できる', () => {
    expect(githubContributionsSchema.parse(githubContributions)).toEqual(githubContributions);
  });

  it('不正なURLを拒否する', () => {
    expect(() =>
      githubContributionsSchema.parse({
        from: null,
        items: [
          {
            commits: 1,
            highlights: [],
            isOwnRepository: false,
            issues: 0,
            pullRequests: 0,
            repository: 'owner/repository',
            repositoryUrl: 'invalid',
            reviews: 0,
            visible: true,
          },
        ],
        syncedAt: null,
        to: null,
        username: 'user',
      })
    ).toThrow();
  });
});
