'use client';

import type { WriterVoiceAnalysis } from '@/lib/writer-voice';

interface WriterVoicePanelProps {
  analysis: WriterVoiceAnalysis;
  onJump: (offset: number) => void;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const WriterVoicePanel = ({ analysis, onJump }: WriterVoicePanelProps) => (
  <div className="grid gap-7">
    <header className="grid gap-3 border-b border-[var(--writer-line-subtle)] pb-5">
      <div className="flex items-baseline justify-between gap-3">
        <strong className="text-sm">自分の文章との差</strong>
        <span className="text-[0.62rem] text-[var(--writer-text)]">
          公開済み {analysis.baseline?.sentenceCount ?? 0}文を基準
        </span>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-px overflow-hidden rounded-md bg-[var(--writer-line-subtle)] [&>div]:grid [&>div]:gap-1 [&>div]:bg-[var(--writer-paper)] [&>div]:p-2.5 [&_dd]:m-0 [&_dd]:text-sm [&_dd]:font-bold [&_dt]:text-[0.58rem] [&_dt]:text-[var(--writer-text)] [&_small]:font-normal [&_small]:text-[0.58rem] [&_small]:text-[var(--writer-text-subtle)]">
        <div>
          <dt>一文</dt>
          <dd>{analysis.profile.averageSentenceLength}字</dd>
          <small>通常 {analysis.baseline?.averageSentenceLength ?? '—'}字</small>
        </div>
        <div>
          <dt>長短の差</dt>
          <dd>{percent(analysis.profile.sentenceLengthVariation)}</dd>
          <small>
            通常 {analysis.baseline ? percent(analysis.baseline.sentenceLengthVariation) : '—'}
          </small>
        </div>
        <div>
          <dt>箇条書き</dt>
          <dd>{percent(analysis.profile.bulletRatio)}</dd>
          <small>通常 {analysis.baseline ? percent(analysis.baseline.bulletRatio) : '—'}</small>
        </div>
      </dl>
    </header>
    <section className="grid gap-2">
      <h2>文章の癖</h2>
      {analysis.findings.length === 0 ? (
        <p className="m-0 text-[0.7rem] leading-relaxed text-[var(--writer-text)]">
          過去記事の文体から大きく外れた箇所や、均質すぎる表現は見つからなかった。
        </p>
      ) : (
        <div className="grid">
          {analysis.findings.map((finding) => {
            const content = (
              <>
                <span
                  className="mt-1.5 size-1.5 rotate-45 bg-[var(--writer-accent)]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="mb-1 block text-[0.58rem] text-[var(--writer-warm)]">
                    {finding.type === 'voice' ? '過去記事との差' : '均質な表現'}
                  </strong>
                  {finding.text}
                </span>
              </>
            );
            const className =
              'grid grid-cols-[0.5rem_minmax(0,1fr)] gap-2 border-0 border-t border-[var(--writer-line-subtle)] bg-transparent px-0 py-3 text-left text-[0.7rem] leading-relaxed text-[var(--writer-ink)]';
            return finding.offset === undefined ? (
              <p className={`${className} m-0`} key={finding.text}>
                {content}
              </p>
            ) : (
              <button
                className={`${className} cursor-pointer hover:text-[var(--primary)]`}
                key={finding.text}
                onClick={() => onJump(finding.offset ?? 0)}
                type="button"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </section>
  </div>
);
