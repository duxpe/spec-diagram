import { memo } from 'react'
import { NodeResizer } from '@xyflow/react'
import type { RFNodeData } from '../reactflow-adapter'
import { ShapeBackground } from '../shapes/ShapeBackground'
import { NodeHandles } from './NodeHandles'
import { SemanticNodeContent } from './SemanticNodeContent'

interface SemanticNodeProps {
  id: string
  data: RFNodeData
  selected?: boolean
}

function SemanticNodeComponent({ data, selected }: SemanticNodeProps): JSX.Element {
  const width = data.width ?? 220
  const height = data.height ?? 110

  return (
    <>
      <NodeResizer
        minWidth={100}
        minHeight={60}
        isVisible={selected}
        lineStyle={{
          borderColor: 'rgba(99, 179, 237, 0.6)',
          borderWidth: 1
        }}
        handleStyle={{
          width: 8,
          height: 8,
          background: 'rgba(6, 14, 31, 0.88)',
          border: '2px solid rgba(99, 179, 237, 0.6)',
          borderRadius: 2
        }}
      />

      <NodeHandles isConnectable={true} />

      <div
        style={{
          width,
          height,
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <ShapeBackground
          width={width}
          height={height}
          variant={data.shapeVariant}
          accentColor={data.accentColor}
          provider={data.provider}
          hasChildBoard={data.hasChildBoard}
          hasValidationErrors={data.hasValidationErrors}
        />

        <SemanticNodeContent
          title={data.title}
          icon={data.icon}
          provider={data.provider}
          providerService={data.providerService}
          showProviderBadge={data.showProviderBadge}
          hasChildBoard={data.hasChildBoard}
          hasValidationErrors={data.hasValidationErrors}
        />
      </div>
    </>
  )
}

export const SemanticNode = memo(SemanticNodeComponent)
