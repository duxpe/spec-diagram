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

  const label = data?.label

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

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'rgba(6, 14, 31, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#e2e8f0',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'all',
              cursor: 'pointer'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const RelationEdge = memo(RelationEdgeComponent)
