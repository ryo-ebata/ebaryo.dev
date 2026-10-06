'use client';

import { Check } from 'lucide-react';
import type { createWriterPreflight } from '@/lib/writer-preflight';

interface PublicationCheck {
  done: boolean;
  label: string;
}

interface WriterPublicationReadinessProps {
  checks: PublicationCheck[];
  preflight: ReturnType<typeof createWriterPreflight>;
}

export const WriterPublicationReadiness = ({
  checks,
  preflight,
}: WriterPublicationReadinessProps) => (
  <div>
    <h2>公開準備</h2>
    <div className="grid gap-3">
      <div className="flex items-baseline gap-2">
        <strong className="text-[1.35rem]">
          {checks.filter((item) => item.done).length}/{checks.length}
        </strong>
        <span className="text-[0.68rem] text-[var(--writer-text)]">項目を確認済み</span>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {checks.map((item) => (
          <li
            className="flex items-center gap-1 rounded-sm bg-[var(--writer-surface-soft)] px-1.5 py-1 text-[0.65rem] text-[var(--writer-text-subtle)] data-[done=true]:bg-[var(--writer-success-surface)] data-[done=true]:text-[var(--writer-success)]"
            data-done={item.done}
            key={item.label}
          >
            <Check className="size-3" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
    <div
      className="mt-4 grid gap-2 border-l-2 border-[var(--writer-warning)] bg-[var(--writer-warning-surface)] p-3 data-[ready=true]:border-[var(--writer-success)] data-[ready=true]:bg-[var(--writer-success-surface)]"
      data-ready={preflight.blockers.length === 0}
    >
      <strong className="text-[0.7rem] leading-normal">
        {preflight.blockers.length > 0
          ? `公開を止める問題が${preflight.blockers.length}件ある`
          : preflight.warnings.length > 0
            ? `公開可能。確認事項が${preflight.warnings.length}件ある`
            : '公開準備が整っている'}
      </strong>
      {preflight.issues.length > 0 && (
        <ul className="m-0 grid list-none gap-1 p-0 text-[0.65rem] leading-snug text-[var(--writer-text)] [&_li::before]:mr-1.5 [&_li::before]:content-['・'] [&_li[data-level=blocker]]:text-[var(--writer-warning)]">
          {preflight.issues.map((issue) => (
            <li data-level={issue.level} key={issue.label}>
              {issue.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
