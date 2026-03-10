import { SemanticSnapshotShape, createSemanticSnapshotShape } from '@/board/semantic/semantic-shape-factory'
import { SemanticNode } from '@/domain/models/semantic-node'

export function toSemanticSnapshot(nodes: SemanticNode[]): SemanticSnapshotShape[] {
  return nodes.map(createSemanticSnapshotShape)
}
