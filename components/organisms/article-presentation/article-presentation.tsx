import type { ReactNode } from 'react';
import type { BaseContentMetadata } from '@/lib/content';
import { Separator } from '@/components/atoms/separator';
import { PostHeader } from '@/components/organisms/post-header/post-header';

interface ArticlePresentationProps {
  beforeContent?: ReactNode;
  children: ReactNode;
  metadata: BaseContentMetadata;
}

export const ArticlePresentation = ({
  beforeContent,
  children,
  metadata,
}: ArticlePresentationProps) => (
  <div className="mx-auto w-full max-w-3xl">
    <PostHeader metadata={metadata} />
    <Separator />
    {beforeContent}
    <article
      data-article-body
      className="prose prose-neutral dark:prose-invert mx-auto max-w-[42rem]"
    >
      {children}
    </article>
  </div>
);
