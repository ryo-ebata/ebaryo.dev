'use client';

import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WRITER_INSERT_MIME } from '@/lib/local-writer-hints';

export interface WriterLinkItem {
  badge?: string;
  description?: string;
  id: string;
  insertText: string;
  searchText: string;
  targetLabel: string;
  title: string;
}

interface WriterLinkLibraryProps {
  emptyLabel: string;
  guide: string;
  isLoading?: boolean;
  items: WriterLinkItem[];
  loadingLabel?: string;
  onDragStateChange: (isDragging: boolean) => void;
  onInsert: (insertText: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
}

export function WriterLinkLibrary({
  emptyLabel,
  guide,
  isLoading = false,
  items,
  loadingLabel = '読み込んでいます…',
  onDragStateChange,
  onInsert,
  searchLabel,
  searchPlaceholder,
}: WriterLinkLibraryProps) {
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja');
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      item.searchText.toLocaleLowerCase('ja').includes(normalizedQuery)
    );
  }, [items, query]);

  return (
    <div className="grid gap-3">
      <label className="relative! mt-0!">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--writer-text)]" />
        <input
          aria-label={searchLabel}
          className="pl-9!"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
      </label>
      <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">{guide}</p>
      <div className="grid" aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <div className="grid" role="status">
            <span className="sr-only">{loadingLabel}</span>
            {[0, 1, 2].map((index) => (
              <span
                aria-hidden
                className="grid gap-2 border-t border-[var(--writer-line-subtle)] py-4"
                key={index}
              >
                <span className="h-3.5 w-3/5 animate-pulse rounded-sm bg-[var(--writer-surface-muted)] motion-reduce:animate-none" />
                <span className="h-2.5 w-4/5 animate-pulse rounded-sm bg-[var(--writer-surface-soft)] motion-reduce:animate-none" />
                <span className="h-2 w-2/5 animate-pulse rounded-sm bg-[var(--writer-surface-soft)] motion-reduce:animate-none" />
              </span>
            ))}
          </div>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">{emptyLabel}</p>
        )}
        {!isLoading &&
          filteredItems.map((item) => (
            <button
              className="group relative grid cursor-grab gap-1.5 border-0 border-t border-[var(--writer-line-subtle)] bg-transparent px-2 py-3.5 text-left text-[var(--writer-ink)] transition-colors duration-150 hover:bg-[var(--writer-surface-soft)] hover:text-[var(--writer-accent)] active:cursor-grabbing motion-reduce:transition-none [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:pr-7 [&_small]:text-[0.68rem] [&_small]:text-[var(--writer-text-subtle)] [&_span]:line-clamp-2 [&_span]:overflow-hidden [&_span]:pr-7 [&_span]:text-xs [&_span]:leading-relaxed [&_span]:text-[var(--writer-text)] [&_strong]:pr-7 [&_strong]:text-sm"
              draggable
              key={item.id}
              onClick={() => onInsert(item.insertText)}
              onDragStart={(event) => {
                onDragStateChange(true);
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData(WRITER_INSERT_MIME, item.insertText);
                event.dataTransfer.setData('text/plain', item.insertText);
              }}
              onDragEnd={() => onDragStateChange(false)}
              type="button"
            >
              <div className="flex items-baseline gap-2 pr-7">
                <strong className="pr-0!">{item.title}</strong>
                {item.badge && (
                  <small className="shrink-0 pr-0! text-[0.65rem]! font-bold text-[var(--writer-accent)]!">
                    {item.badge}
                  </small>
                )}
              </div>
              {item.description && <span>{item.description}</span>}
              <small>{item.targetLabel}</small>
              <Plus className="absolute top-1/2 right-2 size-4 -translate-y-1/2 text-[var(--writer-text-subtle)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
            </button>
          ))}
      </div>
    </div>
  );
}
