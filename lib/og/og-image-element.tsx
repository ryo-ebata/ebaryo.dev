import type { OgImageParams } from './og-params';
import { getThumbnailTitleSize, OG_IMAGE_SIZE } from './og-params';

const PALETTES = {
  ink: { accent: '#e8b85c', background: '#20211f', foreground: '#f7f5ef', muted: '#aaa9a3' },
  indigo: { accent: '#91b4ff', background: '#17213a', foreground: '#f7f8fc', muted: '#b6c2d8' },
  paper: { accent: '#2455d6', background: '#f7f6f2', foreground: '#262724', muted: '#777872' },
  plum: { accent: '#a66d77', background: '#f4e9e9', foreground: '#3d292e', muted: '#80666c' },
  sage: { accent: '#536b5b', background: '#e8eee8', foreground: '#263229', muted: '#6e7b72' },
} as const;

const Brand = ({ accent, label = 'ebaryo.dev' }: { accent: string; label?: string }) => (
  <div
    style={{
      alignItems: 'center',
      color: accent,
      display: 'flex',
      fontFamily: 'Noto Sans JP',
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    }}
  >
    <span
      style={{ background: accent, borderRadius: 99, height: 10, marginRight: 12, width: 10 }}
    />
    {label}
  </div>
);

const AlternateMotif = ({
  accent,
  motif,
}: {
  accent: string;
  motif: NonNullable<OgImageParams['motif']>;
}) => {
  const line = { fill: 'none', stroke: accent, strokeWidth: 3 } as const;
  if (motif === 'orbit') {
    return (
      <g>
        {[86, 156, 226, 296].map((radius) => (
          <circle {...line} cx="930" cy="325" key={radius} r={radius} />
        ))}
        <ellipse {...line} cx="930" cy="325" rx="348" ry="146" />
        <circle cx="634" cy="325" fill={accent} r="15" stroke="none" />
        <circle cx="1040" cy="98" fill={accent} r="9" stroke="none" />
      </g>
    );
  }
  if (motif === 'grid') {
    return (
      <g>
        {[90, 210, 330, 450, 570, 690, 810, 930, 1050, 1170].map((x) => (
          <line {...line} key={`gx-${x}`} x1={x} x2={x} y1="0" y2="630" />
        ))}
        {[75, 195, 315, 435, 555].map((y) => (
          <line {...line} key={`gy-${y}`} x1="0" x2="1200" y1={y} y2={y} />
        ))}
        <rect fill={accent} height="120" opacity="0.62" stroke="none" width="120" x="930" y="75" />
      </g>
    );
  }
  if (motif === 'modules') {
    return (
      <g>
        <rect {...line} height="210" width="210" x="850" y="90" />
        <rect fill={accent} height="104" opacity="0.72" stroke="none" width="104" x="956" y="196" />
        <circle {...line} cx="956" cy="405" r="105" />
        <circle fill={accent} cx="956" cy="405" opacity="0.7" r="34" stroke="none" />
        <rect fill={accent} height="24" opacity="0.88" stroke="none" width="240" x="710" y="520" />
        <rect {...line} height="70" width="70" x="1080" y="34" />
      </g>
    );
  }
  return (
    <g>
      {[
        [120, 0],
        [300, 0],
        [480, 0],
        [660, 0],
        [840, 0],
        [1020, 0],
        [1200, 80],
        [1200, 260],
        [1200, 440],
      ].map(([x, y]) => (
        <line {...line} key={`${x}-${y}`} x1="760" x2={x} y1="630" y2={y} />
      ))}
      <circle {...line} cx="760" cy="630" r="180" />
      <circle fill={accent} cx="760" cy="630" r="20" stroke="none" />
    </g>
  );
};

