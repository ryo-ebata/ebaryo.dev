'use client';

import type { MarkdownEdit } from '@/lib/writer-editing';
import { getLintCategory, type LintMessage } from './writer-model';
import styles from './writer-review-panel.module.css';

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
  <div className={styles.lintPanel}>
    <div className={styles.panelTitle}>
      <div>
        <strong>
          {messages.length > 0 ? `${messages.length}件の気になる表現` : '気になる表現はなかった'}
        </strong>
        <p>textlintとAI表現ルールで本文を確認する。</p>
      </div>
      <button disabled={isLinting} onClick={onRunLint} type="button">
        {isLinting ? '確認中…' : 'もう一度確認'}
      </button>
    </div>
    <div className={styles.lintList}>
      {messages.map((item, index) => {
        const [start, end] = item.range;
        const lineStart = body.lastIndexOf('\n', start - 1) + 1;
        const lineEndIndex = body.indexOf('\n', end);
        const lineEnd = lineEndIndex === -1 ? body.length : lineEndIndex;
        const fix = item.fix;
        return (
          <article className={styles.lintItem} key={`${item.line}-${item.column}-${index}`}>
            <button className={styles.lintJump} onClick={() => onJump(index)} type="button">
              <span className={styles.lintLocation}>{item.line}行目</span>
              <q>{body.slice(lineStart, lineEnd)}</q>
            </button>
            <p>{item.message}</p>
            <footer>
              <span className={styles.lintRule}>
                <strong>{getLintCategory(item.ruleId)}</strong>
                <code>{item.ruleId.split('/').at(-1)}</code>
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
