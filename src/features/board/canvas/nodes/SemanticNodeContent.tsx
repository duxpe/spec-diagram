import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/shared/ui/icons/semantic-icons'
import type { CSSProperties } from 'react'
import type { AccentColorToken, GenericIconId, ProviderServiceId, VisualProvider } from '@/domain/models/node-appearance'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'

interface SemanticNodeContentProps {
  title: string
  accentColor: AccentColorToken
  icon: GenericIconId
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
  hasChildBoard: boolean
  hasValidationErrors: boolean
  onOpenAppearance?: () => void
}

// Header height must match ShapeBackground
const HEADER_HEIGHT = 10
const ICON_CHIP_SIZE = 46
const ICON_SIZE = 30

const ACCENT_UI_MAP: Record<
  AccentColorToken,
  { icon: string; iconBg: string; iconBorder: string; title: string; badgeBg: string; badgeBorder: string }
> = {
  cyan: {
    icon: '#0891b2',
    iconBg: 'rgba(34, 211, 238, 0.12)',
    iconBorder: 'rgba(34, 211, 238, 0.45)',
    title: '#0e7490',
    badgeBg: 'rgba(34, 211, 238, 0.12)',
    badgeBorder: 'rgba(34, 211, 238, 0.45)'
  },
  teal: {
    icon: '#0f766e',
    iconBg: 'rgba(45, 212, 191, 0.12)',
    iconBorder: 'rgba(45, 212, 191, 0.45)',
    title: '#0f766e',
    badgeBg: 'rgba(45, 212, 191, 0.12)',
    badgeBorder: 'rgba(45, 212, 191, 0.45)'
  },
  amber: {
    icon: '#b45309',
    iconBg: 'rgba(251, 191, 36, 0.14)',
    iconBorder: 'rgba(245, 158, 11, 0.5)',
    title: '#92400e',
    badgeBg: 'rgba(251, 191, 36, 0.14)',
    badgeBorder: 'rgba(245, 158, 11, 0.5)'
  },
  gray: {
    icon: '#475569',
    iconBg: 'rgba(148, 163, 184, 0.16)',
    iconBorder: 'rgba(148, 163, 184, 0.5)',
    title: '#334155',
    badgeBg: 'rgba(148, 163, 184, 0.14)',
    badgeBorder: 'rgba(148, 163, 184, 0.5)'
  },
  indigo: {
    icon: '#4338ca',
    iconBg: 'rgba(129, 140, 248, 0.14)',
    iconBorder: 'rgba(129, 140, 248, 0.5)',
    title: '#4338ca',
    badgeBg: 'rgba(129, 140, 248, 0.14)',
    badgeBorder: 'rgba(129, 140, 248, 0.5)'
  },
  orange: {
    icon: '#c2410c',
    iconBg: 'rgba(251, 146, 60, 0.14)',
    iconBorder: 'rgba(251, 146, 60, 0.5)',
    title: '#c2410c',
    badgeBg: 'rgba(251, 146, 60, 0.14)',
    badgeBorder: 'rgba(251, 146, 60, 0.5)'
  },
  blue: {
    icon: '#1d4ed8',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconBorder: 'rgba(59, 130, 246, 0.45)',
    title: '#1e40af',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.45)'
  },
  purple: {
    icon: '#7e22ce',
    iconBg: 'rgba(168, 85, 247, 0.12)',
    iconBorder: 'rgba(168, 85, 247, 0.45)',
    title: '#6b21a8',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeBorder: 'rgba(168, 85, 247, 0.45)'
  },
  green: {
    icon: '#15803d',
    iconBg: 'rgba(34, 197, 94, 0.12)',
    iconBorder: 'rgba(34, 197, 94, 0.45)',
    title: '#166534',
    badgeBg: 'rgba(34, 197, 94, 0.12)',
    badgeBorder: 'rgba(34, 197, 94, 0.45)'
  },
  neutral: {
    icon: '#525252',
    iconBg: 'rgba(163, 163, 163, 0.12)',
    iconBorder: 'rgba(163, 163, 163, 0.45)',
    title: '#404040',
    badgeBg: 'rgba(163, 163, 163, 0.12)',
    badgeBorder: 'rgba(163, 163, 163, 0.45)'
  }
}

export function SemanticNodeContent({
  title,
  accentColor,
  icon,
  provider,
  providerService,
  showProviderBadge,
  hasChildBoard,
  hasValidationErrors,
  onOpenAppearance
}: SemanticNodeContentProps): JSX.Element {
  const providerServiceData = providerService ? getCloudServiceById(providerService) : null
  const accent = ACCENT_UI_MAP[accentColor] ?? ACCENT_UI_MAP.cyan

  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: '6px',
    padding: '16px 12px 12px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    color: accent.title,
    pointerEvents: 'none'
  }

  const defaultTitleStyle: CSSProperties = {
    margin: 0,
    textAlign: 'center',
    wordWrap: 'break-word',
    overflow: 'hidden',
    userSelect: 'none'
  }

  return (
    <>
      {/* Title content area */}
      <div style={contentStyle}>
        <p style={defaultTitleStyle}>{title}</p>
      </div>

      {/* Icon chip (top-left, below header) */}
      <button
        type="button"
        aria-label="Edit appearance"
        data-ui-log="Node chip – Open appearance drawer"
        onClick={onOpenAppearance}
        style={{
          background: accent.iconBg,
          border: `1px solid ${accent.iconBorder}`,
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          pointerEvents: 'auto',
          position: 'absolute',
          top: HEADER_HEIGHT + 4,
          left: '6px',
          width: `${ICON_CHIP_SIZE}px`,
          height: `${ICON_CHIP_SIZE}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'visible'
        }}
      >
        <span
          style={{
            width: `${ICON_SIZE}px`,
            height: `${ICON_SIZE}px`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible'
          }}
        >
          {providerServiceData ? (
            <Icon
              icon={providerServiceData.icon}
              width={ICON_SIZE}
              height={ICON_SIZE}
              style={{
                color: accent.icon,
                display: 'block'
              }}
            />
          ) : (
            <GenericNodeIcon iconId={icon} size={ICON_SIZE} color={accent.icon} />
          )}
        </span>
      </button>

      {/* Provider badge (top-right, below header) */}
      {showProviderBadge && provider !== 'none' && (
        <div
          style={{
            background: accent.badgeBg,
            border: `1px solid ${accent.badgeBorder}`,
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
            pointerEvents: 'none',
            position: 'absolute',
            top: HEADER_HEIGHT + 8,
            right: '8px',
            padding: '4px 8px',
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: accent.icon
          }}
        >
          {getProviderLabel(provider)}
        </div>
      )}

      {/* Detail indicator (bottom-right) - shows when node has child board */}
      {hasChildBoard && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600,
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            pointerEvents: 'none'
          }}
        >
          N
        </div>
      )}

      {/* Warning indicator (bottom-left) - shows when validation errors exist */}
      {hasValidationErrors && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#dc2626',
            pointerEvents: 'none'
          }}
        >
          !
        </div>
      )}
    </>
  )
}