const GeometricBackdrop = ({
  accent,
  layout,
  motif,
}: Pick<OgImageParams, 'layout' | 'motif'> & { accent: string }) => {
  const common = {
    fill: 'none',
    stroke: accent,
    strokeWidth: 3,
  } as const;

  return (
    <svg
      aria-hidden="true"
      height={OG_IMAGE_SIZE.height}
      viewBox={`0 0 ${OG_IMAGE_SIZE.width} ${OG_IMAGE_SIZE.height}`}
      width={OG_IMAGE_SIZE.width}
      style={{ inset: 0, opacity: 0.3, position: 'absolute' }}
    >
      {motif && motif !== 'native' ? (
        AlternateMotif({ accent, motif })
      ) : layout === 'poster' ? (
        <g>
          <circle {...common} cx="600" cy="315" r="236" />
          <circle {...common} cx="600" cy="315" r="168" strokeDasharray="8 18" />
          <line {...common} x1="600" x2="600" y1="34" y2="596" />
          <line {...common} x1="320" x2="880" y1="315" y2="315" />
          <circle cx="600" cy="315" fill={accent} r="9" stroke="none" />
          <rect fill={accent} height="34" opacity="0.55" stroke="none" width="34" x="326" y="72" />
          <rect fill={accent} height="18" opacity="0.8" stroke="none" width="96" x="840" y="524" />
        </g>
      ) : layout === 'split' ? (
        <g>
          {[410, 520, 630, 740, 850, 960, 1070].map((x) => (
            <line {...common} key={`x-${x}`} x1={x} x2={x} y1="0" y2="630" />
          ))}
          {[95, 205, 315, 425, 535].map((y) => (
            <line {...common} key={`y-${y}`} x1="330" x2="1200" y1={y} y2={y} />
          ))}
          <rect fill={accent} height="74" opacity="0.65" stroke="none" width="74" x="1052" y="88" />
          <circle cx="410" cy="535" fill={accent} opacity="0.75" r="13" stroke="none" />
        </g>
      ) : layout === 'frame' ? (
        <g>
          <circle {...common} cx="1095" cy="526" r="132" />
          <circle {...common} cx="1095" cy="526" r="82" />
          <rect {...common} height="94" width="94" x="70" y="466" />
          <line {...common} x1="70" x2="164" y1="513" y2="513" />
          <line {...common} x1="117" x2="117" y1="466" y2="560" />
          <rect fill={accent} height="24" opacity="0.75" stroke="none" width="118" x="930" y="58" />
        </g>
      ) : (
        <g>
          <circle {...common} cx="1100" cy="535" r="230" />
          <circle {...common} cx="1100" cy="535" r="160" strokeDasharray="7 15" />
          <line {...common} x1="820" x2="1200" y1="535" y2="535" />
          <line {...common} x1="1100" x2="1100" y1="305" y2="630" />
          <rect fill={accent} height="22" opacity="0.9" stroke="none" width="22" x="106" y="518" />
          <rect fill={accent} height="10" opacity="0.8" stroke="none" width="126" x="905" y="404" />
        </g>
      )}
    </svg>
  );
};

