'use client';

import type { findRelatedWriterArticles, WriterAnalysis } from '@/lib/writer-analysis';
import { WRITING_BLOCKS } from './writer-config';
import styles from './writer-analysis-panel.module.css';

interface WriterAnalysisPanelProps {
  analysis: WriterAnalysis;
  onInsertBlock: (block: (typeof WRITING_BLOCKS)[number]) => void;
  onInsertRelatedArticle: (article: ReturnType<typeof findRelatedWriterArticles>[number]) => void;
  onJump: (offset: number) => void;
  relatedArticles: ReturnType<typeof findRelatedWriterArticles>;
}

const statusLabels = {
  empty: '未着手',
  evidence: '根拠不足',
  outline: '要点のみ',
  ready: '推敲待ち',
  writing: '執筆中',
} as const;

export const WriterAnalysisPanel = ({
  analysis,
  onInsertBlock,
  onInsertRelatedArticle,
  onJump,
  relatedArticles,
}: WriterAnalysisPanelProps) => (
  <div className={styles.analysisPanel}>
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
    {analysis.nextSection && (
      <section className={styles.nextSection}>
        <span>次に書く</span>
        <strong>{analysis.nextSection.heading}</strong>
        <p>{analysis.nextSection.nextAction}</p>
        <button onClick={() => onJump(analysis.nextSection?.offset ?? 0)} type="button">
          この章へ移動
        </button>
      </section>
    )}
    <section className={styles.analysisSection}>
      <h2>章の進み具合</h2>
      {analysis.sections.length === 0 ? (
        <p className={styles.analysisEmpty}>見出しを書くと、章ごとの主張と根拠を確認できる。</p>
      ) : (
        <div className={styles.sectionMap}>
          {analysis.sections.map((section) => (
            <button
              data-status={section.status}
              key={`${section.offset}-${section.heading}`}
              onClick={() => onJump(section.offset)}
              type="button"
            >
              <span className={styles.sectionRail} aria-hidden="true" />
              <span className={styles.sectionBody}>
                <span className={styles.sectionHeading}>
                  <strong>{section.heading}</strong>
                  <small>{statusLabels[section.status]}</small>
                </span>
                <span className={styles.sectionClaim}>
                  {section.claim || 'この章で伝える結論がまだない。'}
                </span>
                <span className={styles.sectionEvidence}>
                  {section.evidence.length > 0
                    ? `根拠 ${section.evidence.length}件 · ${section.evidence
                        .slice(0, 2)
                        .map((item) => item.label)
                        .join('、')}`
                    : '根拠なし'}
                </span>
              </span>
            </button>
          ))}
        </div>
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
