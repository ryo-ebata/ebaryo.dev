import type { ExternalArticleSource } from '@/lib/external-thumbnail';
import { getThumbnailTitleSize, OG_IMAGE_SIZE } from './og-params';

const MEDIA = {
  qiita: {
    accent: '#55c500',
    background: '#f4faef',
    foreground: '#3d4040',
    label: 'Qiita',
    muted: '#687067',
  },
  zenn: {
    accent: '#3ea8ff',
    background: '#edf7ff',
    foreground: '#1f2937',
    label: 'Zenn',
    muted: '#617083',
  },
} as const;

const MAX_DISPLAY_TITLE_LENGTH = 54;

const truncateTitle = (title: string): string => {
  const characters = Array.from(title);
  if (characters.length <= MAX_DISPLAY_TITLE_LENGTH) return title;
  return `${characters.slice(0, MAX_DISPLAY_TITLE_LENGTH - 1).join('')}…`;
};

interface ExternalArticleThumbnailProps {
  date?: string;
  logoSrc: string;
  source: ExternalArticleSource;
  title: string;
}

const MediaGeometry = ({ source }: { source: ExternalArticleSource }) => {
  const color = MEDIA[source].accent;

  if (source === 'zenn') {
    return (
      <svg
        aria-hidden="true"
        height={OG_IMAGE_SIZE.height}
        viewBox="0 0 1200 630"
        width={OG_IMAGE_SIZE.width}
        style={{ inset: 0, position: 'absolute' }}
      >
        <g fill="none" stroke={color} strokeWidth="3" opacity="0.25">
          <path d="m760 74 356 0-178 154Z" />
          <path d="m760 188 356 0-178 154Z" />
          <path d="m760 302 356 0-178 154Z" />
          <path d="m760 416 356 0-178 154Z" />
          <circle cx="938" cy="302" r="244" strokeDasharray="8 16" />
        </g>
        <circle cx="938" cy="302" fill={color} opacity="0.12" r="108" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      height={OG_IMAGE_SIZE.height}
      viewBox="0 0 1200 630"
      width={OG_IMAGE_SIZE.width}
      style={{ inset: 0, position: 'absolute' }}
    >
      <g fill="none" stroke={color} strokeWidth="3" opacity="0.22">
        {[760, 870, 980, 1090].map((x) => (
          <line key={x} x1={x} x2={x} y1="72" y2="558" />
        ))}
        {[72, 180, 288, 396, 504].map((y) => (
          <line key={y} x1="706" x2="1200" y1={y} y2={y} />
        ))}
        <circle cx="870" cy="288" r="162" />
        <circle cx="870" cy="288" r="90" strokeDasharray="9 14" />
      </g>
      <rect fill={color} height="108" opacity="0.12" width="108" x="1036" y="396" />
      <circle cx="760" cy="504" fill={color} opacity="0.72" r="12" />
    </svg>
  );
};

export const ExternalArticleThumbnail = ({
  date,
  logoSrc,
  source,
  title,
}: ExternalArticleThumbnailProps) => {
  const media = MEDIA[source];
  const displayTitle = truncateTitle(title);
  const titleSize = Math.min(getThumbnailTitleSize(displayTitle, 'editorial'), 62);
  const displayDate = date?.slice(0, 10).replaceAll('-', '.');

  return (
    <div
      style={{
        background: media.background,
        color: media.foreground,
        display: 'flex',
        height: OG_IMAGE_SIZE.height,
        overflow: 'hidden',
        position: 'relative',
        width: OG_IMAGE_SIZE.width,
      }}
    >
      <MediaGeometry source={source} />
      <div
        style={{
          background: media.accent,
          display: 'flex',
          height: '100%',
          left: 0,
          position: 'absolute',
          top: 0,
          width: 18,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '58px 72px 54px 82px',
          position: 'relative',
          width: 790,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 24 }}>
          <div
            style={{
              alignItems: 'center',
              background: '#ffffff',
              border: `1px solid ${media.accent}33`,
              display: 'flex',
              height: 92,
              justifyContent: 'center',
              width: 92,
            }}
          >
            <img alt="" src={logoSrc} style={{ height: 54, width: 54 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                color: media.accent,
                display: 'flex',
                fontFamily: 'Noto Sans JP',
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {media.label}
            </span>
            <span
              style={{
                color: media.muted,
                display: 'flex',
                fontFamily: 'Noto Sans JP',
                fontSize: 18,
                marginTop: 4,
              }}
            >
              published article
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Noto Sans JP',
            fontSize: titleSize,
            fontWeight: 700,
            letterSpacing: '-0.045em',
            lineHeight: 1.3,
          }}
        >
          {displayTitle}
        </div>

        <div
          style={{
            alignItems: 'center',
            borderTop: `2px solid ${media.accent}`,
            color: media.muted,
            display: 'flex',
            fontFamily: 'Noto Sans JP',
            fontSize: 20,
            justifyContent: 'space-between',
            paddingTop: 16,
          }}
        >
          <span>ebaryo.dev / external writing</span>
          {displayDate ? <span>{displayDate}</span> : null}
        </div>
      </div>
    </div>
  );
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const splitTitle = (title: string): string[] => {
  const characters = Array.from(title);
  const lineLength = title.length > 48 ? 16 : 18;
  const lines = Array.from({ length: 3 }, (_, index) =>
    characters.slice(index * lineLength, (index + 1) * lineLength).join('')
  ).filter(Boolean);
  if (characters.length > lineLength * 3) {
    lines[2] = `${lines[2]?.slice(0, -1) ?? ''}…`;
  }
  return lines;
};

export const createExternalArticleThumbnailSvg = ({
  date,
  logoSrc,
  source,
  title,
}: ExternalArticleThumbnailProps): string => {
  const media = MEDIA[source];
  const titleLines = splitTitle(truncateTitle(title))
    .map(
      (line, index) =>
        `<text x="82" y="${292 + index * 78}" class="title">${escapeXml(line)}</text>`
    )
    .join('');
  const geometry =
    source === 'zenn'
      ? '<path d="m760 74 356 0-178 154Zm0 114 356 0-178 154Zm0 114 356 0-178 154Zm0 114 356 0-178 154Z"/><circle cx="938" cy="302" r="244" stroke-dasharray="8 16"/>'
      : '<path d="M760 72v486M870 72v486M980 72v486M1090 72v486M706 180h494M706 288h494M706 396h494M706 504h494"/><circle cx="870" cy="288" r="162"/><circle cx="870" cy="288" r="90" stroke-dasharray="9 14"/>';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${media.background}"/>
  <rect width="18" height="630" fill="${media.accent}"/>
  <g fill="none" stroke="${media.accent}" stroke-width="3" opacity=".22">${geometry}</g>
  <rect x="82" y="58" width="92" height="92" fill="#fff" stroke="${media.accent}" stroke-opacity=".2"/>
  <image href="${logoSrc}" x="101" y="77" width="54" height="54" preserveAspectRatio="xMidYMid meet"/>
  <text x="198" y="99" class="media">${media.label}</text>
  <text x="198" y="129" class="sub">published article</text>
  ${titleLines}
  <path d="M82 548h626" stroke="${media.accent}" stroke-width="2"/>
  <text x="82" y="588" class="meta">ebaryo.dev / external writing</text>
  ${date ? `<text x="590" y="588" class="date">${escapeXml(date.slice(0, 10).replaceAll('-', '.'))}</text>` : ''}
  <style>
    text { font-family: "Noto Sans JP", "Hiragino Sans", sans-serif; }
    .media { fill: ${media.accent}; font-size: 30px; font-weight: 700; }
    .sub, .meta, .date { fill: ${media.muted}; font-size: 18px; }
    .title { fill: ${media.foreground}; font-size: 58px; font-weight: 700; letter-spacing: -.04em; }
    .date { text-anchor: end; }
  </style>
</svg>`;
};
