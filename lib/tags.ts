import type { BaseContentMetadata } from './content';

const INITIAL_COUNT = 0;
const INCREMENT = 1;

export interface TagCount {
  count: number;
  tag: string;
}

const compareByCount = (itemA: TagCount, itemB: TagCount) => itemB.count - itemA.count;

export const aggregateTags = (posts: BaseContentMetadata[]): TagCount[] => {
  const tagMap = new Map<string, number>();

  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        tagMap.set(tag, (tagMap.get(tag) ?? INITIAL_COUNT) + INCREMENT);
      }
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ count, tag }))
    .sort(compareByCount);
};

export const filterPostsByTags = <Post extends BaseContentMetadata>(
  posts: Post[],
  tags: string[]
): Post[] => {
  if (tags.length === INITIAL_COUNT) {
    return posts;
  }

  return posts.filter((post) => {
    if (!post.tags) {
      return false;
    }
    return tags.some((tag) => post.tags?.includes(tag));
  });
};
