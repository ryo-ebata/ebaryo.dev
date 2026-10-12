'use client';

import { badgeVariants } from '@/components/atoms/badge';
import { cn } from '@/lib/utils';
import type { TagCount } from '@/lib/tags';
import { useId, useMemo, useState } from 'react';

const EMPTY_LENGTH = 0;
const DEFAULT_VISIBLE_TAGS = 10;

interface TagFilterListProps {
  tags: TagCount[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

interface TagFilterButtonProps {
  count: number;
  isSelected: boolean;
  onToggle: () => void;
  tag: string;
}

const TagFilterButton = ({ count, isSelected, onToggle, tag }: TagFilterButtonProps) => (
  <button
    type="button"
    aria-label={`${tag}、${count}件`}
    aria-pressed={isSelected}
    onClick={onToggle}
    className={cn(
      badgeVariants({ variant: isSelected ? 'default' : 'secondary' }),
      'min-h-11 cursor-pointer gap-1.5 px-3'
    )}
  >
    {tag}
    <span className={isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}>
      {count}
    </span>
  </button>
);

export const TagFilterList = ({ tags, selectedTags, onTagToggle }: TagFilterListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const listId = useId();
  const visibleTags = useMemo(() => {
    if (isExpanded || tags.length <= DEFAULT_VISIBLE_TAGS) return tags;
    const leadingTags = tags.slice(0, DEFAULT_VISIBLE_TAGS);
    const leadingNames = new Set(leadingTags.map(({ tag }) => tag));
    const selectedOutsideLeading = tags.filter(
      ({ tag }) => selectedTags.includes(tag) && !leadingNames.has(tag)
    );
    return [...leadingTags, ...selectedOutsideLeading];
  }, [isExpanded, selectedTags, tags]);

  if (tags.length === EMPTY_LENGTH) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" id={listId}>
        {visibleTags.map(({ tag, count }) => (
          <TagFilterButton
            key={tag}
            count={count}
            isSelected={selectedTags.includes(tag)}
            onToggle={() => onTagToggle(tag)}
            tag={tag}
          />
        ))}
      </div>
      {tags.length > DEFAULT_VISIBLE_TAGS && (
        <button
          aria-controls={listId}
          aria-expanded={isExpanded}
          className="min-h-11 justify-self-start text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          type="button"
        >
          {isExpanded
            ? 'タグを折りたたむ'
            : `すべてのタグを表示（残り${tags.length - DEFAULT_VISIBLE_TAGS}件）`}
        </button>
      )}
    </div>
  );
};
