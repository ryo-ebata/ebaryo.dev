'use client';

import { ImagePlus, Lightbulb } from 'lucide-react';
import type { DragEventHandler, RefObject } from 'react';
import { continueMarkdownLine, type MarkdownEdit } from '@/lib/writer-editing';
import type { WriterFormat } from './use-writer-editor';
import type { DraftState, LintMessage } from './writer-model';
import { WriterTools } from './writer-tools';
import { cn } from '@/lib/utils';

interface TextRange {
  end: number;
  start: number;
}

interface WriterEditorCanvasProps {
  activeLintIndex: number | null;
  article: DraftState;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  characterCount: number;
  isDragging: boolean;
  isDraggingHint: boolean;
  isLinting: boolean;
  lintMessages: LintMessage[];
  onApplyMarkdownEdit: (edit: MarkdownEdit) => void;
  onDrop: DragEventHandler<HTMLElement>;
  onFormat: (format: WriterFormat) => void;
  onInsertAtCursor: (text: string, range?: TextRange) => void;
  onJumpToLintMessage: (index: number) => void;
  onOpenAnalysis: () => void;
  onOpenHints: () => void;
  onOpenSettings: () => void;
  onRememberSelection: (range: TextRange) => void;
  onRunLint: () => void;
  onSetDragging: (isDragging: boolean) => void;
  onUpdate: <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => void;
  onUploadImage: (file: File) => void;
  onUploadRequest: () => void;
}

