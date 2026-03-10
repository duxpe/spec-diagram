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

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: -5 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -5 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -5 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: -5 }}
        isConnectable={isConnectable}
      />
    </>
  )
}
