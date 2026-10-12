'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { WriterNextAction } from '@/lib/writer-next-action';
import type { SidePanel, VisibleSidePanel } from './writer-model';
import { cn } from '@/lib/utils';

interface WriterInspectorProps {
  children: ReactNode;
  isDraggingLink: boolean;
  lintCount: number;
  onChange: (panel: Exclude<SidePanel, null>) => void;
  onClose: () => void;
  panelCounts?: Partial<Record<VisibleSidePanel, number>>;
  nextAction: WriterNextAction;
  onActivateNextAction: (action: WriterNextAction) => void;
  panel: SidePanel;
}

const PANEL_LABELS: Record<Exclude<SidePanel, null>, string> = {
  analysis: '記事構成',
  articles: '公開済み記事',
  clippings: 'Clipping',
  facts: '記事の検証',
  hints: 'Obsidianのヒント',
  ideas: '記事案',
  kindle: 'Kindle',
  review: '校正結果',
  sources: '素材',
  settings: '公開設定',
  voice: '文章の癖',
};

const PANEL_GROUPS = [
  {
    label: '記事案',
    panels: [['ideas', '記事案']],
  },
  {
    label: '素材',
    panels: [
      ['sources', 'すべて'],
      ['hints', 'ノート'],
      ['kindle', 'Kindle'],
      ['clippings', 'Clip'],
      ['articles', '公開'],
    ],
  },
  {
    label: 'レビュー',
    panels: [
      ['analysis', '概要'],
      ['facts', '根拠'],
      ['review', '校正'],
      ['voice', '文体'],
    ],
  },
  { label: '公開', panels: [['settings', '公開設定']] },
] as const satisfies ReadonlyArray<{
  label: string;
  panels: ReadonlyArray<readonly [Exclude<SidePanel, null>, string]>;
}>;

