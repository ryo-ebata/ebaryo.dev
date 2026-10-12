'use client';

import { useState } from 'react';
import type { WriterEvidenceSuggestion } from '@/lib/writer-evidence';
import type { WriterFactAnalysis, WriterReaderMode } from '@/lib/writer-facts';
import type { WriterSourceAuditResult } from '@/lib/writer-source-audit';
import { useWriterSourceAudit } from './use-writer-source-audit';
import styles from './writer-fact-panel.module.css';

interface WriterFactPanelProps {
  analysis: WriterFactAnalysis;
  evidenceSuggestions: Record<number, WriterEvidenceSuggestion[]>;
  onAddResearchNote: (offset: number) => void;
  onInsertEvidence: (insertText: string, offset: number) => void;
  onJump: (offset: number) => void;
  onMarkAsOpinion: (offset: number) => void;
}

const readerLabels: Record<WriterReaderMode, string> = {
  intermediate: '中級者',
  practitioner: '実践者',
  skeptic: '懐疑的',
  skimmer: '流し読み',
};

const kindLabels = {
  assertion: '断定',
  experience: '実体験',
  measurement: '数値',
  opinion: '意見',
} as const;

const statusLabels = {
  grounded: '根拠あり',
  'needs-evidence': '要確認',
  personal: '本人の知見',
} as const;

const sourceLabels = {
  article: '記事',
  clipping: 'Clip',
  kindle: 'Kindle',
  note: 'Note',
} as const;

const roleLabels = {
  counterpoint: '反例',
  definition: '定義',
  example: '具体例',
  support: '支持',
} as const;

const auditLabels = {
  broken: '取得不可',
  healthy: '確認済み',
  warning: '要確認',
} as const;

const SourceAuditResult = ({ result }: { result?: WriterSourceAuditResult }) => {
  if (!result) return null;
  const details = [
    result.title,
    result.author,
    result.publishedAt?.slice(0, 10),
    ...result.issues,
  ].filter(Boolean);
  return (
    <span className={styles.auditResult} data-status={result.status}>
      <b>{auditLabels[result.status]}</b>
      {details.length > 0 && <span>{details.join('／')}</span>}
    </span>
  );
};

export const WriterFactPanel = ({
  analysis,
  evidenceSuggestions,
  onAddResearchNote,
  onInsertEvidence,
  onJump,
  onMarkAsOpinion,
}: WriterFactPanelProps) => {
  const [reader, setReader] = useState<WriterReaderMode>('skeptic');
  const findings = analysis.readerReviews[reader];
  const { auditCount, isAuditing, message, resultFor, runAudit } = useWriterSourceAudit(analysis);
  return (
    <div className={styles.panel}>
      <header className={styles.summary}>
        <div>
          <strong>{analysis.needsEvidenceCount}</strong>
          <span>確認が必要な主張</span>
        </div>
        <dl>
          <div>
            <dt>主張</dt>
            <dd>{analysis.claims.length}</dd>
          </div>
          <div>
            <dt>根拠あり</dt>
            <dd>{analysis.groundedCount}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>調査キュー</h2>
          <span>{analysis.researchTasks.length}件</span>
        </div>
        {analysis.researchTasks.length === 0 ? (
          <p className={styles.empty}>追加で調べる主張はない。</p>
        ) : (
          <div className={styles.tasks}>
            {analysis.researchTasks.map((task, index) => (
              <button
                key={`${task.offset}-${task.type}-${index}`}
                onClick={() => onJump(task.offset)}
                type="button"
              >
                <span>{task.type === 'source' ? '出典' : '具体化'}</span>
                {task.text}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>読者として読む</h2>
        <div className={styles.readerTabs} aria-label="レビューする読者">
          {(Object.keys(readerLabels) as WriterReaderMode[]).map((mode) => (
            <button
              aria-pressed={reader === mode}
              key={mode}
              onClick={() => setReader(mode)}
              type="button"
            >
              {readerLabels[mode]}
            </button>
          ))}
        </div>
        {findings.length === 0 ? (
          <p className={styles.empty}>この読者視点で大きな不足は見つからなかった。</p>
        ) : (
          <div className={styles.findings}>
            {findings.map((finding) =>
              finding.offset === undefined ? (
                <p key={finding.text}>{finding.text}</p>
              ) : (
                <button
                  key={finding.text}
                  onClick={() => onJump(finding.offset ?? 0)}
                  type="button"
                >
                  {finding.text}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>ファクト台帳</h2>
          <button
            className={styles.auditButton}
            disabled={auditCount === 0 || isAuditing}
            onClick={() => void runAudit()}
            type="button"
          >
            {isAuditing ? '検証中…' : `出典を検証${auditCount > 0 ? ` ${auditCount}` : ''}`}
          </button>
        </div>
        {message && <p className={styles.auditMessage}>{message}</p>}
        {analysis.claims.length === 0 ? (
          <p className={styles.empty}>本文を書くと、確認すべき主張をここへ並べる。</p>
        ) : (
          <div className={styles.ledger}>
            {analysis.claims.map((claim) => {
              const suggestions = evidenceSuggestions[claim.offset] ?? [];
              return (
                <article data-status={claim.status} key={`${claim.offset}-${claim.text}`}>
                  <button
                    className={styles.claimJump}
                    onClick={() => onJump(claim.offset)}
                    type="button"
                  >
                    <span className={styles.claimMeta}>
                      <span>{kindLabels[claim.kind]}</span>
                      <span>{statusLabels[claim.status]}</span>
                    </span>
                    <strong>{claim.text}</strong>
                    {claim.evidence.length > 0 && (
                      <span className={styles.sourceList}>
                        {claim.evidence.slice(0, 2).map((evidence) => (
                          <small key={evidence}>
                            <span>根拠: {evidence}</span>
                            {/^https?:\/\//u.test(evidence) && (
                              <SourceAuditResult result={resultFor(claim.offset, evidence)} />
                            )}
                          </small>
                        ))}
                      </span>
                    )}
                    {claim.questions.map((question) => (
                      <q key={question}>{question}</q>
                    ))}
                  </button>
                  {claim.status === 'needs-evidence' && (
                    <div className={styles.claimTools}>
                      {suggestions.length > 0 && (
                        <div className={styles.evidenceCandidates}>
                          <span className={styles.toolLabel}>使えそうな根拠</span>
                          {suggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.sourceType}-${suggestion.id}`}
                              onClick={() =>
                                onInsertEvidence(suggestion.insertText, claim.insertionOffset)
                              }
                              title={`${roleLabels[suggestion.role]}として挿入`}
                              type="button"
                            >
                              <span>
                                {sourceLabels[suggestion.sourceType]} ·{' '}
                                {roleLabels[suggestion.role]}
                              </span>
                              <strong>{suggestion.title}</strong>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className={styles.claimActions}>
                        <button onClick={() => onMarkAsOpinion(claim.offset)} type="button">
                          見解と明示
                        </button>
                        <button
                          onClick={() => onAddResearchNote(claim.insertionOffset)}
                          type="button"
                        >
                          後で調査
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
