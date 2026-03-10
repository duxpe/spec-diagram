import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import type { GenericIconId, ProviderServiceId, VisualProvider } from '@/domain/models/node-appearance'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'

interface SemanticNodeContentProps {
  title: string
  semanticType: SemanticNodeType
  icon: GenericIconId
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
  hasChildBoard: boolean
  hasValidationErrors: boolean
}

// Header height must match ShapeBackground
const HEADER_HEIGHT = 10

// Chip styling for light theme
const chipStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '6px',
  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
  pointerEvents: 'none'
}

export function SemanticNodeContent({
  title,
  icon,
  provider,
  providerService,
  showProviderBadge,
  hasChildBoard,
  hasValidationErrors
}: SemanticNodeContentProps): JSX.Element {
  const providerServiceData = providerService ? getCloudServiceById(providerService) : null

  return (
    <>
      {/* Title content area */}
      <div
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 12px 12px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: '#1e293b',
          wordWrap: 'break-word',
          overflow: 'hidden',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1.35
        }}
      >
        {title}
      </div>

      {/* Icon chip (top-left, below header) */}
      <div
        style={{
          ...chipStyle,
          position: 'absolute',
          top: HEADER_HEIGHT + 8,
          left: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {providerServiceData ? (
          <Icon icon={providerServiceData.icon} width={14} height={14} style={{ color: '#64748b' }} />
        ) : (
          <GenericNodeIcon iconId={icon} size={14} color="#64748b" />
        )}
      </div>

      {/* Provider badge (top-right, below header) */}
      {showProviderBadge && provider !== 'none' && (
        <div
          style={{
            ...chipStyle,
            position: 'absolute',
            top: HEADER_HEIGHT + 8,
            right: '8px',
            padding: '4px 8px',
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#64748b'
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
