'use client';

import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs';

import { SearchX } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  SearchInput,
} from '@/components/atoms';
import { Pagination } from '@/components/molecules';
import { Container } from '@/components/organisms/container';
import { PostList } from '@/components/organisms/post-list/post-list';
import { TagFilterList } from '@/components/organisms/tag-filter-list/tag-filter-list';
import { siteConfig } from '@/config/site';
import type { BaseContentMetadata } from '@/lib/content';
import type { TagCount } from '@/lib/tags';

interface BlogListPresenterProps {
  currentPage: number;
  posts: BaseContentMetadata[];
  searchQuery: string;
  selectedTags: string[];
  tagCounts: TagCount[];
  totalCount: number;
  totalPages: number;
}

const EMPTY_LENGTH = 0;

const useSearchParams = () =>
  useQueryStates(
    {
      page: parseAsString,
      search: parseAsString.withDefault(''),
      tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
    },
    { clearOnDefault: true, shallow: false }
  );

interface PageHeaderProps {
  description: string;
  title: string;
}

const PageHeader = ({ description, title }: PageHeaderProps) => (
  <div className="mb-12 text-center space-y-4">
    <h1 className="font-bold scroll-m-20 text-3xl text-foreground">{title}</h1>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
  </div>
);

interface EmptyResultMessageProps {
  hasFilters: boolean;
  isEmpty: boolean;
}

const EmptyResultMessage = ({ hasFilters, isEmpty }: EmptyResultMessageProps) => {
  if (!isEmpty || !hasFilters) {
    return null;
  }

  return (
    <Empty className="border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>記事が見つかりませんでした</EmptyTitle>
        <EmptyDescription>条件に一致する記事が見つかりませんでした</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

const getSearchValue = (value: string): string | null => {
  if (value) {
    return value;
  }
  return null;
};

const getNewTags = (selectedTags: string[], tag: string): string[] => {
  if (selectedTags.includes(tag)) {
    return selectedTags.filter((currentTag) => currentTag !== tag);
  }
  return [...selectedTags, tag];
};

const getTagsValue = (newTags: string[]): string[] | null => {
  if (newTags.length > EMPTY_LENGTH) {
    return newTags;
  }
  return null;
};

interface FilterSectionProps {
  currentPage: number;
  hasFilters: boolean;
  isEmpty: boolean;
  onSearchChange: (value: string) => void;
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  posts: BaseContentMetadata[];
  searchQuery: string;
  selectedTags: string[];
  tagCounts: TagCount[];
  totalCount: number;
  totalPages: number;
}

const FilterSection = ({
  currentPage,
  hasFilters,
  isEmpty,
  onSearchChange,
  onTagToggle,
  onClearFilters,
  posts,
  searchQuery,
  selectedTags,
  tagCounts,
  totalCount,
  totalPages,
}: FilterSectionProps) => (
  <div className="space-y-6">
    <TagFilterList onTagToggle={onTagToggle} selectedTags={selectedTags} tags={tagCounts} />
    <SearchInput onChange={onSearchChange} value={searchQuery} />
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p aria-live="polite" className="m-0">
        {totalCount}件の記事
        {selectedTags.length > 0 && `・${selectedTags.join(' または ')}`}
        {searchQuery && `・「${searchQuery}」を検索`}
      </p>
      {hasFilters && (
        <button
          className="text-foreground underline decoration-foreground/30 underline-offset-4"
          onClick={onClearFilters}
          type="button"
        >
          条件をすべて解除
        </button>
      )}
    </div>
    <PostList posts={posts} prioritizeFirst />
    <EmptyResultMessage hasFilters={hasFilters} isEmpty={isEmpty} />
    <Pagination
      basePath="/blog"
      currentPage={currentPage}
      query={{ search: searchQuery, tags: selectedTags }}
      totalPages={totalPages}
    />
  </div>
);

export const BlogListPresenter = ({
  currentPage,
  posts,
  searchQuery,
  selectedTags,
  tagCounts,
  totalCount,
  totalPages,
}: BlogListPresenterProps) => {
  const [, setSearchParams] = useSearchParams();

  const handleSearchChange = (value: string) => {
    const searchValue = getSearchValue(value);
    setSearchParams({ page: null, search: searchValue });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = getNewTags(selectedTags, tag);
    const tagsValue = getTagsValue(newTags);
    setSearchParams({ page: null, tags: tagsValue });
  };

  const handleClearFilters = () => setSearchParams({ page: null, search: null, tags: null });

  const hasFilters = Boolean(searchQuery) || selectedTags.length > EMPTY_LENGTH;
  const isEmpty = posts.length === EMPTY_LENGTH;

  return (
    <Container maxWidth="4xl">
      <div className="space-y-12">
        <PageHeader description="すべてのブログ記事" title={siteConfig.name} />

        <FilterSection
          currentPage={currentPage}
          hasFilters={hasFilters}
          isEmpty={isEmpty}
          onSearchChange={handleSearchChange}
          onTagToggle={handleTagToggle}
          onClearFilters={handleClearFilters}
          posts={posts}
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          tagCounts={tagCounts}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </Container>
  );
};