export const WriterEditorCanvas = ({
  activeLintIndex,
  article,
  bodyRef,
  characterCount,
  isDragging,
  isDraggingHint,
  isLinting,
  lintMessages,
  onApplyMarkdownEdit,
  onDrop,
  onFormat,
  onInsertAtCursor,
  onJumpToLintMessage,
  onOpenAnalysis,
  onOpenHints,
  onOpenSettings,
  onRememberSelection,
  onRunLint,
  onSetDragging,
  onUpdate,
  onUploadImage,
  onUploadRequest,
}: WriterEditorCanvasProps) => (
  <section
    className={cn(
      'relative mx-auto flex min-h-full w-[min(42rem,calc(100%-3rem))] flex-col pt-12 pb-4 max-[640px]:w-[calc(100%-2rem)] max-[640px]:pt-8',
      isDragging && 'outline-2 -outline-offset-2 outline-[var(--writer-accent)]'
    )}
    data-writer-paper
    aria-label="本文編集"
    onDragEnter={() => onSetDragging(true)}
    onDragLeave={() => onSetDragging(false)}
    onDragOver={(event) => event.preventDefault()}
    onDrop={onDrop}
  >
    <input
      aria-label="記事タイトル"
      className="w-full resize-none border-0 bg-transparent pb-[1.4rem] text-[clamp(2rem,3vw,2.45rem)] leading-[1.4] font-semibold tracking-[-0.02em] text-[var(--writer-ink)] placeholder:text-[var(--writer-text-subtle)] max-[640px]:text-[2rem]"
      onChange={(event) => onUpdate('title', event.target.value)}
      placeholder="記事のタイトル"
      value={article.title}
    />
    <div className="relative flex min-h-[34rem] flex-1 flex-col">
      {lintMessages.length > 0 && (
        <div
          className="my-[0.35rem] -mb-2 flex min-h-11 items-center gap-3 rounded-md border border-[var(--writer-line)] bg-[var(--writer-warning-surface)] px-2.5 py-2"
          aria-live="polite"
        >
          <span className="shrink-0 text-[0.67rem] font-bold text-[var(--writer-warm)]">
            校正 {lintMessages.length}件
          </span>
          <button
            className="flex min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-[0.7rem] text-[var(--writer-ink)] [&>strong]:shrink-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap [&>span]:text-[var(--writer-text)]"
            onClick={() => onJumpToLintMessage(activeLintIndex ?? 0)}
            type="button"
          >
            <strong>
              {activeLintIndex === null
                ? '指摘を見る'
                : `${lintMessages[activeLintIndex]?.line}行目`}
            </strong>
            <span>{lintMessages[activeLintIndex ?? 0]?.message}</span>
          </button>
        </div>
      )}
      <textarea
        aria-label="記事本文"
        ref={bodyRef}
        className="h-full min-h-[34rem] w-full flex-1 resize-none border-0 bg-transparent pt-7 font-sans text-[1.0625rem] leading-[1.95] text-[var(--writer-ink)] placeholder:text-[var(--writer-text-subtle)] max-[640px]:text-base"
        onChange={(event) => onUpdate('body', event.target.value)}
        onKeyDown={(event) => {
          const modifier = event.metaKey || event.ctrlKey;
          const key = event.key.toLocaleLowerCase();
          const shortcut =
            key === 'b' ? 'bold' : key === 'k' ? 'link' : key === 'e' ? 'code' : null;
          if (modifier && shortcut) {
            event.preventDefault();
            onFormat(shortcut);
            return;
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            const edit = continueMarkdownLine(article.body, event.currentTarget.selectionStart);
            if (edit) {
              event.preventDefault();
              onApplyMarkdownEdit(edit);
            }
          }
        }}
        onSelect={(event) =>
          onRememberSelection({
            end: event.currentTarget.selectionEnd,
            start: event.currentTarget.selectionStart,
          })
        }
        onPaste={(event) => {
          const image = [...event.clipboardData.files].find((file) =>
            file.type.startsWith('image/')
          );
          if (image) {
            event.preventDefault();
            onUploadImage(image);
            return;
          }
          const pastedText = event.clipboardData.getData('text/plain').trim();
          const textarea = event.currentTarget;
          const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
          if (selectedText && /^https?:\/\/\S+$/u.test(pastedText)) {
            event.preventDefault();
            onInsertAtCursor(`[${selectedText}](${pastedText})`, {
              end: textarea.selectionEnd,
              start: textarea.selectionStart,
            });
          }
        }}
        placeholder="本文を書く…"
        spellCheck="true"
        value={article.body}
      />
      {lintMessages.length > 0 && (
        <div
          className="pointer-events-none absolute top-20 right-[-1rem] bottom-4 w-2 [&_button]:pointer-events-auto [&_button]:absolute [&_button]:size-[0.45rem] [&_button]:translate-y-[-50%] [&_button]:cursor-pointer [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-[var(--writer-marker)] [&_button]:p-0 [&_button]:shadow-[0_0_0_2px_var(--writer-paper)] [&_button[aria-pressed=true]]:bg-[var(--writer-warm)] [&_button[aria-pressed=true]]:shadow-[0_0_0_3px_var(--writer-warning-surface)]"
          aria-label="本文の校正指摘"
        >
          {lintMessages.map((item, index) => (
            <button
              aria-label={`${item.line}行目: ${item.message}`}
              aria-pressed={activeLintIndex === index}
              key={`${item.line}-${item.column}-${index}`}
              onClick={() => onJumpToLintMessage(index)}
              style={{
                top: `${((item.line - 1) / Math.max(1, article.body.split('\n').length - 1)) * 100}%`,
              }}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
    {isDragging && (
      <div className="pointer-events-none absolute inset-x-0 inset-y-4 z-3 grid place-content-center gap-3 bg-[rgb(255_254_251/94%)] text-center font-bold text-[var(--writer-ink)] [&_svg]:mx-auto [&_svg]:size-8">
        {isDraggingHint ? <Lightbulb /> : <ImagePlus />}
        {isDraggingHint ? 'ここにリンクを置く' : 'ここに画像を置く'}
      </div>
    )}
    <WriterTools
      characterCount={characterCount}
      isLinting={isLinting}
      onFormat={onFormat}
      onOpenAnalysis={onOpenAnalysis}
      onOpenHints={onOpenHints}
      onOpenSettings={onOpenSettings}
      onRunLint={onRunLint}
      onUploadImage={onUploadRequest}
    />
  </section>
);
