'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OBSIDIAN_HINT_MIME } from '@/lib/local-writer-hints';

export interface WriterLinkItem {
  description?: string;
  id: string;
  searchText: string;
  targetLabel: string;
  title: string;
  wikiLink: string;
}

interface WriterLinkLibraryProps {
  emptyLabel: string;
  guide: string;
  isLoading?: boolean;
  items: WriterLinkItem[];
  loadingLabel?: string;
  onDragStateChange: (isDragging: boolean) => void;
  onInsert: (wikiLink: string) => void;
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
      <div className="grid">
        {isLoading && (
          <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">{loadingLabel}</p>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">{emptyLabel}</p>
        )}
        {!isLoading &&
          filteredItems.map((item) => (
            <button
              className="grid cursor-grab gap-1.5 border-0 border-t border-[var(--writer-line-subtle)] bg-transparent py-3.5 text-left text-[var(--writer-ink)] hover:text-[var(--writer-accent)] active:cursor-grabbing [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[0.64rem] [&_small]:text-[var(--writer-text-subtle)] [&_span]:line-clamp-2 [&_span]:overflow-hidden [&_span]:text-[0.73rem] [&_span]:leading-relaxed [&_span]:text-[var(--writer-text)] [&_strong]:text-sm"
              draggable
              key={item.id}
              onClick={() => onInsert(item.wikiLink)}
              onDragStart={(event) => {
                onDragStateChange(true);
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData(OBSIDIAN_HINT_MIME, item.wikiLink);
                event.dataTransfer.setData('text/plain', item.wikiLink);
              }}
              onDragEnd={() => onDragStateChange(false)}
              type="button"
            >
              <strong>{item.title}</strong>
              {item.description && <span>{item.description}</span>}
              <small>{item.targetLabel}</small>
            </button>
          ))}
      </div>
    </div>
  );
}
