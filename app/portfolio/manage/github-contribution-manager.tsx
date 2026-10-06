'use client';

import { Github, RefreshCw, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import type { GithubContributions } from '@/config/github-contributions';
import { parseApiResponse } from '@/lib/client-api';

export const GithubContributionManager = ({
  initialContributions,
}: {
  initialContributions: GithubContributions;
}) => {
  const [contributions, setContributions] = useState(initialContributions);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const request = async (method: 'POST' | 'PUT', body?: GithubContributions) => {
    setIsBusy(true);
    setStatus(method === 'POST' ? 'GitHubから取得中…' : '掲載設定を保存中…');
    try {
      const response = await fetch('/api/local-portfolio/github', {
        body: body ? JSON.stringify(body) : undefined,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        method,
      });
      const result = await parseApiResponse<GithubContributions>(response, '処理に失敗した');
      setContributions(result);
      setStatus(method === 'POST' ? '直近1年の公開活動を同期した' : '掲載設定を保存した');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '処理に失敗した');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleVisibility = (repository: string) => {
    setContributions((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.repository === repository ? { ...item, visible: !item.visible } : item
      ),
    }));
    setStatus('未保存の掲載設定あり');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6" aria-labelledby="github-sync-heading">
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Github className="size-5" aria-hidden="true" />
              <h2 id="github-sync-heading" className="font-semibold text-foreground">
                GitHub Contributions
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              GitHubアカウント作成時からの公開コミット・Issue・PR・レビューを自動収集する。
            </p>
            {contributions.syncedAt && (
              <p className="text-xs text-muted-foreground">
                最終同期: {new Date(contributions.syncedAt).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground" role="status">
              {status}
            </span>
            <Button
              variant="outline"
              onClick={() => request('PUT', contributions)}
              disabled={isBusy}
            >
              <Save />
              掲載設定を保存
            </Button>
            <Button onClick={() => request('POST')} disabled={isBusy}>
              <RefreshCw className={isBusy ? 'animate-spin' : undefined} />
              GitHubから同期
            </Button>
          </div>
        </div>

        {contributions.items.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {contributions.items.map((item) => (
              <label
                key={item.repository}
                className="grid cursor-pointer gap-3 rounded-xl border border-foreground/10 p-4 transition-colors hover:bg-muted/50 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
              >
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => toggleVisibility(item.repository)}
                  className="size-4 accent-primary"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-foreground">{item.repository}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.isOwnRepository ? '自分のリポジトリ' : 'OSS Contribution'}
                    </span>
                  </div>
                  {item.highlights[0] && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      最新: {item.highlights[0].title}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  <span>{item.commits} commits</span>
                  <span>{item.issues} issues</span>
                  <span>{item.pullRequests} PRs</span>
                  <span>{item.reviews} reviews</span>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground">
            「GitHubから同期」で公開活動を取得できる。`gh auth status`で認証済みである必要がある。
          </div>
        )}
      </div>
    </section>
  );
};
