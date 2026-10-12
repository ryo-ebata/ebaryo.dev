'use client';

import type { WriterAnalysis } from '@/lib/writer-analysis';
import type { WriterFactAnalysis } from '@/lib/writer-facts';
import type { WriterVoiceAnalysis } from '@/lib/writer-voice';
import type { LintMessage, SidePanel } from './writer-model';

interface WriterReviewOverviewProps {
  analysis: WriterAnalysis;
  facts: WriterFactAnalysis;
  lintMessages: LintMessage[];
  onChangePanel: (panel: Exclude<SidePanel, null>) => void;
  onJump: (offset: number) => void;
  onJumpToLint: (index: number) => void;
  voice: WriterVoiceAnalysis;
}

interface ReviewItem {
  category: string;
  level: 'blocker' | 'warning';
  onSelect?: () => void;
  text: string;
}

export const WriterReviewOverview = ({
  analysis,
  facts,
  lintMessages,
  onChangePanel,
  onJump,
  onJumpToLint,
  voice,
}: WriterReviewOverviewProps) => {
  const items: ReviewItem[] = [
    ...analysis.findings
      .filter((finding) => finding.type === 'improve')
      .map((finding) => ({
        category: '基本',
        level: 'warning' as const,
        onSelect: finding.offset === undefined ? undefined : () => onJump(finding.offset ?? 0),
        text: finding.text,
      })),
    ...analysis.readerExperience.findings.map((finding) => ({
      category: '読者理解',
      level: finding.level === 'blocker' ? ('blocker' as const) : ('warning' as const),
      onSelect: () => onJump(finding.offset),
      text: finding.text,
    })),
    ...analysis.gaps.map((gap) => ({
      category: '構成',
      level: 'warning' as const,
      onSelect: () => onJump(gap.offset ?? 0),
      text: gap.text,
    })),
    ...facts.claims
      .filter((claim) => claim.status === 'needs-evidence')
      .map((claim) => ({
        category: '根拠',
        level: 'warning' as const,
        onSelect: () => onJump(claim.offset),
        text: `「${claim.text.slice(0, 48)}」を裏付ける`,
      })),
    ...lintMessages.map((message, index) => ({
      category: '校正',
      level: 'warning' as const,
      onSelect: () => onJumpToLint(index),
      text: message.message,
    })),
    ...voice.findings.map((finding) => ({
      category: '文体',
      level: 'warning' as const,
      onSelect: () =>
        finding.offset === undefined ? onChangePanel('voice') : onJump(finding.offset),
      text: finding.text,
    })),
  ].sort((first, second) =>
    first.level === second.level ? 0 : first.level === 'blocker' ? -1 : 1
  );
  const blockers = items.filter(({ level }) => level === 'blocker').length;

  return (
    <section className="grid gap-3 border-b border-[var(--writer-line-subtle)] pb-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="m-0! text-sm!">レビュー概要</h2>
          <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">
            {items.length === 0
              ? '公開前に直す問題は見つからない。'
              : `${blockers > 0 ? `公開を止める問題${blockers}件、` : ''}改善候補${items.length - blockers}件`}
          </p>
        </div>
        <strong className="text-lg text-[var(--writer-accent)]">{items.length}</strong>
      </header>
      {items.length > 0 && (
        <div className="grid">
          {items.slice(0, 8).map((item, index) => (
            <ReviewRow item={item} key={`${item.category}-${item.text}-${index}`} />
          ))}
        </div>
      )}
      {items.length > 8 && (
        <p className="m-0 text-xs text-[var(--writer-text)]">ほか{items.length - 8}件</p>
      )}
    </section>
  );
};

const ReviewRow = ({ item }: { item: ReviewItem }) => {
  const content = (
    <>
      <span className="text-[0.68rem] font-bold text-[var(--writer-text-subtle)]">
        {item.category}
      </span>
      <span className="text-[0.76rem] leading-relaxed text-[var(--writer-ink)]">{item.text}</span>
    </>
  );
  const className =
    'grid min-h-11 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-2 border-0 border-t border-[var(--writer-line-subtle)] bg-transparent px-0 py-3 text-left';
  if (!item.onSelect)
    return (
      <p className={`${className} m-0`} data-level={item.level}>
        {content}
      </p>
    );
  return (
    <button
      className={`${className} cursor-pointer hover:text-[var(--writer-accent)]`}
      data-level={item.level}
      onClick={item.onSelect}
      type="button"
    >
      {content}
    </button>
  );
};
