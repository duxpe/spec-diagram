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

export function ShapeBackground({
  width,
  height,
  variant,
  accentColor,
  semanticType: _semanticType,
  hasChildBoard,
  hasValidationErrors
}: ShapeBackgroundProps): JSX.Element {
  const w = width
  const h = height
  const colors = ACCENT_COLOR_MAP[accentColor] ?? ACCENT_COLOR_MAP.cyan

  const strokeDasharray = hasValidationErrors ? '4,4' : hasChildBoard ? '8,4' : 'none'
  const borderRadius = 10

  // For other shapes, use the original rendering with updated colors
  const shapeProps = {
    fill: '#ffffff',
    stroke: colors.stroke,
    strokeWidth: 2.25,
    strokeDasharray,
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

      case 'cylinder': {
        const ry = Math.min(h * 0.12, 16)
        return (
          <>
            {/* Body */}
            <rect
              x={2}
              y={ry + 2}
              width={w - 4}
              height={h - ry * 2 - 4}
              {...shapeProps}
            />
            {/* Bottom ellipse */}
            <ellipse
              cx={w / 2}
              cy={h - ry - 2}
              rx={w / 2 - 2}
              ry={ry}
              {...shapeProps}
            />
            {/* Top ellipse (covers body top) */}
            <ellipse
              cx={w / 2}
              cy={ry + 2}
              rx={w / 2 - 2}
              ry={ry}
              {...shapeProps}
            />
          </>
        )
      }

      case 'stick_figure': {
        const cx = w / 2
        const headR = Math.min(w, h) * 0.12
        const headY = h * 0.2
        const bodyTop = headY + headR
        const bodyBottom = h * 0.6
        const armY = bodyTop + (bodyBottom - bodyTop) * 0.25
        const armSpan = w * 0.25
        const legBottom = h * 0.9
        const legSpan = w * 0.18
        return (
          <>
            {/* Background area for click target */}
            <rect x={0} y={0} width={w} height={h} fill="transparent" />
            {/* Head */}
            <circle cx={cx} cy={headY} r={headR} fill="#ffffff" stroke={colors.stroke} strokeWidth={2.25} strokeDasharray={strokeDasharray} />
            {/* Body */}
            <line x1={cx} y1={bodyTop} x2={cx} y2={bodyBottom} stroke={colors.stroke} strokeWidth={2.25} strokeDasharray={strokeDasharray} />
            {/* Arms */}
            <line x1={cx - armSpan} y1={armY} x2={cx + armSpan} y2={armY} stroke={colors.stroke} strokeWidth={2.25} strokeDasharray={strokeDasharray} />
            {/* Left leg */}
            <line x1={cx} y1={bodyBottom} x2={cx - legSpan} y2={legBottom} stroke={colors.stroke} strokeWidth={2.25} strokeDasharray={strokeDasharray} />
            {/* Right leg */}
            <line x1={cx} y1={bodyBottom} x2={cx + legSpan} y2={legBottom} stroke={colors.stroke} strokeWidth={2.25} strokeDasharray={strokeDasharray} />
          </>
        )
      }

      case 'layer_rectangle':
        return (
          <>
            <rect
              x={2}
              y={2}
              width={w - 4}
              height={h - 4}
              rx={4}
              ry={4}
              {...shapeProps}
            />
          </>
        )

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
      {renderShape()}
    </svg>
  )
}