export const OgImageElement = ({
  date,
  layout = 'editorial',
  motif = 'native',
  title,
  subtitle,
  variant = 'paper',
}: OgImageParams) => {
  const palette = PALETTES[variant];
  const titleSize = getThumbnailTitleSize(title, layout);
  const displayDate = /^\d{4}-\d{2}-\d{2}$/u.test(date ?? '')
    ? date?.replaceAll('-', '.')
    : undefined;

  if (layout === 'poster') {
    return (
      <div
        style={{
          alignItems: 'center',
          background: palette.background,
          color: palette.foreground,
          display: 'flex',
          flexDirection: 'column',
          height: OG_IMAGE_SIZE.height,
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '54px 76px 58px',
          position: 'relative',
          textAlign: 'center',
          width: OG_IMAGE_SIZE.width,
        }}
      >
        <GeometricBackdrop accent={palette.accent} layout={layout} motif={motif} />
        {displayDate ? (
          <div
            style={{
              color: palette.accent,
              display: 'flex',
              fontFamily: 'Noto Sans JP',
              fontSize: 210,
              fontWeight: 700,
              opacity: 0.08,
              position: 'absolute',
              right: 26,
              top: 130,
            }}
          >
            {displayDate.slice(0, 4)}
          </div>
        ) : null}
        <Brand accent={palette.accent} />
        <div
          style={{
            display: 'flex',
            fontFamily: 'Noto Sans JP',
            fontSize: titleSize,
            fontWeight: 700,
            letterSpacing: '-0.045em',
            lineHeight: 1.3,
            maxWidth: 1010,
          }}
        >
          {title}
        </div>
        <div
          style={{
            borderTop: `2px solid ${palette.accent}`,
            color: palette.muted,
            display: 'flex',
            fontFamily: 'Noto Sans JP',
            fontSize: 22,
            justifyContent: 'center',
            minWidth: 210,
            paddingTop: 16,
          }}
        >
          {subtitle}
          {displayDate ? ` / ${displayDate}` : ''}
        </div>
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <div
        style={{
          background: palette.background,
          color: palette.foreground,
          display: 'flex',
          height: OG_IMAGE_SIZE.height,
          overflow: 'hidden',
          position: 'relative',
          width: OG_IMAGE_SIZE.width,
        }}
      >
        <GeometricBackdrop accent={palette.accent} layout={layout} motif={motif} />
        <div
          style={{
            background: palette.accent,
            color: palette.background,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '62px 48px',
            width: 330,
          }}
        >
          <div
            style={{ display: 'flex', fontFamily: 'Noto Sans JP', fontSize: 24, fontWeight: 700 }}
          >
            ebaryo.dev
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Noto Sans JP',
              fontSize: 27,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
            {displayDate ? (
              <span style={{ display: 'flex', fontSize: 18, marginTop: 8, opacity: 0.72 }}>
                {displayDate}
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '68px 76px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: 'Noto Sans JP',
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.38,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            bottom: 44,
            display: 'flex',
            gap: 8,
            position: 'absolute',
            right: 54,
          }}
        >
          {[36, 20, 10].map((width) => (
            <span
              key={width}
              style={{ background: palette.accent, display: 'flex', height: 6, width }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'frame') {
    return (
      <div
        style={{
          background: palette.background,
          color: palette.foreground,
          display: 'flex',
          height: OG_IMAGE_SIZE.height,
          overflow: 'hidden',
          padding: 30,
          position: 'relative',
          width: OG_IMAGE_SIZE.width,
        }}
      >
        <GeometricBackdrop accent={palette.accent} layout={layout} motif={motif} />
        <div
          style={{
            border: `3px solid ${palette.accent}`,
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 58px 46px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Brand accent={palette.accent} />
            <div
              style={{
                color: palette.muted,
                display: 'flex',
                fontFamily: 'Noto Sans JP',
                fontSize: 20,
              }}
            >
              {subtitle}
              {displayDate ? ` / ${displayDate}` : ''}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Noto Sans JP',
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.36,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ background: palette.accent, display: 'flex', height: 8, width: 72 }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        alignItems: 'flex-start',
        background: palette.background,
        display: 'flex',
        flexDirection: 'column',
        height: OG_IMAGE_SIZE.height,
        justifyContent: 'space-between',
        overflow: 'hidden',
        padding: '64px 76px 58px',
        position: 'relative',
        width: OG_IMAGE_SIZE.width,
      }}
    >
      <GeometricBackdrop accent={palette.accent} layout={layout} motif={motif} />
      <div
        style={{
          background: palette.accent,
          display: 'flex',
          height: 10,
          position: 'absolute',
          left: 0,
          top: 0,
          width: 240,
        }}
      />
      <Brand accent={palette.accent} />
      <div
        style={{
          color: palette.foreground,
          display: 'flex',
          fontFamily: 'Noto Sans JP',
          fontSize: titleSize,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.35,
          maxWidth: 1020,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            color: palette.muted,
            display: 'flex',
            fontFamily: 'Noto Sans JP',
            fontSize: 22,
          }}
        >
          {subtitle}
          {displayDate ? ` / ${displayDate}` : ''}
        </div>
      ) : null}
    </div>
  );
};
