import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import type { GenericIconId, ProviderServiceId, VisualProvider } from '@/domain/models/node-appearance'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'

interface SemanticNodeContentProps {
  title: string
  icon: GenericIconId
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
  hasChildBoard: boolean
  hasValidationErrors: boolean
}

const chipBaseStyle: React.CSSProperties = {
  background: 'rgba(6, 14, 31, 0.88)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.24)',
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
      {/* Text content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          color: 'var(--color-text, #e2e8f0)',
          wordWrap: 'break-word',
          overflow: 'hidden',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {title}
      </div>

      {/* Icon chip (top-left) */}
      <div
        style={{
          ...chipBaseStyle,
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px'
        }}
      >
        {providerServiceData ? (
          <Icon icon={providerServiceData.icon} width={16} height={16} style={{ color: '#fff' }} />
        ) : (
          <GenericNodeIcon iconId={icon} size={16} color="#fff" />
        )}
      </div>

      {/* Provider badge (top-right) */}
      {showProviderBadge && provider !== 'none' && (
        <div
          style={{
            ...chipBaseStyle,
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderRadius: '4px',
            color: '#fff'
          }}
        >
          {getProviderLabel(provider)}
        </div>
      )}

      {/* Detail indicator (bottom-right) - shows when node has child board */}
      {hasChildBoard && (
        <div
          style={{
            ...chipBaseStyle,
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            border: '1px solid rgba(99, 179, 237, 0.4)',
            borderRadius: '4px',
            boxShadow: '0 0 12px rgba(99, 179, 237, 0.3)',
            color: '#63b3ed'
          }}
        >
          N
        </div>
      )}

      {/* Warning indicator (bottom-left) - shows when validation errors exist */}
      {hasValidationErrors && (
        <div
          style={{
            ...chipBaseStyle,
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid rgba(245, 101, 101, 0.4)',
            borderRadius: '4px',
            boxShadow: '0 0 12px rgba(245, 101, 101, 0.3)',
            color: '#f56565'
          }}
        >
          !
        </div>
      )}
    </>
  )
}
