import { PointerEvent, useRef } from 'react'
import { SemanticNode } from '@/domain/models/semantic-node'

interface SemanticNodeCardProps {
  node: SemanticNode
  selected: boolean
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export function SemanticNodeCard({ node, selected, onSelect, onMove }: SemanticNodeCardProps): JSX.Element {
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  )

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y
    }
    onSelect(node.id)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    if (!dragState.current) return

    const deltaX = event.clientX - dragState.current.startX
    const deltaY = event.clientY - dragState.current.startY
    onMove(node.id, dragState.current.originX + deltaX, dragState.current.originY + deltaY)
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    dragState.current = null
  }

  return (
    <button
      className={`semantic-node-card ${selected ? 'selected' : ''}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: `${node.width}px`,
        height: `${node.height}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <span className="semantic-node-card__type">{node.type}</span>
      <strong className="semantic-node-card__title">{node.title}</strong>
    </button>
  )
}
