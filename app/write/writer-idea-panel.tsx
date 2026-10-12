'use client';

import { BookOpenText, FilePlus2 } from 'lucide-react';
import type { WriterIdea } from './writer-model';

interface WriterIdeaPanelProps {
  ideas: WriterIdea[];
  isLoading: boolean;
  onUseIdea: (idea: WriterIdea) => void;
}

export function WriterIdeaPanel({ ideas, isLoading, onUseIdea }: WriterIdeaPanelProps) {
  if (isLoading)
    return <p className="m-0 text-xs text-[var(--writer-text)]">記事案を組み立てています…</p>;
  if (ideas.length === 0)
    return <p className="m-0 text-xs text-[var(--writer-text)]">記事案にできるMapがまだない。</p>;

  return (
    <div className="grid gap-4">
      <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">
        Mapとノートのつながりから生成した案。構成は下書きにした後で自由に変えられる。
      </p>
      {ideas.map((idea) => (
        <article
          className="grid gap-3 border-l-3 border-[var(--writer-accent)] bg-[var(--writer-surface-soft)] px-4 py-4"
          key={idea.id}
        >
          <div className="grid gap-1.5">
            <h3 className="m-0 text-[0.92rem] leading-snug font-extrabold text-[var(--writer-ink)]">
              {idea.title}
            </h3>
            <p className="m-0 text-xs leading-relaxed text-[var(--writer-text)]">{idea.angle}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[0.68rem] text-[var(--writer-text-subtle)]">
            <span className="inline-flex items-center gap-1">
              <BookOpenText className="size-3.5" /> {idea.noteCount}ノート
            </span>
            {idea.tags.slice(0, 3).map((tag) => (
              <span className="rounded-full bg-white px-2 py-0.5" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <details className="text-xs text-[var(--writer-text)]">
            <summary className="cursor-pointer font-bold">構成を見る</summary>
            <p className="mt-2 mb-1 font-bold">想定読者</p>
            <p className="m-0 leading-relaxed">{idea.audience}</p>
            <ol className="mt-2 mb-0 grid gap-1 pl-5">
              {[...idea.body.matchAll(/^##\s+(.+)$/gmu)].map((match) => (
                <li key={match[1]}>{match[1]}</li>
              ))}
            </ol>
          </details>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-[var(--writer-ink)] px-3 text-xs font-bold text-white hover:bg-[var(--writer-accent)]"
            onClick={() => onUseIdea(idea)}
            type="button"
          >
            <FilePlus2 className="size-4" /> この構成で下書きを作る
          </button>
        </article>
      ))}
    </div>
  );
}
