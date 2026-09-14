// Kept within the top ~30% band (below the header, above where the
// heading/paragraph text starts) so they never overlap real content —
// the brand panel's height varies a lot between desktop and the
// auto-height mobile layout, so percentages spread across the full
// height are not safe here.
const DATASET_TAGS = [
  { label: 'Bolsas Atleta', top: '15%', left: '4%', delay: '0s' },
  { label: 'Infraestrutura', top: '10%', left: '64%', delay: '1.5s' },
  { label: 'Patrocínio', top: '27%', left: '46%', delay: '2.2s' },
  { label: 'Atletas', top: '19%', left: '80%', delay: '1.2s' },
  { label: 'Eventos', top: '30%', left: '20%', delay: '0.8s' },
]

const STREAM_PATHS = [
  { d: 'M -20 60 C 80 20, 160 100, 260 40 S 420 80, 520 30', duration: '4.2s', width: 1.4 },
  { d: 'M -20 160 C 100 200, 180 120, 280 170 S 440 140, 520 190', duration: '5s', width: 1.1 },
  { d: 'M -20 260 C 90 230, 190 290, 290 250 S 430 220, 520 270', duration: '3.8s', width: 1.6 },
  { d: 'M -20 340 C 110 380, 200 320, 300 360 S 450 400, 520 350', duration: '4.6s', width: 1 },
]

/** Purely decorative: animated data-stream SVG + a dotted grid + floating
 * dataset name tags, used as the backdrop of the brand panel on the login
 * screen. Hidden from assistive tech since it carries no information. */
export function OpenDataViz() {
  return (
    <div className="data-viz" aria-hidden="true">
      <div className="data-grid" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#73c7fb" stopOpacity="0" />
            <stop offset="50%" stopColor="#73c7fb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#73c7fb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="streamGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9fdcff" stopOpacity="0" />
            <stop offset="50%" stopColor="#9fdcff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9fdcff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {STREAM_PATHS.map((path, idx) => (
          <path
            key={idx}
            d={path.d}
            stroke={idx % 2 === 0 ? 'url(#streamGrad)' : 'url(#streamGrad2)'}
            strokeWidth={path.width}
            strokeLinecap="round"
            strokeDasharray="6 10"
            className="stream-path"
            style={{ animationDuration: path.duration }}
          />
        ))}
      </svg>

      {DATASET_TAGS.map((tag) => (
        <span
          key={tag.label}
          className="dataset-tag"
          style={{ top: tag.top, left: tag.left, animationDelay: tag.delay }}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}
