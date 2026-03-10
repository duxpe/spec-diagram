import { SemanticNode } from '@/domain/models/semantic-node'

export interface SemanticSnapshotShape {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  title: string
}

export function createSemanticSnapshotShape(node: SemanticNode): SemanticSnapshotShape {
  return {
    id: node.id,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    title: node.title
  }
}
