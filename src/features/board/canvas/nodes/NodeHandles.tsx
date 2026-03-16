import { Handle, Position } from '@xyflow/react'

interface NodeHandlesProps {
  isConnectable?: boolean
}

export function NodeHandles({ isConnectable = true }: NodeHandlesProps): JSX.Element {
  const handleStyle = {
    width: 10,
    height: 10,
    background: 'rgba(6, 14, 31, 0.88)',
    border: '2px solid rgba(99, 179, 237, 0.6)',
    borderRadius: '50%'
  }

  const positionStyles = {
    top: { top: -5 },
    right: { right: -5 },
    bottom: { bottom: -5 },
    left: { left: -5 }
  } as const

  return (
    <>
      {/* Target handles (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, ...positionStyles.top }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, ...positionStyles.right }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, ...positionStyles.bottom }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, ...positionStyles.left }}
        isConnectable={isConnectable}
      />

      {/* Source handles (for outgoing edges) */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, ...positionStyles.top }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, ...positionStyles.right }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, ...positionStyles.bottom }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, ...positionStyles.left }}
        isConnectable={isConnectable}
      />
    </>
  )
}
