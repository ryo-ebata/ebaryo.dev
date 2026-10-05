import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GithubContributionItem, GithubContributions } from '@/config/github-contributions';

const execFileAsync = promisify(execFile);

const QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    createdAt
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner url isPrivate }
        contributions(first: 1) { totalCount }
      }
      issueContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner url isPrivate }
        contributions(first: 5) {
          totalCount
          nodes { occurredAt issue { title url } }
        }
      }
      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner url isPrivate }
        contributions(first: 5) {
          totalCount
          nodes { occurredAt pullRequest { title url } }
        }
      }
      pullRequestReviewContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner url isPrivate }
        contributions(first: 1) { totalCount }
      }
    }
  }
}`;

interface Repository {
  isPrivate: boolean;
  nameWithOwner: string;
  url: string;
}

interface ContributionGroup<TNode = never> {
  contributions: { nodes?: TNode[]; totalCount: number };
  repository: Repository;
}

interface GithubResponse {
  data: {
    user: {
      createdAt: string;
      contributionsCollection: {
        commitContributionsByRepository: ContributionGroup[];
        issueContributionsByRepository: ContributionGroup<{
          issue: { title: string; url: string };
          occurredAt: string;
        }>[];
        pullRequestContributionsByRepository: ContributionGroup<{
          occurredAt: string;
          pullRequest: { title: string; url: string };
        }>[];
        pullRequestReviewContributionsByRepository: ContributionGroup[];
      };
    };
  };
}

const createItem = (repository: Repository, username: string): GithubContributionItem => ({
  commits: 0,
  highlights: [],
  isOwnRepository: repository.nameWithOwner.startsWith(`${username}/`),
  issues: 0,
  pullRequests: 0,
  repository: repository.nameWithOwner,
  repositoryUrl: repository.url,
  reviews: 0,
  visible: false,
});

const fetchContributionPeriod = async (username: string, from: Date, to: Date) => {
  const { stdout } = await execFileAsync('gh', [
    'api',
    'graphql',
    '-f',
    `query=${QUERY}`,
    '-F',
    `login=${username}`,
    '-F',
    `from=${from.toISOString()}`,
    '-F',
    `to=${to.toISOString()}`,
  ]);
  return (JSON.parse(stdout) as GithubResponse).data.user;
};

const addYear = (date: Date): Date => {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
};

export const collectGithubContributions = async (
  username: string,
  previous: GithubContributions
): Promise<GithubContributions> => {
  const to = new Date();
  const recentFrom = new Date(to);
  recentFrom.setUTCFullYear(recentFrom.getUTCFullYear() - 1);
  const recent = await fetchContributionPeriod(username, recentFrom, to);
  const from = new Date(recent.createdAt);
  const collections = [];
  let periodFrom = from;
  while (periodFrom < recentFrom) {
    const periodTo = new Date(Math.min(addYear(periodFrom).getTime(), recentFrom.getTime()));
    const period = await fetchContributionPeriod(username, periodFrom, periodTo);
    collections.push(period.contributionsCollection);
    periodFrom = periodTo;
  }
  collections.push(recent.contributionsCollection);
  const previousVisibility = new Map(
    previous.items.map((item) => [item.repository, item.visible] as const)
  );
  const items = new Map<string, GithubContributionItem>();

  const getItem = (repository: Repository) => {
    const current = items.get(repository.nameWithOwner) ?? createItem(repository, username);
    items.set(repository.nameWithOwner, current);
    return current;
  };

  for (const collection of collections) {
    for (const group of collection.commitContributionsByRepository) {
      if (!group.repository.isPrivate) {
        getItem(group.repository).commits += group.contributions.totalCount;
      }
    }
    for (const group of collection.issueContributionsByRepository) {
      if (group.repository.isPrivate) continue;
      const item = getItem(group.repository);
      item.issues += group.contributions.totalCount;
      item.highlights.push(
        ...(group.contributions.nodes ?? []).map((node) => ({
          occurredAt: node.occurredAt,
          title: node.issue.title,
          type: 'issue' as const,
          url: node.issue.url,
        }))
      );
    }
    for (const group of collection.pullRequestContributionsByRepository) {
      if (group.repository.isPrivate) continue;
      const item = getItem(group.repository);
      item.pullRequests += group.contributions.totalCount;
      item.highlights.push(
        ...(group.contributions.nodes ?? []).map((node) => ({
          occurredAt: node.occurredAt,
          title: node.pullRequest.title,
          type: 'pull-request' as const,
          url: node.pullRequest.url,
        }))
      );
    }
    for (const group of collection.pullRequestReviewContributionsByRepository) {
      if (!group.repository.isPrivate) {
        getItem(group.repository).reviews += group.contributions.totalCount;
      }
    }
  }

  return {
    from: from.toISOString(),
    items: [...items.values()]
      .map((item) => ({
        ...item,
        highlights: item.highlights
          .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
          .slice(0, 10),
        visible:
          !item.isOwnRepository && item.commits + item.issues + item.pullRequests > 0
            ? (previousVisibility.get(item.repository) ?? true)
            : false,
      }))
      .sort((left, right) => {
        const leftTotal = left.commits + left.issues + left.pullRequests + left.reviews;
        const rightTotal = right.commits + right.issues + right.pullRequests + right.reviews;
        return rightTotal - leftTotal;
      }),
    syncedAt: new Date().toISOString(),
    to: to.toISOString(),
    username,
  };
};
