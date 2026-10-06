'use client';

import { Columns2, Eye, PanelRight, Pencil } from 'lucide-react';
import type { RefObject } from 'react';
import type { ArticleSummary, DraftState, SidePanel, ViewMode } from './writer-model';
import { WriterArticlePicker } from './writer-article-picker';

interface WriterHeaderProps {
  article: DraftState;
  articles: ArticleSummary[];
  currentSlug?: string;
  draftSavedAt?: string;
  imageInputRef: RefObject<HTMLInputElement | null>;
  isSaving: boolean;
  message: string;
  onNewArticle: () => boolean;
  onOpenArticle: (slug: string) => Promise<boolean>;
  onSetSidePanel: (panel: SidePanel | ((current: SidePanel) => SidePanel)) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  onUploadImage: (file: File) => void;
  sidePanel: SidePanel;
  viewMode: ViewMode;
}

const getSaveLabel = (article: DraftState, currentSlug: string | undefined, isSaving: boolean) => {
  if (isSaving) return '保存中…';
  if (currentSlug) return article.draft ? '下書きを更新' : '記事を更新';
  return article.draft ? '下書きを保存' : '公開する';
};

export const WriterHeader = ({
  article,
  articles,
  currentSlug,
  draftSavedAt,
  imageInputRef,
  isSaving,
  message,
  onNewArticle,
  onOpenArticle,
  onSetSidePanel,
  onSetViewMode,
  onToggleSidebar,
  onUploadImage,
  sidePanel,
  viewMode,
}: WriterHeaderProps) => (
  <header className="relative z-20 grid h-16 grid-cols-[minmax(10rem,1fr)_auto_minmax(10rem,1fr)] items-center gap-3 border-b border-black/6 bg-[rgb(253_253_252/94%)] px-5 backdrop-blur-xl max-[900px]:grid-cols-[auto_minmax(8rem,1fr)_auto] max-[900px]:backdrop-blur-none max-[640px]:h-14 max-[640px]:grid-cols-[auto_1fr] max-[640px]:gap-1 max-[640px]:px-2">
    <WriterArticlePicker
      articles={articles}
      currentSlug={currentSlug}
      currentTitle={article.title}
      onNewArticle={onNewArticle}
      onOpenArticle={onOpenArticle}
    />
    <div
      className="flex min-w-0 items-center justify-center gap-[0.45rem] whitespace-nowrap text-[0.72rem] text-[var(--writer-text)] max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:z-10 max-[900px]:h-8 max-[900px]:border-t max-[900px]:border-[var(--writer-line-subtle)] max-[900px]:bg-[var(--writer-paper)]"
      aria-live="polite"
    >
      <span>{isSaving ? '保存しています…' : message}</span>
      {draftSavedAt && (
        <span className="border-l border-[var(--writer-line-subtle)] pl-2 text-[var(--writer-text-subtle)] max-[640px]:hidden">
          {draftSavedAt}
        </span>
      )}
    </div>
    <div className="flex items-center justify-end gap-[0.15rem] max-[640px]:min-w-0 max-[640px]:gap-0">
      <input
        ref={imageInputRef}
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadImage(file);
          event.target.value = '';
        }}
        type="file"
      />
      <div
        className="mr-[0.35rem] flex items-center gap-[0.1rem] rounded-[0.65rem] border border-[var(--writer-line-subtle)] bg-[var(--writer-surface-soft)] p-[0.15rem] max-[640px]:mr-[0.1rem] [&_button]:grid [&_button]:h-[1.9rem] [&_button]:w-8 [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-[0.45rem] [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-[var(--writer-text)] [&_button:hover]:bg-[var(--writer-surface-muted)] [&_button:hover]:text-[var(--writer-ink)] [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-[var(--writer-ink)] [&_button[aria-pressed=true]]:shadow-sm [&_svg]:size-[1.05rem] max-[640px]:[&_button:nth-child(2)]:hidden"
        aria-label="表示モード"
      >
        <button
          aria-label="編集のみ"
          aria-pressed={viewMode === 'edit'}
          onClick={() => onSetViewMode('edit')}
          title="編集"
          type="button"
        >
          <Pencil />
        </button>
        <button
          aria-label="編集とプレビュー"
          aria-pressed={viewMode === 'split'}
          onClick={() => onSetViewMode('split')}
          title="分割"
          type="button"
        >
          <Columns2 />
        </button>
        <button
          aria-label="プレビューのみ"
          aria-pressed={viewMode === 'preview'}
          onClick={() => onSetViewMode('preview')}
          title="プレビュー"
          type="button"
        >
          <Eye />
        </button>
      </div>
      <button
        aria-expanded={Boolean(sidePanel)}
        aria-label={sidePanel ? 'サイドバーを隠す' : 'サイドバーを表示'}
        className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2.5 text-xs text-[var(--writer-text)] hover:bg-[var(--writer-surface-muted)] hover:text-[var(--writer-ink)] aria-expanded:bg-[var(--writer-surface-muted)] aria-expanded:text-[var(--writer-ink)] [&_svg]:size-4 max-[640px]:w-10 max-[640px]:justify-center max-[640px]:px-0 max-[640px]:[&_span]:hidden"
        onClick={onToggleSidebar}
        type="button"
      >
        <PanelRight />
        <span>執筆支援</span>
      </button>
      <button
        aria-expanded={sidePanel === 'settings'}
        className="flex min-h-10 cursor-pointer items-center border-0 bg-transparent px-3 text-[0.78rem] text-[var(--writer-text)] hover:text-[var(--writer-ink)] max-[640px]:hidden"
        onClick={() => onSetSidePanel((current) => (current === 'settings' ? null : 'settings'))}
        type="button"
      >
        公開
      </button>
      <button
        className="ml-1 flex h-10 cursor-pointer items-center rounded-[0.35rem] border-0 bg-[var(--writer-ink)] px-3 font-bold text-white disabled:cursor-wait disabled:opacity-55 max-[640px]:w-auto max-[640px]:justify-center max-[640px]:px-2.5 max-[640px]:text-xs"
        disabled={isSaving}
        type="submit"
      >
        <span>{getSaveLabel(article, currentSlug, isSaving)}</span>
      </button>
    </div>
  </header>
);
