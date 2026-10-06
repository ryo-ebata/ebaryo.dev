'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SidePanel } from './writer-model';
import { cn } from '@/lib/utils';

interface WriterInspectorProps {
  children: ReactNode;
  isDraggingLink: boolean;
  lintCount: number;
  onChange: (panel: Exclude<SidePanel, null>) => void;
  onClose: () => void;
  panel: SidePanel;
}

const PANEL_LABELS: Record<Exclude<SidePanel, null>, string> = {
  analysis: '記事構成',
  articles: '公開済み記事',
  hints: 'Obsidianのヒント',
  review: '校正結果',
  settings: '公開設定',
};

export const WriterInspector = ({
  children,
  isDraggingLink,
  lintCount,
  onChange,
  onClose,
  panel,
}: WriterInspectorProps) => (
  <>
    {panel && !isDraggingLink && (
      <button
        aria-label="記事設定を閉じる"
        className="fixed inset-x-0 top-[10.75rem] bottom-0 z-29 hidden cursor-default border-0 bg-[rgb(32_33_36/18%)] max-[900px]:block max-[640px]:top-[10.25rem]"
        onClick={onClose}
        type="button"
      />
    )}
    <aside
      className={cn(
        'fixed top-[10.75rem] right-0 bottom-0 z-30 w-[min(23rem,94vw)] translate-x-[102%] overflow-auto border-l border-[var(--writer-line-subtle)] bg-[var(--writer-paper)] p-5 shadow-[-1rem_0_3rem_rgb(32_34_31/7%)] transition-transform duration-180 motion-reduce:transition-none max-[640px]:top-[10.25rem] [&>div:not(:first-child)]:mt-7 [&>div:not(:first-child)]:border-t [&>div:not(:first-child)]:border-[var(--writer-line-subtle)] [&>div:not(:first-child)]:pt-6 [&_h2]:mb-3.5 [&_h2]:text-xs [&_h2]:font-extrabold [&_h2]:tracking-[0.04em] [&_label]:mt-3.5 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-bold [&_label]:text-[var(--writer-text)] [&_label_small]:text-[0.65rem] [&_label_small]:leading-6 [&_label_small]:font-normal [&_label_small]:text-[var(--writer-text-subtle)] [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--writer-line)] [&_input]:bg-white [&_input]:px-3 [&_input]:py-3 [&_input]:text-sm [&_input]:font-normal [&_input]:text-[var(--writer-ink)] [&_input:disabled]:bg-[var(--writer-surface-muted)] [&_input:disabled]:text-[var(--writer-text)] [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[var(--writer-line)] [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:font-normal [&_textarea]:text-[var(--writer-ink)] [&_small]:text-xs [&_code]:text-xs',
        panel && 'translate-x-0'
      )}
      aria-label={panel ? PANEL_LABELS[panel] : '執筆サイドバー'}
      aria-hidden={!panel}
      inert={!panel}
    >
      <div className="mb-6 flex items-center justify-between [&>button]:grid [&>button]:h-11 [&>button]:w-10 [&>button]:cursor-pointer [&>button]:place-items-center [&>button]:rounded-lg [&>button]:border [&>button]:border-transparent [&>button]:bg-transparent [&>button]:text-[var(--writer-text)] [&>button:hover]:bg-[var(--writer-surface-muted)] [&>button:hover]:text-[var(--writer-ink)] [&>button_svg]:size-4">
        <div
          className="flex min-w-0 gap-1 [&_button]:h-10 [&_button]:w-auto [&_button]:rounded-md [&_button]:px-2 [&_button]:text-[0.72rem] [&_button]:text-[var(--writer-text)] [&_button[aria-pressed=true]]:bg-[var(--writer-surface-muted)] [&_button[aria-pressed=true]]:text-[var(--writer-ink)]"
          aria-label="執筆サイドバー"
        >
          <button aria-pressed={panel === 'hints'} onClick={() => onChange('hints')} type="button">
            ノート
          </button>
          <button
            aria-pressed={panel === 'articles'}
            onClick={() => onChange('articles')}
            type="button"
          >
            記事
          </button>
          <button
            aria-pressed={panel === 'analysis'}
            onClick={() => onChange('analysis')}
            type="button"
          >
            構成
          </button>
          <button
            aria-pressed={panel === 'settings'}
            onClick={() => onChange('settings')}
            type="button"
          >
            公開設定
          </button>
          <button
            aria-pressed={panel === 'review'}
            onClick={() => onChange('review')}
            type="button"
          >
            校正{lintCount > 0 ? ` ${lintCount}` : ''}
          </button>
        </div>
        <button aria-label="記事設定を閉じる" onClick={onClose} type="button">
          <X />
        </button>
      </div>
      {children}
    </aside>
  </>
);
