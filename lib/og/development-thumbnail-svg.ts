import type { OgImageParams } from './og-params';
import { getThumbnailTitleSize } from './og-params';

const MAX_TITLE_LINES = 4;

const palettes = {
  ink: { accent: '#e8b85c', background: '#20211f', foreground: '#f7f5ef', muted: '#aaa9a3' },
  indigo: { accent: '#91b4ff', background: '#17213a', foreground: '#f7f8fc', muted: '#b6c2d8' },
  paper: { accent: '#2455d6', background: '#f7f6f2', foreground: '#262724', muted: '#777872' },
  plum: { accent: '#a66d77', background: '#f4e9e9', foreground: '#3d292e', muted: '#80666c' },
  sage: { accent: '#536b5b', background: '#e8eee8', foreground: '#263229', muted: '#6e7b72' },
} as const;

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const splitTitle = (title: string, maxLineLength: number): string[] => {
  const characters = Array.from(title);
  const lines = Array.from({ length: MAX_TITLE_LINES }, (_, index) =>
    characters.slice(index * maxLineLength, (index + 1) * maxLineLength).join('')
  ).filter(Boolean);

  if (characters.length > maxLineLength * MAX_TITLE_LINES) {
    lines[MAX_TITLE_LINES - 1] = `${lines[MAX_TITLE_LINES - 1]?.slice(0, -1) ?? ''}…`;
  }
  return lines;
};

export const createDevelopmentThumbnailSvg = ({
  date,
  layout = 'editorial',
  subtitle,
  title,
  variant = 'paper',
}: {
  date?: string;
  layout?: NonNullable<OgImageParams['layout']>;
  subtitle: string;
  title: string;
  variant?: NonNullable<OgImageParams['variant']>;
}): string => {
  const palette = palettes[variant];
  const isSplit = layout === 'split';
  const titleX = isSplit ? 390 : 86;
  const titleY = isSplit ? 190 : 214;
  const titleWidth = isSplit ? 724 : 1028;
  const titleSize = getThumbnailTitleSize(title, layout);
  const titleLineHeight = Math.round(titleSize * 1.28);
  const maxLineLength = Math.max(8, Math.floor(titleWidth / titleSize));
  const titleLines = splitTitle(title, maxLineLength);
  const titleElements = titleLines
    .map(
      (line, index) =>
        `<text x="${titleX}" y="${titleY + index * titleLineHeight}" class="title">${escapeXml(line)}</text>`
    )
    .join('');
  const metadata = date ? `${subtitle} / ${date.replaceAll('-', '.')}` : subtitle;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${palette.background}"/>
  ${isSplit ? `<rect width="330" height="630" fill="${palette.accent}"/>` : ''}
  <g fill="none" stroke="${palette.accent}" stroke-width="3" opacity=".28">
    <circle cx="1090" cy="525" r="225"/><circle cx="1090" cy="525" r="155" stroke-dasharray="8 16"/>
    <path d="M810 525h390M1090 300v330"/>
  </g>
  <rect x="86" y="82" width="16" height="16" fill="${isSplit ? palette.background : palette.accent}"/>
  <text x="120" y="99" class="brand">ebaryo.dev</text>
  <style>
    text { font-family: "Noto Sans JP", "Hiragino Sans", sans-serif; }
    .brand { fill: ${isSplit ? palette.background : palette.accent}; font-size: 24px; font-weight: 700; }
    .title { fill: ${palette.foreground}; font-size: ${titleSize}px; font-weight: 700; letter-spacing: -.04em; }
    .meta { fill: ${isSplit ? palette.background : palette.muted}; font-size: 22px; font-weight: 700; }
  </style>
  ${titleElements}
  <path d="M86 528h${isSplit ? 190 : 260}" stroke="${isSplit ? palette.background : palette.accent}" stroke-width="2"/>
  <text x="86" y="572" class="meta">${escapeXml(metadata)}</text>
</svg>`;
};
