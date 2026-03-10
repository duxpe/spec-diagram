import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { SemanticNodeCard } from '@/components/board/SemanticNodeCard'

interface SemanticOverlayProps {
  nodes: SemanticNode[]
  relations: Relation[]
  selectedNodeId?: string
  onSelectNode: (id: string) => void
  onMoveNode: (id: string, x: number, y: number) => void
}

function nodeCenter(node: SemanticNode): { x: number; y: number } {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 }
}

export function SemanticOverlay({
  nodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onMoveNode
}: SemanticOverlayProps): JSX.Element {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <div className="semantic-overlay" aria-label="Semantic blocks overlay">
      <svg className="semantic-overlay__relations" aria-hidden="true">
        {relations.map((relation) => {
          const source = nodeById.get(relation.sourceNodeId)
          const target = nodeById.get(relation.targetNodeId)
          if (!source || !target) return null

          const sourceCenter = nodeCenter(source)
          const targetCenter = nodeCenter(target)

          return (
            <line
              key={relation.id}
              x1={sourceCenter.x}
              y1={sourceCenter.y}
              x2={targetCenter.x}
              y2={targetCenter.y}
              className="semantic-overlay__relation"
            />
          )
        })}
      </svg>

      {nodes.map((node) => (
        <SemanticNodeCard
          key={node.id}
          node={node}
          selected={node.id === selectedNodeId}
          onSelect={onSelectNode}
          onMove={onMoveNode}
        />
      ))}
    </div>
  )
}
