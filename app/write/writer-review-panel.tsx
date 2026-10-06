'use client';

import type { MarkdownEdit } from '@/lib/writer-editing';
import { getLintCategory, type LintMessage } from './writer-model';

interface WriterReviewPanelProps {
  body: string;
  isLinting: boolean;
  messages: LintMessage[];
  onApplyEdit: (edit: MarkdownEdit, dismissedIndex?: number) => void;
  onJump: (index: number) => void;
  onRunLint: () => void;
}

const createReplacement = (body: string, range: [number, number], text: string): MarkdownEdit => {
  const [start, end] = range;
  return {
    selectionEnd: start + text.length,
    selectionStart: start + text.length,
    value: `${body.slice(0, start)}${text}${body.slice(end)}`,
  };
};

export const WriterReviewPanel = ({
  body,
  isLinting,
  messages,
  onApplyEdit,
  onJump,
  onRunLint,
}: WriterReviewPanelProps) => (
  <div className="grid gap-4">
    <div className="flex items-center justify-between [&>button]:cursor-pointer [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-[var(--writer-text)]">
      <div className="grid gap-1">
        <strong className="text-sm">
          {messages.length > 0 ? `${messages.length}件の気になる表現` : '気になる表現はなかった'}
        </strong>
        <p className="m-0 text-[0.68rem] leading-normal text-[var(--writer-text)]">
          textlintとAI表現ルールで本文を確認する。
        </p>
      </div>
      <button disabled={isLinting} onClick={onRunLint} type="button">
        {isLinting ? '確認中…' : 'もう一度確認'}
      </button>
    </div>
    <div className="grid">
      {messages.map((item, index) => {
        const [start, end] = item.range;
        const lineStart = body.lastIndexOf('\n', start - 1) + 1;
        const lineEndIndex = body.indexOf('\n', end);
        const lineEnd = lineEndIndex === -1 ? body.length : lineEndIndex;
        const fix = item.fix;
        return (
          <article
            className="grid w-full gap-2.5 border-t border-[var(--writer-line-subtle)] py-4 text-xs text-[var(--writer-ink)] [&>p]:m-0 [&>p]:leading-relaxed [&>p]:text-[var(--writer-text)] [&_footer]:flex [&_footer]:items-center [&_footer]:justify-between [&_footer]:gap-2 [&_footer>button]:cursor-pointer [&_footer>button]:rounded-md [&_footer>button]:border [&_footer>button]:border-[var(--writer-line-subtle)] [&_footer>button]:bg-white [&_footer>button]:px-2 [&_footer>button]:py-1.5 [&_footer>button]:text-[0.68rem] [&_footer>button]:text-[var(--writer-ink)]"
            key={`${item.line}-${item.column}-${index}`}
          >
            <button
              className="grid cursor-pointer gap-1.5 border-0 bg-transparent p-0 text-left text-[var(--writer-ink)] [&_q]:overflow-hidden [&_q]:text-ellipsis [&_q]:whitespace-nowrap [&_q]:font-semibold [&_q]:leading-relaxed"
              onClick={() => onJump(index)}
              type="button"
            >
              <span className="text-[0.66rem] font-bold text-[var(--writer-accent)]">
                {item.line}行目
              </span>
              <q>{body.slice(lineStart, lineEnd)}</q>
            </button>
            <p>{item.message}</p>
            <footer>
              <span className="flex min-w-0 items-center gap-1.5">
                <strong className="rounded-sm bg-[var(--writer-surface-muted)] px-1.5 py-0.5 text-[0.62rem] text-[var(--writer-warm)]">
                  {getLintCategory(item.ruleId)}
                </strong>
                <code className="text-[0.62rem] text-[var(--writer-text-subtle)]">
                  {item.ruleId.split('/').at(-1)}
                </code>
              </span>
              {fix && (
                <button
                  onClick={() => onApplyEdit(createReplacement(body, fix.range, fix.text), index)}
                  type="button"
                >
                  「{fix.text}」へ修正
                </button>
              )}
              {item.suggestions?.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() =>
                    onApplyEdit(createReplacement(body, suggestion.fix.range, suggestion.fix.text))
                  }
                  type="button"
                >
                  {suggestion.message}
                </button>
              ))}
            </footer>
          </article>
        );
      })}
    </div>
  </div>
);
