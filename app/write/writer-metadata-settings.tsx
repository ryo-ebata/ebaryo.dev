'use client';

import { siteConfig } from '@/config/site';
import type { createAutomaticSeo } from '@/lib/writer-seo';
import type { getSeoLengthState, PublicationMode } from '@/lib/writer-publishing';
import type { ArticleSummary, DraftState } from './writer-model';
import { WriterTagPicker } from './writer-tag-picker';
import styles from './writer-metadata-settings.module.css';

interface WriterMetadataSettingsProps {
  article: DraftState;
  articles: ArticleSummary[];
  automaticSeo: ReturnType<typeof createAutomaticSeo>;
  currentSlug?: string;
  descriptionState: ReturnType<typeof getSeoLengthState>;
  onApplyAutomaticSeo: () => void;
  onChangePublicationMode: (mode: PublicationMode) => void;
  onTagLimit: () => void;
  onUpdate: <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => void;
  publicationMode: PublicationMode;
  publicUrl: string;
  seoTitleState: ReturnType<typeof getSeoLengthState>;
  today: string;
}

export const WriterMetadataSettings = ({
  article,
  articles,
  automaticSeo,
  currentSlug,
  descriptionState,
  onApplyAutomaticSeo,
  onChangePublicationMode,
  onTagLimit,
  onUpdate,
  publicationMode,
  publicUrl,
  seoTitleState,
  today,
}: WriterMetadataSettingsProps) => (
  <>
    <div>
      <h2>保存先</h2>
      <label>
        スラッグ
        <input
          disabled={Boolean(currentSlug)}
          onChange={(event) => onUpdate('slug', event.target.value)}
          placeholder="my-new-article"
          value={article.slug}
        />
      </label>
    </div>
    <div>
      <h2>公開状態</h2>
      <div className={styles.publicationModes} role="group" aria-label="公開状態">
        {(
          [
            ['draft', '下書き', '検索・一覧へ出さない'],
            ['published', '今すぐ公開', '保存後すぐ公開対象'],
            ['scheduled', '予約公開', '指定日まで非公開'],
          ] as const
        ).map(([mode, label, description]) => (
          <button
            aria-pressed={publicationMode === mode}
            key={mode}
            onClick={() => onChangePublicationMode(mode)}
            type="button"
          >
            <strong>{label}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      <label>
        {publicationMode === 'scheduled' ? '公開予定日' : '公開日'}
        <input
          min={publicationMode === 'scheduled' ? today : undefined}
          onChange={(event) => onUpdate('createdAt', event.target.value)}
          type="date"
          value={article.createdAt}
        />
        <small>
          {publicationMode === 'scheduled'
            ? `${article.createdAt}の00:00 UTC以降に公開対象になる。`
            : '初回公開日として記事と構造化データへ表示する。'}
        </small>
      </label>
      {article.updatedAt && (
        <div className={styles.metadataRow}>
          <span>最終更新</span>
          <time dateTime={article.updatedAt}>
            {new Intl.DateTimeFormat('ja-JP', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(article.updatedAt))}
          </time>
        </div>
      )}
      <div className={styles.publicationSummary} data-mode={publicationMode}>
        <strong>
          {publicationMode === 'draft'
            ? '非公開の下書き'
            : publicationMode === 'scheduled'
              ? `${article.createdAt}に公開予定`
              : '公開対象の記事'}
        </strong>
        <span>
          {article.noindex || publicationMode !== 'published'
            ? '検索エンジンへは登録しない'
            : '検索エンジンへ登録できる'}
        </span>
      </div>
    </div>
    <div>
      <h2>記事情報</h2>
      <WriterTagPicker
        articles={articles}
        onChange={(value) => onUpdate('tags', value)}
        onLimit={onTagLimit}
        value={article.tags}
      />
      <label>
        説明
        <textarea
          maxLength={240}
          onChange={(event) => onUpdate('description', event.target.value)}
          placeholder="一覧と検索結果に表示する説明"
          rows={4}
          value={article.description}
        />
        <small data-state={descriptionState}>
          {automaticSeo.description.length}/160文字目安
          {descriptionState === 'short' && '・検索結果には短め'}
          {descriptionState === 'good' && '・適切な長さ'}
          {descriptionState === 'long' && '・検索結果では省略される可能性'}
        </small>
      </label>
    </div>
    <details className={styles.advancedSettings}>
      <summary>検索と共有の詳細</summary>
      <div className={styles.advancedSettingsBody}>
        <div className={styles.autoSeoIntro}>
          <p>空欄はタイトルと本文から保存時に自動設定する。</p>
          <button onClick={onApplyAutomaticSeo} type="button">
            自動設定を反映
          </button>
        </div>
        <label>
          SEOタイトル
          <input
            maxLength={60}
            onChange={(event) => onUpdate('seoTitle', event.target.value)}
            placeholder={automaticSeo.seoTitle || '記事タイトルから自動設定'}
            value={article.seoTitle}
          />
          <small data-state={seoTitleState}>
            {automaticSeo.seoTitle.length}/60文字
            {seoTitleState === 'short' && '・やや短い'}
            {seoTitleState === 'good' && '・適切な長さ'}
          </small>
        </label>
        <label>
          canonical URL
          <input
            inputMode="url"
            onChange={(event) => onUpdate('canonicalUrl', event.target.value)}
            placeholder={`${siteConfig.url}/blog/${article.slug || 'article-slug'}`}
            type="url"
            value={article.canonicalUrl}
          />
          <small>
            空欄なら {siteConfig.url}/blog/{article.slug || 'article-slug'} を使用する。
          </small>
        </label>
        <label className={styles.toggle}>
          <input
            checked={article.noindex}
            onChange={(event) => onUpdate('noindex', event.target.checked)}
            type="checkbox"
          />
          公開後も検索結果に表示しない
        </label>
        {(publicationMode !== 'published' || article.noindex) && (
          <p className={styles.automaticNoindex}>
            {article.noindex
              ? '明示的にnoindexを設定している。'
              : '下書き・予約投稿は公開対象にならない。'}
          </p>
        )}
        <div className={styles.publicUrlPreview}>
          <span>最終URL</span>
          <code>{publicUrl}</code>
          {article.canonicalUrl && (
            <small>このブログのURLではなく、canonical URLを正規URLとして扱う。</small>
          )}
        </div>
        <div className={styles.searchPreview}>
          <span>{publicUrl.replace(/^https?:\/\//u, '')}</span>
          <strong>{automaticSeo.seoTitle || '記事タイトル'}</strong>
          <p>{automaticSeo.description || '本文を書くと説明を自動生成する。'}</p>
        </div>
      </div>
    </details>
  </>
);
