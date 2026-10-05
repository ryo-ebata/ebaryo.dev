import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { githubContributionsSchema } from '@/config/github-contributions';
import { collectGithubContributions } from '@/lib/github-contributions';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';

const CONTRIBUTIONS_PATH = path.join(process.cwd(), 'data', 'github-contributions.json');

const readContributions = async () =>
  githubContributionsSchema.parse(JSON.parse(await readFile(CONTRIBUTIONS_PATH, 'utf8')));

const saveContributions = async (data: unknown) => {
  const contributions = githubContributionsSchema.parse(data);
  await writeFile(CONTRIBUTIONS_PATH, `${JSON.stringify(contributions, null, 2)}\n`, 'utf8');
  return contributions;
};

export const GET = async (request: Request) => {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;
  return Response.json(await readContributions());
};

export const POST = async (request: Request) => {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  try {
    const previous = await readContributions();
    const contributions = await collectGithubContributions(previous.username, previous);
    return Response.json(await saveContributions(contributions));
  } catch (error) {
    return localApiError(error instanceof Error ? error.message : 'GitHubとの同期に失敗した', 500);
  }
};

export const PUT = async (request: Request) => {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const result = githubContributionsSchema.safeParse(await request.json());
  if (!result.success) {
    return localApiError('入力内容を確認してください', 400);
  }

  return Response.json(await saveContributions(result.data));
};
