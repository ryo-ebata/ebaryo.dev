export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const THUMBNAIL_VARIANTS = ['paper', 'sage', 'ink', 'indigo', 'plum'] as const;
export const THUMBNAIL_LAYOUTS = ['editorial', 'poster', 'split', 'frame'] as const;
export const THUMBNAIL_MOTIFS = ['native', 'orbit', 'grid', 'modules', 'rays'] as const;
export type ThumbnailVariant = (typeof THUMBNAIL_VARIANTS)[number];
export type ThumbnailLayout = (typeof THUMBNAIL_LAYOUTS)[number];
export type ThumbnailMotif = (typeof THUMBNAIL_MOTIFS)[number];
export type ThumbnailPresetId = 'classic' | 'essay' | 'night' | 'technical';

export interface ThumbnailPreset {
  description: string;
  id: ThumbnailPresetId;
  label: string;
  layout: ThumbnailLayout;
  variant: ThumbnailVariant;
}

export const THUMBNAIL_PRESETS: readonly ThumbnailPreset[] = [
  {
    description: '幅広い記事向け',
    id: 'classic',
    label: '標準',
    layout: 'editorial',
    variant: 'paper',
  },
  { description: '随筆・読書向け', id: 'essay', label: '随筆', layout: 'frame', variant: 'plum' },
  { description: 'AI・思考記事向け', id: 'night', label: '夜考', layout: 'poster', variant: 'ink' },
  {
    description: '技術解説向け',
    id: 'technical',
    label: '技術',
    layout: 'split',
    variant: 'indigo',
  },
] as const;

export interface OgImageParams {
  date?: string;
  layout?: ThumbnailLayout;
  motif?: ThumbnailMotif;
  title: string;
  subtitle?: string;
  variant?: ThumbnailVariant;
}

export const createOgImagePath = ({
  date,
  layout,
  motif,
  subtitle,
  title,
  variant,
}: OgImageParams): string => {
  const searchParams = new URLSearchParams({ title });
  if (subtitle) searchParams.set('subtitle', subtitle);
  if (date) searchParams.set('date', date.slice(0, 10));
  if (layout) searchParams.set('layout', layout);
  if (motif) searchParams.set('motif', motif);
  if (variant) searchParams.set('variant', variant);
  return `/og?${searchParams.toString()}`;
};

export const normalizeThumbnailVariant = (value: string | null): ThumbnailVariant =>
  THUMBNAIL_VARIANTS.includes(value as ThumbnailVariant) ? (value as ThumbnailVariant) : 'paper';

export const normalizeThumbnailLayout = (value: string | null): ThumbnailLayout =>
  THUMBNAIL_LAYOUTS.includes(value as ThumbnailLayout) ? (value as ThumbnailLayout) : 'editorial';

export const normalizeThumbnailMotif = (value: string | null): ThumbnailMotif =>
  THUMBNAIL_MOTIFS.includes(value as ThumbnailMotif) ? (value as ThumbnailMotif) : 'native';

export const getThumbnailTitleSize = (title: string, layout: ThumbnailLayout): number => {
  const length = Array.from(title).length;
  const baseSize = layout === 'poster' ? 68 : layout === 'split' ? 56 : 62;
  if (length > 72) return baseSize - 16;
  if (length > 48) return baseSize - 10;
  if (length > 28) return baseSize - 4;
  return baseSize;
};

export const recommendThumbnailPreset = (title: string, tags: string[]): ThumbnailPresetId => {
  const source = `${title} ${tags.join(' ')}`.toLowerCase();
  if (/(typescript|javascript|react|next\.js|css|開発|実装|技術|コード)/u.test(source))
    return 'technical';
  if (/(ai|claude|llm|思考|仕事術)/u.test(source)) return 'night';
  if (/(読書|本|旅|日記|随筆|ポエム|暮らし)/u.test(source)) return 'essay';
  return 'classic';
};

export const normalizeOgText = (
  value: string | null,
  fallback: string,
  maxLength: number
): string => (value?.trim() || fallback).slice(0, maxLength);
