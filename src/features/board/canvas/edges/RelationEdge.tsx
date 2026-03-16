import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Position
} from '@xyflow/react'
import type { RFEdgeData } from '../reactflow-adapter'

interface RelationEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: RFEdgeData
  selected?: boolean
  markerEnd?: string
}

function RelationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd
}: RelationEdgeProps): JSX.Element {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  // Show relation type (humanized) and optional custom label
  const relTypeLabel = data?.relationType
    ? data.relationType.replaceAll('_', ' ')
    : undefined
  const displayLabel = data?.label
    ? relTypeLabel
      ? `${relTypeLabel}: ${data.label}`
      : data.label
    : relTypeLabel

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? 'rgba(99, 179, 237, 0.8)' : 'rgba(156, 163, 175, 0.6)',
          strokeWidth: selected ? 2 : 1.5
        }}
      />

      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              borderRadius: '4px',
              padding: '2px 7px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#334155',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'all',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            className="nodrag nopan"
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const RelationEdge = memo(RelationEdgeComponent)
