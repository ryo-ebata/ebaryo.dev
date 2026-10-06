'use client';

import { ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { siteConfig } from '@/config/site';
import { getThemesForTags } from '@/lib/themes';
import {
  createOgImagePath,
  recommendThumbnailPreset,
  THUMBNAIL_PRESETS,
  type ThumbnailLayout,
  type ThumbnailMotif,
  type ThumbnailVariant,
} from '@/lib/og/og-params';
import { type DraftState, parseWriterTags } from './writer-model';
import styles from './writer-thumbnail-settings.module.css';

interface ThumbnailGenerationOptions {
  date: string;
  layout: ThumbnailLayout;
  motif: ThumbnailMotif;
  subtitle: string;
  title: string;
  variant: ThumbnailVariant;
}

interface WriterThumbnailSettingsProps {
  article: DraftState;
  automaticTitle: string;
  isGenerating: boolean;
  onGenerate: (options: ThumbnailGenerationOptions) => Promise<unknown> | void;
  onUpdateEyecatch: (eyecatch: DraftState['eyecatch']) => void;
  onUploadEyecatch: (file: File) => Promise<void> | void;
}

const layouts = [
  ['editorial', '余白'],
  ['poster', '中央'],
  ['split', '分割'],
  ['frame', '囲み'],
] as const;

const motifs = [
  ['native', '構図固有'],
  ['orbit', '軌道'],
  ['grid', '格子'],
  ['modules', '積木'],
  ['rays', '放射'],
] as const;

const variants = [
  ['paper', '生成り'],
  ['sage', 'セージ'],
  ['ink', '墨'],
  ['indigo', '藍'],
  ['plum', '梅'],
] as const;

export const WriterThumbnailSettings = ({
  article,
  automaticTitle,
  isGenerating,
  onGenerate,
  onUpdateEyecatch,
  onUploadEyecatch,
}: WriterThumbnailSettingsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<ThumbnailLayout>('editorial');
  const [motif, setMotif] = useState<ThumbnailMotif>('native');
  const [subtitleOverride, setSubtitleOverride] = useState('');
  const [variant, setVariant] = useState<ThumbnailVariant>('paper');
  const tags = parseWriterTags(article.tags);
  const automaticSubtitle = getThemesForTags(tags)[0]?.name ?? siteConfig.name;
  const subtitle = subtitleOverride.trim() || automaticSubtitle;
  const recommendedPreset = recommendThumbnailPreset(article.title, tags);
  const activePreset = THUMBNAIL_PRESETS.find(
    (preset) => preset.layout === layout && preset.variant === variant && motif === 'native'
  )?.id;
  const eyecatch = article.eyecatch;
  const previewUrl = createOgImagePath({
    date: article.createdAt,
    layout,
    motif,
    subtitle,
    title: automaticTitle || article.title || '記事タイトル',
    variant,
  });
  const eyecatchUrl = eyecatch?.url
    ? /^(?:https?:|\/|data:)/u.test(eyecatch.url)
      ? eyecatch.url
      : `/blog-assets/${article.slug}/${eyecatch.url}`
    : undefined;

  return (
    <div>
      <h2>サムネイル</h2>
      <div className={styles.thumbnailGenerator}>
        <div className={styles.thumbnailPreview}>
          <img alt="自動生成サムネイルのプレビュー" src={previewUrl} />
          <span>1200 × 630</span>
        </div>
        <fieldset className={styles.thumbnailPresets}>
          <legend>記事に合うスタイル</legend>
          <div>
            {THUMBNAIL_PRESETS.map((preset) => (
              <button
                aria-pressed={activePreset === preset.id}
                data-preset={preset.id}
                key={preset.id}
                onClick={() => {
                  setLayout(preset.layout);
                  setMotif('native');
                  setVariant(preset.variant);
                }}
                type="button"
              >
                <span className={styles.presetVisual} aria-hidden="true" />
                <span>
                  <strong>{preset.label}</strong>
                  <small>{preset.description}</small>
                </span>
                {recommendedPreset === preset.id && <em>おすすめ</em>}
              </button>
            ))}
          </div>
        </fieldset>
        <details className={styles.thumbnailAdvanced}>
          <summary>構図と配色を個別に調整</summary>
          <fieldset className={styles.thumbnailChoices}>
            <legend>構図</legend>
            <div className={styles.thumbnailLayouts}>
              {layouts.map(([value, label]) => (
                <button
                  aria-pressed={layout === value}
                  data-layout={value}
                  key={value}
                  onClick={() => setLayout(value)}
                  type="button"
                >
                  <span aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.thumbnailChoices}>
            <legend>幾何模様</legend>
            <div className={styles.thumbnailMotifs}>
              {motifs.map(([value, label]) => (
                <button
                  aria-pressed={motif === value}
                  data-motif={value}
                  key={value}
                  onClick={() => setMotif(value)}
                  type="button"
                >
                  <span aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.thumbnailChoices}>
            <legend>配色</legend>
            <div className={styles.thumbnailVariants}>
              {variants.map(([value, label]) => (
                <button
                  aria-pressed={variant === value}
                  data-variant={value}
                  key={value}
                  onClick={() => setVariant(value)}
                  type="button"
                >
                  <span aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </details>
        <label className={styles.thumbnailSubtitle}>
          <span>補助テキスト</span>
          <input
            maxLength={80}
            onChange={(event) => setSubtitleOverride(event.target.value)}
            placeholder={automaticSubtitle}
            value={subtitleOverride}
          />
        </label>
        <button
          className={styles.generateThumbnailButton}
          disabled={isGenerating || !article.title.trim() || !article.slug.trim()}
          onClick={() =>
            void onGenerate({
              date: article.createdAt,
              layout,
              motif,
              subtitle,
              title: automaticTitle || article.title,
              variant,
            })
          }
          type="button"
        >
          {isGenerating ? '生成中...' : 'このデザインで自動生成'}
        </button>
        <small>文字量に合わせて自動組版し、1200×630pxのPNGを記事へ保存する。</small>
      </div>
      <div className={styles.eyecatchField}>
        {eyecatchUrl ? (
          <img alt="記事のサムネイル" src={eyecatchUrl} />
        ) : (
          <div className={styles.eyecatchEmpty}>
            <ImagePlus />
            <span>画像は未設定</span>
          </div>
        )}
        <div>
          <button onClick={() => fileInputRef.current?.click()} type="button">
            {eyecatch ? '画像を変更' : '画像を選ぶ'}
          </button>
          <input
            ref={fileInputRef}
            accept="image/gif,image/jpeg,image/png,image/webp"
            aria-label={eyecatch ? '画像を変更' : '画像を選ぶ'}
            className={styles.fileInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUploadEyecatch(file);
              event.target.value = '';
            }}
            type="file"
          />
          {eyecatch && (
            <button onClick={() => onUpdateEyecatch(null)} type="button">
              削除
            </button>
          )}
        </div>
        {eyecatch && (
          <label>
            代替テキスト
            <input
              maxLength={160}
              onChange={(event) => onUpdateEyecatch({ ...eyecatch, alt: event.target.value })}
              placeholder="画像の内容を簡潔に説明"
              value={eyecatch.alt ?? ''}
            />
          </label>
        )}
      </div>
    </div>
  );
};
