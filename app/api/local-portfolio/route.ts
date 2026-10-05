import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { portfolioItemsSchema } from '@/config/portfolio';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';

const PORTFOLIO_PATH = path.join(process.cwd(), 'data', 'portfolio.json');

export const GET = async (request: Request) => {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;

  const source = await readFile(PORTFOLIO_PATH, 'utf8');
  return Response.json(portfolioItemsSchema.parse(JSON.parse(source)));
};

export const PUT = async (request: Request) => {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const result = portfolioItemsSchema.safeParse(await request.json());
  if (!result.success) {
    return localApiError('入力内容を確認してください', 400, { issues: result.error.issues });
  }

  await writeFile(PORTFOLIO_PATH, `${JSON.stringify(result.data, null, 2)}\n`, 'utf8');
  return Response.json({ items: result.data, saved: true });
};
