import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WriterPublicationReadiness } from './writer-publication-readiness';

describe('WriterPublicationReadiness', () => {
  it('完了数と公開阻害要因を表示する', () => {
    render(
      <WriterPublicationReadiness
        checks={[
          { done: true, label: 'タイトル' },
          { done: false, label: 'URL' },
        ]}
        preflight={{
          blockers: [{ label: 'スラッグがない', level: 'blocker' }],
          issues: [
            { label: 'スラッグがない', level: 'blocker' },
            { label: 'タグがない', level: 'warning' },
          ],
          warnings: [{ label: 'タグがない', level: 'warning' }],
        }}
      />
    );

    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('公開を止める問題が1件ある')).toBeInTheDocument();
    expect(screen.getByText('スラッグがない')).toBeInTheDocument();
  });

  it('問題がなければ公開準備完了を表示する', () => {
    render(
      <WriterPublicationReadiness
        checks={[{ done: true, label: 'タイトル' }]}
        preflight={{ blockers: [], issues: [], warnings: [] }}
      />
    );

    expect(screen.getByText('公開準備が整っている')).toBeInTheDocument();
  });
});
