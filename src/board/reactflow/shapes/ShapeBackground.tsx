import type { NodeShapeVariant, VisualProvider, AccentColorToken } from '@/domain/models/node-appearance'
import type { SemanticNodeType } from '@/domain/models/semantic-node'

interface ShapeBackgroundProps {
  width: number
  height: number
  variant: NodeShapeVariant
  accentColor: AccentColorToken
  provider: VisualProvider
  semanticType: SemanticNodeType
  hasChildBoard: boolean
  hasValidationErrors: boolean
}

// Semantic type to header color mapping
const SEMANTIC_TYPE_COLORS: Record<string, string> = {
  // N1 types
  system: '#3b82f6',           // Blue
  container_service: '#3b82f6', // Blue
  database: '#22c55e',          // Green
  external_system: '#e11d48',   // Rose/Red
  // N2 types
  port: '#14b8a6',              // Teal
  adapter: '#14b8a6',           // Teal
  decision: '#f97316',          // Orange
  free_note_input: '#64748b',   // Slate
  free_note_output: '#64748b',  // Slate
  class: '#6366f1',             // Indigo
  interface: '#a855f7',         // Purple
  api_contract: '#0ea5e9',      // Sky
  // N3 types
  method: '#8b5cf6',            // Violet
  attribute: '#06b6d4'          // Cyan
}

const ACCENT_COLOR_MAP: Record<AccentColorToken, { fill: string; stroke: string }> = {
  cyan: { fill: 'rgba(34, 211, 238, 0.08)', stroke: 'rgba(34, 211, 238, 0.4)' },
  teal: { fill: 'rgba(45, 212, 191, 0.08)', stroke: 'rgba(45, 212, 191, 0.4)' },
  amber: { fill: 'rgba(251, 191, 36, 0.08)', stroke: 'rgba(251, 191, 36, 0.4)' },
  gray: { fill: 'rgba(156, 163, 175, 0.08)', stroke: 'rgba(156, 163, 175, 0.4)' },
  indigo: { fill: 'rgba(129, 140, 248, 0.08)', stroke: 'rgba(129, 140, 248, 0.4)' },
  orange: { fill: 'rgba(251, 146, 60, 0.08)', stroke: 'rgba(251, 146, 60, 0.4)' },
  blue: { fill: 'rgba(59, 130, 246, 0.08)', stroke: 'rgba(59, 130, 246, 0.4)' },
  purple: { fill: 'rgba(168, 85, 247, 0.08)', stroke: 'rgba(168, 85, 247, 0.4)' },
  green: { fill: 'rgba(34, 197, 94, 0.08)', stroke: 'rgba(34, 197, 94, 0.4)' },
  neutral: { fill: 'rgba(163, 163, 163, 0.08)', stroke: 'rgba(163, 163, 163, 0.4)' }
}

const HEADER_HEIGHT = 10

