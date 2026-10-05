'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OBSIDIAN_HINT_MIME } from '@/lib/local-writer-hints';
import styles from './writer-link-library.module.css';

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
    <div className={styles.hintsPanel}>
      <label className={styles.hintSearch}>
        <Search />
        <input
          aria-label={searchLabel}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
      </label>
      <p className={styles.hintGuide}>{guide}</p>
      <div className={styles.hintList}>
        {isLoading && <p className={styles.emptyHints}>{loadingLabel}</p>}
        {!isLoading && filteredItems.length === 0 && (
          <p className={styles.emptyHints}>{emptyLabel}</p>
        )}
        {!isLoading &&
          filteredItems.map((item) => (
            <button
              className={styles.hintItem}
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
