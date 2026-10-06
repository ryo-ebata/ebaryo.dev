'use client';

import {
  Bold,
  Code2,
  Heading2,
  ImagePlus,
  Lightbulb,
  Link,
  ListChecks,
  ListTree,
  PanelRight,
  Quote,
} from 'lucide-react';
import type { WriterFormat } from './use-writer-editor';

interface WriterToolsProps {
  characterCount: number;
  isLinting: boolean;
  onFormat: (format: WriterFormat) => void;
  onOpenAnalysis: () => void;
  onOpenHints: () => void;
  onOpenSettings: () => void;
  onRunLint: () => void;
  onUploadImage: () => void;
}

export const WriterTools = ({
  characterCount,
  isLinting,
  onFormat,
  onOpenAnalysis,
  onOpenHints,
  onOpenSettings,
  onRunLint,
  onUploadImage,
}: WriterToolsProps) => (
  <footer className="sticky bottom-0 flex items-center justify-between bg-[rgb(250_250_248/92%)] py-3 text-xs text-[var(--writer-text)] backdrop-blur-lg">
    <details className="relative text-[var(--writer-text)]">
      <summary className="min-h-9 cursor-pointer list-none py-2 text-xs marker:hidden [&::-webkit-details-marker]:hidden">
        ＋ 執筆環境
      </summary>
      <div className="absolute bottom-10 left-0 z-5 flex w-[min(38rem,calc(100vw-2rem))] flex-wrap items-center gap-1 rounded-lg border border-[var(--writer-line-subtle)] bg-[var(--writer-paper)] p-1.5 shadow-[0_0.5rem_1.5rem_rgb(36_36_33/8%)] [&>button]:flex [&>button]:min-h-9 [&>button]:cursor-pointer [&>button]:items-center [&>button]:gap-1.5 [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-2 [&>button]:text-xs [&>button]:text-[var(--writer-text)] [&_svg]:size-4">
        <div
          className="mr-0.5 flex gap-px border-r border-[var(--writer-line-subtle)] pr-1.5 [&_button]:grid [&_button]:size-[2.1rem] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[var(--writer-text)] [&_button:hover]:bg-[var(--writer-surface-muted)] [&_button:hover]:text-[var(--writer-ink)]"
          aria-label="書式"
        >
          <button onClick={() => onFormat('heading')} title="見出し" type="button">
            <Heading2 />
          </button>
          <button onClick={() => onFormat('bold')} title="太字 ⌘B" type="button">
            <Bold />
          </button>
          <button onClick={() => onFormat('link')} title="リンク ⌘K" type="button">
            <Link />
          </button>
          <button onClick={() => onFormat('quote')} title="引用" type="button">
            <Quote />
          </button>
          <button onClick={() => onFormat('code')} title="コード ⌘E" type="button">
            <Code2 />
          </button>
        </div>
        <button onClick={onUploadImage} type="button">
          <ImagePlus />
          画像
        </button>
        <button disabled={isLinting} onClick={onRunLint} type="button">
          <ListChecks />
          {isLinting ? '校正中' : '文章を校正'}
        </button>
        <button onClick={onOpenHints} type="button">
          <Lightbulb />
          ノートからヒント
        </button>
        <button onClick={onOpenAnalysis} type="button">
          <ListTree />
          構成を確認
        </button>
        <button onClick={onOpenSettings} type="button">
          <PanelRight />
          公開設定
        </button>
      </div>
    </details>
    <div className="flex items-center gap-3">
      <span>{characterCount.toLocaleString('ja-JP')}文字</span>
    </div>
  </footer>
);
