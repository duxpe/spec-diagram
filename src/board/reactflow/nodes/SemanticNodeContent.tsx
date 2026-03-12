import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import type { CSSProperties } from 'react'
import type { GenericIconId, ProviderServiceId, VisualProvider } from '@/domain/models/node-appearance'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import { getCloudServiceById, getProviderLabel } from '@/domain/semantics/node-visual-catalog'
import type { RFNodeData } from '../reactflow-adapter'

interface SemanticNodeContentProps {
  title: string
  semanticType: SemanticNodeType
  icon: GenericIconId
  data: RFNodeData
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
  hasChildBoard: boolean
  hasValidationErrors: boolean
  onOpenAppearance?: () => void
}

// Header height must match ShapeBackground
const HEADER_HEIGHT = 10

const normalizeText = (input: unknown): string => {
  if (typeof input !== 'string') return ''
  return input.trim()
}

const parseMethodSignature = (input: string) => {
  const signature = input.trim()
  const colonIndex = signature.lastIndexOf(':')
  const returnType = colonIndex >= 0 ? signature.slice(colonIndex + 1).trim() : ''
  const beforeColon = colonIndex >= 0 ? signature.slice(0, colonIndex).trim() : signature
  const nameMatch = beforeColon.match(/^([^(]+)\s*(\(.*\))?$/)
  return {
    methodName: (nameMatch?.[1] ?? '').trim(),
    parameters: (nameMatch?.[2] ?? '').trim(),
    returnType,
    signature
  }
}

const renderMethodDetails = (title: string, data: RFNodeData) => {
  const methodSignature = normalizeText(data.signature)
  const { methodName, returnType, signature } = parseMethodSignature(methodSignature)
  const displayName = methodName || title || 'method'
  const displayReturn = returnType || 'void'
  const displaySignature = signature || `${displayName}()`

  return (
    <table className="semantic-node__table" aria-label="Method details">
      <tbody>
        <tr>
          <th scope="row">Return</th>
          <td>{displayReturn}</td>
        </tr>
        <tr>
          <th scope="row">Name</th>
          <td>{displayName}</td>
        </tr>
        <tr>
          <th scope="row">Signature</th>
          <td>{displaySignature}</td>
        </tr>
      </tbody>
    </table>
  )
}

const renderAttributeDetails = (title: string, data: RFNodeData) => {
  const attributeType = normalizeText(data.typeSignature) || 'unknown'
  const attributeName = title || 'attribute'

  return (
    <table className="semantic-node__table" aria-label="Attribute details">
      <tbody>
        <tr>
          <th scope="row">Type</th>
          <td>{attributeType}</td>
        </tr>
        <tr>
          <th scope="row">Name</th>
          <td>{attributeName}</td>
        </tr>
      </tbody>
    </table>
  )
}

export function SemanticNodeContent({
  title,
  semanticType,
  icon,
  data,
  provider,
  providerService,
  showProviderBadge,
  hasChildBoard,
  hasValidationErrors,
  onOpenAppearance
}: SemanticNodeContentProps): JSX.Element {
  const providerServiceData = providerService ? getCloudServiceById(providerService) : null
  const isMethodNode = semanticType === 'method'
  const isAttributeNode = semanticType === 'attribute'

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
    color: '#1e293b',
    pointerEvents: 'none'
  }

  const defaultTitleStyle: CSSProperties = {
    margin: 0,
    textAlign: 'center',
    wordWrap: 'break-word',
    overflow: 'hidden',
    userSelect: 'none'
  }

  const renderContent = () => {
    if (isMethodNode) {
      return renderMethodDetails(title, data)
    }

    if (isAttributeNode) {
      return renderAttributeDetails(title, data)
    }

    return <p style={defaultTitleStyle}>{title}</p>
  }

  return (
    <>
      {/* Title content area */}
      <div style={contentStyle}>{renderContent()}</div>

      {/* Icon chip (top-left, below header) */}
      <button
        type="button"
        aria-label="Editar Aparência"
        onClick={onOpenAppearance}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          pointerEvents: 'auto',
          position: 'absolute',
          top: HEADER_HEIGHT + 4,
          left: '4px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        {providerServiceData ? (
          <Icon icon={providerServiceData.icon} width={22} height={22} style={{ color: '#475569' }} />
        ) : (
          <GenericNodeIcon iconId={icon} size={22} color="#475569" />
        )}
      </button>

      {/* Provider badge (top-right, below header) */}
      {showProviderBadge && provider !== 'none' && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
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