export const WriterInspector = ({
  children,
  isDraggingLink,
  lintCount,
  onChange,
  onClose,
  panelCounts = {},
  nextAction,
  onActivateNextAction,
  panel,
}: WriterInspectorProps) => (
  <>
    <button
      aria-hidden={!panel || isDraggingLink}
      aria-label="記事設定を閉じる"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[10.75rem] bottom-0 z-29 hidden cursor-default border-0 bg-[rgb(32_33_36/18%)] opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none max-[1179px]:block max-[640px]:top-[10.25rem]',
        panel && !isDraggingLink && 'pointer-events-auto opacity-100'
      )}
      onClick={onClose}
      tabIndex={panel && !isDraggingLink ? 0 : -1}
      type="button"
    />
    <aside
      className={cn(
        'fixed top-[10.75rem] right-0 bottom-0 z-30 w-[min(23rem,94vw)] translate-x-[102%] overflow-auto border-l border-[var(--writer-line-subtle)] bg-[var(--writer-paper)] p-5 shadow-[-1rem_0_3rem_rgb(32_34_31/7%)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[640px]:top-[10.25rem] [&>div:not(:first-child)]:mt-7 [&>div:not(:first-child)]:border-t [&>div:not(:first-child)]:border-[var(--writer-line-subtle)] [&>div:not(:first-child)]:pt-6 [&_h2]:mb-3.5 [&_h2]:text-xs [&_h2]:font-extrabold [&_h2]:tracking-[0.04em] [&_label]:mt-3.5 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-bold [&_label]:text-[var(--writer-text)] [&_label_small]:text-[0.65rem] [&_label_small]:leading-6 [&_label_small]:font-normal [&_label_small]:text-[var(--writer-text-subtle)] [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--writer-line)] [&_input]:bg-white [&_input]:px-3 [&_input]:py-3 [&_input]:text-sm [&_input]:font-normal [&_input]:text-[var(--writer-ink)] [&_input:disabled]:bg-[var(--writer-surface-muted)] [&_input:disabled]:text-[var(--writer-text)] [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[var(--writer-line)] [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:font-normal [&_textarea]:text-[var(--writer-ink)] [&_small]:text-xs [&_code]:text-xs',
        panel && 'translate-x-0'
      )}
      aria-label={panel ? PANEL_LABELS[panel] : '執筆サイドバー'}
      aria-hidden={!panel}
      inert={!panel}
    >
      <div className="sticky top-0 z-2 -mx-1 mb-5 grid gap-3 bg-[var(--writer-paper)] px-1 pb-3">
        <div className="relative [&>button]:grid [&>button]:h-11 [&>button]:w-10 [&>button]:cursor-pointer [&>button]:place-items-center [&>button]:rounded-lg [&>button]:border [&>button]:border-transparent [&>button]:bg-transparent [&>button]:text-[var(--writer-text)] [&>button:hover]:bg-[var(--writer-surface-muted)] [&>button:hover]:text-[var(--writer-ink)] [&>button_svg]:size-4">
          <div className="grid min-w-0 gap-2">
            <div
              className="mr-11 grid grid-cols-4 gap-1 rounded-lg bg-[var(--writer-surface-soft)] p-1 [&_button]:min-h-11 [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-1.5 [&_button]:text-[0.72rem] [&_button]:font-bold [&_button]:text-[var(--writer-text)] [&_button:hover]:text-[var(--writer-ink)] [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-[var(--writer-ink)] [&_button[aria-pressed=true]]:shadow-sm"
              aria-label="執筆支援の分類"
            >
              {PANEL_GROUPS.map((group) => {
                const selected = group.panels.some(([value]) => value === panel);
                return (
                  <button
                    aria-pressed={selected}
                    key={group.label}
                    onClick={() => onChange(group.panels[0][0])}
                    type="button"
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
            {PANEL_GROUPS.map((group) =>
              group.panels.some(([value]) => value === panel) && group.panels.length > 1 ? (
                <div
                  className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_button]:min-h-11 [&_button]:shrink-0 [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:text-xs [&_button]:text-[var(--writer-text)] [&_button:hover]:bg-[var(--writer-surface-soft)] [&_button:hover]:text-[var(--writer-ink)] [&_button[aria-pressed=true]]:bg-[var(--writer-surface-muted)] [&_button[aria-pressed=true]]:font-bold [&_button[aria-pressed=true]]:text-[var(--writer-ink)]"
                  aria-label={`${group.label}メニュー`}
                  key={group.label}
                >
                  {group.panels.map(([value, label]) => (
                    <button
                      aria-pressed={panel === value}
                      key={value}
                      onClick={() => onChange(value)}
                      type="button"
                    >
                      {label}
                      {(panelCounts[value] ?? (value === 'review' ? lintCount : 0)) > 0
                        ? ` ${panelCounts[value] ?? lintCount}`
                        : ''}
                    </button>
                  ))}
                </div>
              ) : null
            )}
          </div>
          <button
            aria-label="記事設定を閉じる"
            className="absolute top-0 right-0"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>
        <button
          className="grid w-full cursor-pointer grid-cols-[4.1rem_minmax(0,1fr)] gap-x-3 border-0 border-l-2 border-l-[var(--primary)] bg-transparent px-3 py-1.5 text-left hover:bg-[var(--writer-surface-soft)]"
          onClick={() => onActivateNextAction(nextAction)}
          type="button"
        >
          <span className="row-span-2 text-[0.6rem] font-bold text-[var(--writer-warm)]">
            次にやる
          </span>
          <strong className="text-[0.72rem] leading-5 text-[var(--writer-ink)]">
            {nextAction.label}
          </strong>
          <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.6rem] text-[var(--writer-text-subtle)]">
            {nextAction.reason}
          </small>
        </button>
      </div>
      <div
        className="animate-[writer-panel-content_150ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
        key={panel}
      >
        {children}
      </div>
    </aside>
  </>
);
