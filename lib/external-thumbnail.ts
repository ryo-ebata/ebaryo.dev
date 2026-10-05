import type { QiitaArticle } from './external/qiita';
import type { ZennArticle } from './external/zenn';

export type ExternalArticleSource = 'qiita' | 'zenn';
export type ExternalArticleItem =
  | { article: ZennArticle; type: 'zenn' }
  | { article: QiitaArticle; type: 'qiita' };

export const createExternalThumbnailPath = (
  source: ExternalArticleSource,
  id: number | string
): string => `/external-thumbnails/${source}/${id}`;
