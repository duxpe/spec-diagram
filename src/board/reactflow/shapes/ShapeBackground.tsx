import type { NodeShapeVariant, VisualProvider, AccentColorToken } from '@/domain/models/node-appearance'

interface ShapeBackgroundProps {
  width: number
  height: number
  variant: NodeShapeVariant
  accentColor: AccentColorToken
  provider: VisualProvider
  hasChildBoard: boolean
  hasValidationErrors: boolean
}

const ACCENT_COLOR_MAP: Record<AccentColorToken, { fill: string; stroke: string }> = {
  cyan: { fill: 'rgba(34, 211, 238, 0.15)', stroke: 'rgba(34, 211, 238, 0.6)' },
  teal: { fill: 'rgba(45, 212, 191, 0.15)', stroke: 'rgba(45, 212, 191, 0.6)' },
  amber: { fill: 'rgba(251, 191, 36, 0.15)', stroke: 'rgba(251, 191, 36, 0.6)' },
  gray: { fill: 'rgba(156, 163, 175, 0.15)', stroke: 'rgba(156, 163, 175, 0.6)' },
  indigo: { fill: 'rgba(129, 140, 248, 0.15)', stroke: 'rgba(129, 140, 248, 0.6)' },
  orange: { fill: 'rgba(251, 146, 60, 0.15)', stroke: 'rgba(251, 146, 60, 0.6)' },
  blue: { fill: 'rgba(59, 130, 246, 0.15)', stroke: 'rgba(59, 130, 246, 0.6)' },
  purple: { fill: 'rgba(168, 85, 247, 0.15)', stroke: 'rgba(168, 85, 247, 0.6)' },
  green: { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'rgba(34, 197, 94, 0.6)' },
  neutral: { fill: 'rgba(163, 163, 163, 0.15)', stroke: 'rgba(163, 163, 163, 0.6)' }
}

export function ShapeBackground({
  width,
  height,
  variant,
  accentColor,
  provider,
  hasChildBoard,
  hasValidationErrors
}: ShapeBackgroundProps): JSX.Element {
  const w = width
  const h = height

  const colors = ACCENT_COLOR_MAP[accentColor] ?? ACCENT_COLOR_MAP.cyan
  const fillOpacity = provider === 'none' ? 0.5 : 1.0
  const strokeDasharray = hasValidationErrors ? '4,4' : hasChildBoard ? '8,4' : 'none'

  const shapeProps = {
    fill: colors.fill,
    fillOpacity,
    stroke: colors.stroke,
    strokeWidth: 2,
    strokeDasharray
  }

  const renderShape = () => {
    switch (variant) {
      case 'oval':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - 2}
            ry={h / 2 - 2}
            {...shapeProps}
          />
        )

      case 'diamond':
        return (
          <path
            d={`M ${w / 2} 2 L ${w - 2} ${h / 2} L ${w / 2} ${h - 2} L 2 ${h / 2} Z`}
            {...shapeProps}
          />
        )

      case 'rhombus':
        return (
          <path
            d={`M ${w / 2} 2 L ${w - 2} ${h / 2} L ${w / 2} ${h - 2} L 2 ${h / 2} Z`}
            {...shapeProps}
          />
        )

      case 'hexagon': {
        const hexW = w / 4
        return (
          <path
            d={`M ${hexW} 2 L ${w - hexW} 2 L ${w - 2} ${h / 2} L ${w - hexW} ${h - 2} L ${hexW} ${h - 2} L 2 ${h / 2} Z`}
            {...shapeProps}
          />
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
          <path
            d={`M ${inset} 2 L ${w - inset} 2 L ${w - 2} ${h - 2} L 2 ${h - 2} Z`}
            {...shapeProps}
          />
        )
      }

      case 'rectangle':
      default:
        return (
          <rect
            x={2}
            y={2}
            width={w - 4}
            height={h - 4}
            rx={8}
            ry={8}
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
      {renderShape()}
    </svg>
  )
}
