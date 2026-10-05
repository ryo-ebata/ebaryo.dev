import { z } from 'zod';
import contributionData from '@/data/github-contributions.json';

export const contributionHighlightSchema = z.object({
  occurredAt: z.string(),
  title: z.string(),
  type: z.enum(['issue', 'pull-request']),
  url: z.url(),
});

export const githubContributionItemSchema = z.object({
  commits: z.number().int().nonnegative(),
  issues: z.number().int().nonnegative(),
  highlights: z.array(contributionHighlightSchema).max(10),
  isOwnRepository: z.boolean(),
  pullRequests: z.number().int().nonnegative(),
  repository: z.string(),
  repositoryUrl: z.url(),
  reviews: z.number().int().nonnegative(),
  visible: z.boolean(),
});

export const githubContributionsSchema = z.object({
  from: z.string().nullable(),
  items: z.array(githubContributionItemSchema),
  syncedAt: z.string().nullable(),
  to: z.string().nullable(),
  username: z.string(),
});

export type GithubContributionItem = z.infer<typeof githubContributionItemSchema>;
export type GithubContributions = z.infer<typeof githubContributionsSchema>;

export const githubContributions = githubContributionsSchema.parse(contributionData);
