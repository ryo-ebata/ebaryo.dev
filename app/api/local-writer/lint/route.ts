import path from 'node:path';
import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { guardLocalWriterRequest } from '@/lib/local-writer-security';

interface TextlintResult {
  messages: Array<{
    column: number;
    fix?: { range: [number, number]; text: string };
    line: number;
    message: string;
    range: [number, number];
    ruleId: string;
    severity: number;
    suggestions?: Array<{
      fix: { range: [number, number]; text: string };
      id: string;
      message: string;
    }>;
  }>;
}

const lintText = (body: string): Promise<TextlintResult> =>
  new Promise((resolve, reject) => {
    const textlint = spawn(
      process.execPath,
      [
        path.join(process.cwd(), 'node_modules', 'textlint', 'bin', 'textlint.js'),
        '--config',
        path.join(process.cwd(), '.textlintrc.json'),
        '--stdin',
        '--stdin-filename',
        'draft.md',
        '--format',
        'json',
      ],
      { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] }
    );
    let output = '';
    let errorOutput = '';
    textlint.stdout.on('data', (chunk) => (output += String(chunk)));
    textlint.stderr.on('data', (chunk) => (errorOutput += String(chunk)));
    textlint.on('error', reject);
    textlint.on('close', () => {
      try {
        resolve((JSON.parse(output) as TextlintResult[])[0] ?? { messages: [] });
      } catch {
        reject(new Error(errorOutput || 'textlintの結果を読み取れませんでした'));
      }
    });
    textlint.stdin.end(body);
  });

export async function POST(request: Request) {
  const denied = guardLocalWriterRequest(request, { mutation: true });
  if (denied) return denied;

  const { body } = (await request.json()) as { body?: unknown };
  if (typeof body !== 'string')
    return NextResponse.json({ error: '本文が必要です' }, { status: 400 });

  const result = await lintText(body);
  return NextResponse.json({ messages: result.messages });
}
