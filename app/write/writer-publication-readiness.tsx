'use client';

import { Check } from 'lucide-react';
import type { createWriterPreflight } from '@/lib/writer-preflight';
import styles from './writer-publication-readiness.module.css';

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
    <div className={styles.readiness}>
      <div>
        <strong>
          {checks.filter((item) => item.done).length}/{checks.length}
        </strong>
        <span>項目を確認済み</span>
      </div>
      <ul>
        {checks.map((item) => (
          <li data-done={item.done} key={item.label}>
            <Check />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
    <div className={styles.preflightResult} data-ready={preflight.blockers.length === 0}>
      <strong>
        {preflight.blockers.length > 0
          ? `公開を止める問題が${preflight.blockers.length}件ある`
          : preflight.warnings.length > 0
            ? `公開可能。確認事項が${preflight.warnings.length}件ある`
            : '公開準備が整っている'}
      </strong>
      {preflight.issues.length > 0 && (
        <ul>
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
