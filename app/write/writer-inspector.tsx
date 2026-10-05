'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SidePanel } from './writer-model';
import styles from './writer-inspector.module.css';

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
        className={styles.drawerBackdrop}
        onClick={onClose}
        type="button"
      />
    )}
    <aside
      className={`${styles.inspector} ${panel ? styles.inspectorOpen : ''}`}
      aria-label={panel ? PANEL_LABELS[panel] : '執筆サイドバー'}
      aria-hidden={!panel}
      inert={!panel}
    >
      <div className={styles.inspectorHeader}>
        <div className={styles.inspectorTabs} aria-label="執筆サイドバー">
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
