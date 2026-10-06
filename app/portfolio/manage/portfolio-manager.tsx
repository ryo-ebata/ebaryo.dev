'use client';

import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import {
  portfolioCategoryLabels,
  type PortfolioCategory,
  type PortfolioItem,
} from '@/config/portfolio';
import { cn } from '@/lib/utils';
import { parseApiResponse } from '@/lib/client-api';
import type { GithubContributions } from '@/config/github-contributions';
import { GithubContributionManager } from './github-contribution-manager';

interface PortfolioManagerProps {
  initialContributions: GithubContributions;
  initialItems: PortfolioItem[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const categories = Object.entries(portfolioCategoryLabels) as [PortfolioCategory, string][];

const createEmptyItem = (): PortfolioItem => ({
  category: 'product',
  description: '',
  featured: false,
  links: [{ href: '', label: 'Website' }],
  role: '',
  tags: [],
  title: '新しい実績',
  year: new Date().getFullYear(),
});

const Field = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <label className="grid gap-2 text-sm font-medium text-foreground">
    {label}
    {children}
  </label>
);

export const PortfolioManager = ({ initialContributions, initialItems }: PortfolioManagerProps) => {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const selectedItem = items[selectedIndex];

  const markChanged = () => {
    setSaveState('idle');
    setMessage('未保存の変更あり');
  };

  const updateSelected = (update: Partial<PortfolioItem>) => {
    setItems((current) =>
      current.map((item, index) => (index === selectedIndex ? { ...item, ...update } : item))
    );
    markChanged();
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyItem()]);
    setSelectedIndex(items.length);
    markChanged();
  };

  const duplicateItem = () => {
    if (!selectedItem) return;
    const duplicate = {
      ...selectedItem,
      links: selectedItem.links.map((link) => ({ ...link })),
      tags: [...selectedItem.tags],
      title: `${selectedItem.title} のコピー`,
    };
    setItems((current) => [...current, duplicate]);
    setSelectedIndex(items.length);
    markChanged();
  };

  const removeItem = () => {
    if (!selectedItem || !window.confirm(`「${selectedItem.title}」を削除する？`)) return;
    setItems((current) => current.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((current) => Math.max(0, Math.min(current, items.length - 2)));
    markChanged();
  };

  const moveItem = (offset: -1 | 1) => {
    const destination = selectedIndex + offset;
    if (destination < 0 || destination >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[selectedIndex], next[destination]] = [next[destination], next[selectedIndex]];
      return next;
    });
    setSelectedIndex(destination);
    markChanged();
  };

  const updateLink = (linkIndex: number, update: { href?: string; label?: string }) => {
    if (!selectedItem) return;
    updateSelected({
      links: selectedItem.links.map((link, index) =>
        index === linkIndex ? { ...link, ...update } : link
      ),
    });
  };

  const addLink = () => {
    if (!selectedItem || selectedItem.links.length >= 5) return;
    updateSelected({ links: [...selectedItem.links, { href: '', label: '' }] });
  };

  const removeLink = (linkIndex: number) => {
    if (!selectedItem || selectedItem.links.length === 1) return;
    updateSelected({ links: selectedItem.links.filter((_, index) => index !== linkIndex) });
  };

  const save = async () => {
    setSaveState('saving');
    setMessage('保存中…');

    try {
      const response = await fetch('/api/local-portfolio', {
        body: JSON.stringify(items),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });
      await parseApiResponse(response, '保存に失敗した');

      setSaveState('saved');
      setMessage('portfolio.jsonへ保存した');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '保存に失敗した');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
      <header className="sticky top-[4.25rem] z-30 border-b border-foreground/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">Portfolio Manager</h1>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Local only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">公開実績を追加・編集・並び替え</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'hidden text-xs sm:inline',
                saveState === 'error' ? 'text-destructive' : 'text-muted-foreground'
              )}
              role="status"
            >
              {message}
            </span>
            <Button variant="outline" render={<Link href="/portfolio" target="_blank" />}>
              <ExternalLink />
              公開画面
            </Button>
            <Button onClick={save} disabled={saveState === 'saving'}>
              <Save />
              {saveState === 'saving' ? '保存中' : '保存'}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl bg-card p-3 ring-1 ring-foreground/10 lg:sticky lg:top-36">
          <div className="mb-3 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              実績 {items.length}件
            </span>
            <Button size="icon-sm" variant="ghost" onClick={addItem} aria-label="実績を追加">
              <Plus />
            </Button>
          </div>
          <div className="grid max-h-[65vh] gap-1 overflow-y-auto">
            {items.map((item, index) => (
              <button
                key={`${item.title}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'rounded-xl px-3 py-3 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="mt-1 block text-xs">
                  {portfolioCategoryLabels[item.category]} · {item.year}
                </span>
              </button>
            ))}
          </div>
          <Button className="mt-3 w-full" variant="outline" onClick={addItem}>
            <Plus />
            実績を追加
          </Button>
        </aside>

        <main className="min-w-0 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
          {selectedItem ? (
            <div className="space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {portfolioCategoryLabels[selectedItem.category]}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {selectedItem.title}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => moveItem(-1)}
                    disabled={selectedIndex === 0}
                    aria-label="上へ移動"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => moveItem(1)}
                    disabled={selectedIndex === items.length - 1}
                    aria-label="下へ移動"
                  >
                    <ArrowDown />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={duplicateItem} aria-label="複製">
                    <Copy />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onClick={removeItem}
                    aria-label="削除"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="タイトル">
                  <Input
                    value={selectedItem.title}
                    onChange={(event) => updateSelected({ title: event.target.value })}
                    maxLength={100}
                  />
                </Field>
                <Field label="種別">
                  <select
                    value={selectedItem.category}
                    onChange={(event) =>
                      updateSelected({ category: event.target.value as PortfolioCategory })
                    }
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {categories.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="役割">
                  <Input
                    value={selectedItem.role}
                    onChange={(event) => updateSelected({ role: event.target.value })}
                    placeholder="Creator / Speaker / Contributor"
                    maxLength={80}
                  />
                </Field>
                <Field label="年">
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    value={selectedItem.year}
                    onChange={(event) => updateSelected({ year: Number(event.target.value) })}
                  />
                </Field>
              </div>

              <Field label="説明">
                <textarea
                  value={selectedItem.description}
                  onChange={(event) => updateSelected({ description: event.target.value })}
                  rows={5}
                  maxLength={500}
                  className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-7 outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="タグ（カンマ区切り）">
                  <Input
                    value={selectedItem.tags.join(', ')}
                    onChange={(event) =>
                      updateSelected({
                        tags: event.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Rust, CLI, Security"
                  />
                </Field>
                <label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedItem.featured ?? false}
                    onChange={(event) => updateSelected({ featured: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  注目実績として強調
                </label>
              </div>

              <section className="space-y-4" aria-labelledby="portfolio-links-heading">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 id="portfolio-links-heading" className="font-semibold text-foreground">
                      関連リンク
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      GitHub、公開URL、音源、登壇資料など
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addLink}
                    disabled={selectedItem.links.length >= 5}
                  >
                    <Plus />
                    リンク追加
                  </Button>
                </div>
                <div className="grid gap-3">
                  {selectedItem.links.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="grid gap-2 rounded-xl bg-muted/50 p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
                    >
                      <Input
                        value={link.label}
                        onChange={(event) => updateLink(linkIndex, { label: event.target.value })}
                        placeholder="GitHub"
                        aria-label={`リンク${linkIndex + 1}の表示名`}
                      />
                      <Input
                        type="url"
                        value={link.href}
                        onChange={(event) => updateLink(linkIndex, { href: event.target.value })}
                        placeholder="https://"
                        aria-label={`リンク${linkIndex + 1}のURL`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLink(linkIndex)}
                        disabled={selectedItem.links.length === 1}
                        aria-label={`リンク${linkIndex + 1}を削除`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center text-center">
              <div className="space-y-3">
                <p className="text-muted-foreground">実績がまだない</p>
                <Button onClick={addItem}>
                  <Plus />
                  最初の実績を追加
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
      <GithubContributionManager initialContributions={initialContributions} />
    </div>
  );
};
