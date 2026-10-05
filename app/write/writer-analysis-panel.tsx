'use client';

import type { findRelatedWriterArticles, WriterAnalysis } from '@/lib/writer-analysis';
import { WRITING_BLOCKS } from './writer-config';
import type { WritingStage } from './writer-model';
import styles from './writer-analysis-panel.module.css';

interface WriterAnalysisPanelProps {
  analysis: WriterAnalysis;
  onChangeStage: (stage: WritingStage) => void;
  onInsertBlock: (block: (typeof WRITING_BLOCKS)[number]) => void;
  onInsertRelatedArticle: (article: ReturnType<typeof findRelatedWriterArticles>[number]) => void;
  onJump: (offset: number) => void;
  relatedArticles: ReturnType<typeof findRelatedWriterArticles>;
  stage: WritingStage;
}

const stages = [
  ['outline', '構成'],
  ['draft', '執筆'],
  ['review', '推敲'],
  ['publish', '公開'],
] as const;

export const WriterAnalysisPanel = ({
  analysis,
  onChangeStage,
  onInsertBlock,
  onInsertRelatedArticle,
  onJump,
  relatedArticles,
  stage,
}: WriterAnalysisPanelProps) => (
  <div className={styles.analysisPanel}>
    <div className={styles.stageNavigator}>
      {stages.map(([value, label]) => (
        <button
          aria-pressed={stage === value}
          key={value}
          onClick={() => onChangeStage(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
    <div className={styles.analysisSummary}>
      <div>
        <strong>{analysis.readingMinutes}</strong>
        <span>分で読める</span>
      </div>
      <dl>
        <div>
          <dt>段落</dt>
          <dd>{analysis.paragraphCount}</dd>
        </div>
        <div>
          <dt>見出し</dt>
          <dd>{analysis.headings.length}</dd>
        </div>
        <div>
          <dt>リンク</dt>
          <dd>{analysis.internalLinks + analysis.externalLinks}</dd>
        </div>
        <div>
          <dt>画像</dt>
          <dd>{analysis.images}</dd>
        </div>
      </dl>
    </div>
    <section className={styles.analysisSection}>
      <h2>次に直す</h2>
      <div className={styles.findingList}>
        {analysis.findings.map((finding) => {
          const content = (
            <>
              <span data-type={finding.type} />
              {finding.text}
            </>
          );
          return finding.offset === undefined ? (
            <p key={finding.text}>{content}</p>
          ) : (
            <button key={finding.text} onClick={() => onJump(finding.offset ?? 0)} type="button">
              {content}
            </button>
          );
        })}
      </div>
    </section>
    <section className={styles.analysisSection}>
      <h2>見出し</h2>
      {analysis.headings.length === 0 ? (
        <p className={styles.analysisEmpty}>見出しを書くと、ここから移動できる。</p>
      ) : (
        <nav className={styles.outline} aria-label="記事の見出し">
          {analysis.headings.map((heading) => (
            <button
              key={`${heading.offset}-${heading.text}`}
              onClick={() => onJump(heading.offset)}
              style={{ paddingLeft: `${(heading.level - 2) * 0.7 + 0.2}rem` }}
              type="button"
            >
              <span>H{heading.level}</span>
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </section>
    <section className={styles.analysisSection}>
      <h2>関連記事</h2>
      {relatedArticles.length === 0 ? (
        <p className={styles.analysisEmpty}>タイトル・本文・タグが近い公開記事を自動で表示する。</p>
      ) : (
        <div className={styles.relatedSuggestions}>
          {relatedArticles.map((relatedArticle) => (
            <button
              key={relatedArticle.slug}
              onClick={() => onInsertRelatedArticle(relatedArticle)}
              type="button"
            >
              <strong>{relatedArticle.title}</strong>
              <span>本文へリンクを追加</span>
            </button>
          ))}
        </div>
      )}
    </section>
    <section className={styles.analysisSection}>
      <h2>ブロックを追加</h2>
      <div className={styles.blockButtons}>
        {WRITING_BLOCKS.map((block) => (
          <button key={block.label} onClick={() => onInsertBlock(block)} type="button">
            {block.label}
          </button>
        ))}
      </div>
    </section>
  </div>
);