export function ShapeBackground({
  width,
  height,
  variant,
  accentColor,
  semanticType,
  hasChildBoard,
  hasValidationErrors
}: ShapeBackgroundProps): JSX.Element {
  const w = width
  const h = height
  const headerColor = SEMANTIC_TYPE_COLORS[semanticType] ?? '#64748b'
  const colors = ACCENT_COLOR_MAP[accentColor] ?? ACCENT_COLOR_MAP.cyan

  const strokeDasharray = hasValidationErrors ? '4,4' : hasChildBoard ? '8,4' : 'none'
  const borderRadius = 10

  // For rectangle (default card style), we create a modern card with colored header
  if (variant === 'rectangle') {
    return (
      <svg
        width={w}
        height={h}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
          pointerEvents: 'none'
        }}
      >
        {/* Drop shadow filter */}
        <defs>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.04" />
          </filter>
          <clipPath id={`cardClip-${w}-${h}`}>
            <rect x="0" y="0" width={w} height={h} rx={borderRadius} ry={borderRadius} />
          </clipPath>
        </defs>

        {/* Card body with shadow */}
        <rect
          x="0"
          y="0"
          width={w}
          height={h}
          rx={borderRadius}
          ry={borderRadius}
          fill="#ffffff"
          stroke={colors.stroke}
          strokeWidth="1.5"
          strokeDasharray={strokeDasharray}
          filter="url(#cardShadow)"
        />

        {/* Colored header strip */}
        <rect
          x="0"
          y="0"
          width={w}
          height={HEADER_HEIGHT}
          fill={headerColor}
          clipPath={`url(#cardClip-${w}-${h})`}
        />
      </svg>
    )
  }

  // For other shapes, use the original rendering with updated colors
  const shapeProps = {
    fill: '#ffffff',
    stroke: colors.stroke,
    strokeWidth: 1.5,
    strokeDasharray,
    filter: 'url(#cardShadow)'
  }

  const renderShape = () => {
    switch (variant) {
      case 'oval':
        return (
          <>
            <ellipse
              cx={w / 2}
              cy={h / 2}
              rx={w / 2 - 2}
              ry={h / 2 - 2}
              {...shapeProps}
            />
            {/* Header accent for oval */}
            <ellipse
              cx={w / 2}
              cy={h * 0.15}
              rx={w / 2 - 4}
              ry={h * 0.08}
              fill={headerColor}
              opacity={0.9}
            />
          </>
        )

      case 'diamond':
      case 'rhombus':
        return (
          <>
            <path
              d={`M ${w / 2} 2 L ${w - 2} ${h / 2} L ${w / 2} ${h - 2} L 2 ${h / 2} Z`}
              {...shapeProps}
            />
            {/* Top accent for diamond */}
            <path
              d={`M ${w / 2} 2 L ${w * 0.7} ${h * 0.25} L ${w / 2} ${h * 0.15} L ${w * 0.3} ${h * 0.25} Z`}
              fill={headerColor}
              opacity={0.9}
            />
          </>
        )

      case 'hexagon': {
        const hexW = w / 4
        return (
          <>
            <path
              d={`M ${hexW} 2 L ${w - hexW} 2 L ${w - 2} ${h / 2} L ${w - hexW} ${h - 2} L ${hexW} ${h - 2} L 2 ${h / 2} Z`}
              {...shapeProps}
            />
            {/* Header strip for hexagon */}
            <rect
              x={hexW}
              y="2"
              width={w - hexW * 2}
              height={HEADER_HEIGHT}
              fill={headerColor}
            />
          </>
        )
      }

      case 'cloud': {
        const r = Math.min(w, h) / 8
        return (
          <path
            d={`
              M ${r * 2} ${h / 2}
              Q ${r} ${h / 3}, ${r * 2} ${r * 2}
              Q ${r * 2} ${r}, ${r * 4} ${r}
              Q ${w - r * 2} ${r}, ${w - r * 2} ${r * 2}
              Q ${w - r} ${h / 3}, ${w - r * 2} ${h / 2}
              Q ${w - r} ${h - r * 2}, ${w - r * 2} ${h - r * 2}
              Q ${w - r * 4} ${h - r}, ${r * 4} ${h - r}
              Q ${r * 2} ${h - r}, ${r * 2} ${h / 2}
            `}
            {...shapeProps}
          />
        )
      }

      case 'trapezoid': {
        const inset = w / 6
        return (
          <>
            <path
              d={`M ${inset} 2 L ${w - inset} 2 L ${w - 2} ${h - 2} L 2 ${h - 2} Z`}
              {...shapeProps}
            />
            {/* Header strip for trapezoid */}
            <path
              d={`M ${inset + 2} 2 L ${w - inset - 2} 2 L ${w - inset - 2} ${HEADER_HEIGHT + 2} L ${inset + 2} ${HEADER_HEIGHT + 2} Z`}
              fill={headerColor}
            />
          </>
        )
      }

      default:
        return (
          <rect
            x={2}
            y={2}
            width={w - 4}
            height={h - 4}
            rx={borderRadius}
            ry={borderRadius}
            {...shapeProps}
          />
        )
    }
  }

  return (
    <svg
      width={w}
      height={h}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'visible',
        pointerEvents: 'none'
      }}
    >
      <defs>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.04" />
        </filter>
      </defs>
      {renderShape()}
    </svg>
  )
}
