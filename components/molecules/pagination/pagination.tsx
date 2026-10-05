'use client';

import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const FIRST_PAGE = 1;
const SINGLE_PAGE = 1;
const PAGE_OFFSET = 1;
const ELLIPSIS_OFFSET = 2;

interface PaginationProps {
  basePath: string;
  currentPage: number;
  query?: Record<string, string | string[]>;
  totalPages: number;
}

const getPageUrl = (
  basePath: string,
  page: number,
  query: Record<string, string | string[]> = {}
): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const normalized = Array.isArray(value) ? value.filter(Boolean).join(',') : value;
    if (normalized) searchParams.set(key, normalized);
  }
  if (page !== FIRST_PAGE) searchParams.set('page', String(page));
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

const shouldShowPage = (page: number, currentPage: number, totalPages: number): boolean => {
  const isFirstPage = page === FIRST_PAGE;
  const isLastPage = page === totalPages;
  const isNearCurrentPage = page >= currentPage - PAGE_OFFSET && page <= currentPage + PAGE_OFFSET;
  return isFirstPage || isLastPage || isNearCurrentPage;
};

const shouldShowEllipsis = (page: number, currentPage: number): boolean =>
  page === currentPage - ELLIPSIS_OFFSET || page === currentPage + ELLIPSIS_OFFSET;

const getPageVariant = (currentPage: number, page: number): 'default' | 'ghost' => {
  if (currentPage === page) {
    return 'default';
  }
  return 'ghost';
};

interface PageButtonProps {
  basePath: string;
  currentPage: number;
  page: number;
  query?: Record<string, string | string[]>;
}

const PageButton = ({ basePath, currentPage, page, query }: PageButtonProps) => (
  <Button
    variant={getPageVariant(currentPage, page)}
    size="icon-sm"
    aria-current={currentPage === page ? 'page' : undefined}
    render={<Link href={getPageUrl(basePath, page, query)} />}
  >
    {page}
  </Button>
);

interface PaginationItemProps {
  basePath: string;
  currentPage: number;
  page: number;
  query?: Record<string, string | string[]>;
  totalPages: number;
}

const PaginationItem = ({
  basePath,
  currentPage,
  page,
  query,
  totalPages,
}: PaginationItemProps) => {
  if (shouldShowPage(page, currentPage, totalPages)) {
    return (
      <PageButton
        key={page}
        basePath={basePath}
        currentPage={currentPage}
        page={page}
        query={query}
      />
    );
  }
  if (shouldShowEllipsis(page, currentPage)) {
    return (
      <span
        key={page}
        aria-hidden="true"
        className="flex size-8 items-center justify-center text-sm text-muted-foreground"
      >
        ...
      </span>
    );
  }
  return null;
};

export const Pagination = ({ basePath, currentPage, query, totalPages }: PaginationProps) => {
  if (totalPages <= SINGLE_PAGE) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_unused, index) => index + PAGE_OFFSET);

  return (
    <nav
      className={cn('mt-8 flex items-center justify-center gap-2')}
      aria-label="ページネーション"
    >
      {currentPage > FIRST_PAGE && (
        <Button
          variant="outline"
          size="sm"
          render={<Link href={getPageUrl(basePath, currentPage - PAGE_OFFSET, query)} />}
        >
          <ChevronLeft />
          前へ
        </Button>
      )}

      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <PaginationItem
            key={page}
            basePath={basePath}
            currentPage={currentPage}
            page={page}
            query={query}
            totalPages={totalPages}
          />
        ))}
      </div>

      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          render={<Link href={getPageUrl(basePath, currentPage + PAGE_OFFSET, query)} />}
        >
          次へ
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
};
