'use client';

import { Check, ChevronDown, FilePlus2, Search } from 'lucide-react';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ARTICLE_PICKER_HEADINGS,
  ARTICLE_PICKER_MODES,
  MAINTENANCE_ACTIONS,
  MAINTENANCE_LABELS,
  STAGE_LABELS,
} from './writer-config';
import {
  type ArticlePickerMode,
  type ArticleSummary,
  matchesArticlePickerMode,
} from './writer-model';
import styles from './writer-article-picker.module.css';

interface WriterArticlePickerProps {
  articles: ArticleSummary[];
  currentSlug?: string;
  currentTitle: string;
  onNewArticle: () => boolean;
  onOpenArticle: (slug: string) => Promise<boolean>;
}

export const WriterArticlePicker = ({
  articles,
  currentSlug,
  currentTitle,
  onNewArticle,
  onOpenArticle,
}: WriterArticlePickerProps) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ArticlePickerMode>('all');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja');
    const scopedArticles = articles.filter((item) => matchesArticlePickerMode(item, mode));
    if (['draft', 'idea', 'writing', 'review'].includes(mode))
      scopedArticles.sort((first, second) => second.progress - first.progress);
    if (mode === 'maintenance')
      scopedArticles.sort((first, second) => second.issues.length - first.issues.length);
    if (!normalizedQuery) return scopedArticles;
    return scopedArticles.filter((item) =>
      `${item.title} ${item.slug} ${item.description}`
        .toLocaleLowerCase('ja')
        .includes(normalizedQuery)
    );
  }, [articles, mode, query]);

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const openArticle = async (slug: string) => {
    if (!(await onOpenArticle(slug))) return;
    setQuery('');
    close(false);
  };

  const newArticle = () => {
    if (!onNewArticle()) return;
    setQuery('');
    close(false);
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])'
      ),
    ];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => searchRef.current?.focus());
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <div className={styles.documentActions}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={styles.articlePickerTrigger}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        ref={triggerRef}
        type="button"
      >
        <span>{currentSlug ? currentTitle || currentSlug : '記事を開く'}</span>
        <ChevronDown />
      </button>
      <button
        aria-label="新規記事"
        className={styles.newArticleButton}
        onClick={newArticle}
        type="button"
      >
        <FilePlus2 />
      </button>
      {isOpen && (
        <>
          <button
            aria-label="記事一覧を閉じる"
            className={styles.articlePickerBackdrop}
            onClick={() => close()}
            type="button"
          />
          <div
            aria-label="記事を開く"
            className={styles.articlePicker}
            onKeyDown={trapFocus}
            role="dialog"
          >
            <label className={styles.articleSearch}>
              <Search />
              <input
                aria-label="記事を検索"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown') return;
                  event.preventDefault();
                  event.currentTarget
                    .closest(`.${styles.articlePicker}`)
                    ?.querySelector<HTMLButtonElement>('[data-article-item]')
                    ?.focus();
                }}
                placeholder="タイトル、スラッグ、説明で検索"
                ref={searchRef}
                type="search"
                value={query}
              />
            </label>
            <div className={styles.articlePickerModes} aria-label="記事の分類">
              {ARTICLE_PICKER_MODES.map(([itemMode, label]) => (
                <button
                  aria-pressed={mode === itemMode}
                  key={itemMode}
                  onClick={() => setMode(itemMode)}
                  type="button"
                >
                  {label}
                  <span>
                    {articles.filter((item) => matchesArticlePickerMode(item, itemMode)).length}
                  </span>
                </button>
              ))}
            </div>
            <button className={styles.newArticleItem} onClick={newArticle} type="button">
              <FilePlus2 />
              <strong>新しい記事を書く</strong>
            </button>
            <div className={styles.articleList}>
              <p className={styles.articleListHeading}>
                <span>{query ? '検索結果' : ARTICLE_PICKER_HEADINGS[mode]}</span>
                <span>{filteredArticles.length}件</span>
              </p>
              {mode === 'maintenance' && !query && (
                <p className={styles.maintenanceGuide}>
                  公開後の記事を自動点検している。各項目は判定理由と、次に行う修正を示す。
                </p>
              )}
              {filteredArticles.length === 0 && (
                <p className={styles.emptyArticles}>条件に合う記事はない。</p>
              )}
              {filteredArticles.map((item) => (
                <button
                  className={styles.articleItem}
                  data-article-item
                  key={item.slug}
                  onClick={() => void openArticle(item.slug)}
                  type="button"
                >
                  <span className={styles.articleItemBody}>
                    <strong>{item.title || '無題の記事'}</strong>
                    {mode === 'maintenance' ? (
                      <span className={styles.maintenanceIssues}>
                        {item.issues.map((issue) => (
                          <span className={styles.maintenanceIssue} key={issue}>
                            <span className={styles.maintenanceIssueLabel}>
                              {MAINTENANCE_LABELS[issue]}
                            </span>
                            <span>
                              {item.issueDetails[issue]}. {MAINTENANCE_ACTIONS[issue]}。
                            </span>
                          </span>
                        ))}
                      </span>
                    ) : (
                      <small>{item.description || item.slug}</small>
                    )}
                    {item.draft && mode !== 'maintenance' && (
                      <span className={styles.articleProgress}>
                        <i style={{ width: `${item.progress}%` }} />
                      </span>
                    )}
                  </span>
                  <span className={styles.articleItemMeta}>
                    {item.draft && <span>{STAGE_LABELS[item.stage]}</span>}
                    {mode === 'maintenance' && item.issues.length > 0 && (
                      <span>{item.issues.length}件</span>
                    )}
                    <time dateTime={item.updatedAt}>
                      {new Intl.DateTimeFormat('ja-JP', {
                        day: 'numeric',
                        month: 'short',
                      }).format(new Date(item.updatedAt))}
                    </time>
                    {currentSlug === item.slug && <Check aria-label="現在の記事" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
