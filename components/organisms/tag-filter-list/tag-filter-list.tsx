import { badgeVariants } from '@/components/atoms/badge';
import { cn } from '@/lib/utils';
import type { TagCount } from '@/lib/tags';

const EMPTY_LENGTH = 0;

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
    aria-pressed={isSelected}
    onClick={onToggle}
    className={cn(
      badgeVariants({ variant: isSelected ? 'default' : 'secondary' }),
      'cursor-pointer gap-1.5'
    )}
  >
    {tag}
    <span className={isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}>
      {count}
    </span>
  </button>
);

export const TagFilterList = ({ tags, selectedTags, onTagToggle }: TagFilterListProps) => {
  if (tags.length === EMPTY_LENGTH) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => (
        <TagFilterButton
          key={tag}
          count={count}
          isSelected={selectedTags.includes(tag)}
          onToggle={() => onTagToggle(tag)}
          tag={tag}
        />
      ))}
    </div>
  );
};
