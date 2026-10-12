import type { WriterAnalysis } from './writer-analysis';
import type { WriterFactAnalysis } from './writer-facts';
import type { WriterVoiceAnalysis } from './writer-voice';

export interface WriterNextAction {
  label: string;
  offset?: number;
  panel: 'analysis' | 'facts' | 'review' | 'settings' | 'voice';
  reason: string;
}

interface WriterNextActionInput {
  analysis: WriterAnalysis;
  facts: WriterFactAnalysis;
  lintCount: number;
  title: string;
  voice: WriterVoiceAnalysis;
}

export const createWriterNextAction = ({
  analysis,
  facts,
  lintCount,
  title,
  voice,
}: WriterNextActionInput): WriterNextAction => {
  if (!title.trim())
    return {
      label: '記事の結論が伝わるタイトルを決める',
      panel: 'settings',
      reason: 'タイトル未入力',
    };

  const readerBlocker = analysis.readerExperience.blockers[0];
  if (readerBlocker)
    return {
      label: readerBlocker.text,
      offset: readerBlocker.offset,
      panel: 'analysis',
      reason: '読者理解を妨げる問題',
    };

  const unfinishedSection = analysis.nextSection;
  if (unfinishedSection && ['empty', 'outline'].includes(unfinishedSection.status))
    return {
      label: unfinishedSection.nextAction,
      offset: unfinishedSection.offset,
      panel: 'analysis',
      reason: `「${unfinishedSection.heading}」が${unfinishedSection.status === 'empty' ? '未着手' : '骨子段階'}`,
    };

  const unsupported = facts.claims.find((claim) => claim.status === 'needs-evidence');
  if (unsupported)
    return {
      label: 'この主張を根拠で裏付ける',
      offset: unsupported.offset,
      panel: 'facts',
      reason: unsupported.text.slice(0, 54),
    };

  const gap = analysis.gaps[0];
  if (gap)
    return { label: gap.text, offset: gap.offset, panel: 'analysis', reason: '構成上の不足' };

  const readerWarning = analysis.readerExperience.warnings[0];
  if (readerWarning)
    return {
      label: readerWarning.text,
      offset: readerWarning.offset,
      panel: 'analysis',
      reason: '読者が迷う可能性',
    };

  if (lintCount > 0)
    return { label: `${lintCount}件の校正指摘を解消する`, panel: 'review', reason: '校正結果あり' };

  const voiceFinding = voice.findings[0];
  if (voiceFinding)
    return {
      label: voiceFinding.text,
      offset: voiceFinding.offset,
      panel: 'voice',
      reason: voiceFinding.type === 'ai-pattern' ? 'AIらしい表現' : '過去記事との差',
    };

  return { label: '公開前の設定を確認する', panel: 'settings', reason: '本文の主要課題なし' };
};
