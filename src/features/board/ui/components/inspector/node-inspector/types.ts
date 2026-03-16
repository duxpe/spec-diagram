import type { SemanticNode } from '@/domain/models/semantic-node'

export interface InspectorParentContext {
  immediate: {
    level: 'N1' | 'N2'
    boardName: string
    nodeTitle: string
  }
  ancestor?: {
    level: 'N1' | 'N2'
    boardName: string
    nodeTitle: string
  }
}

export interface NodeInspectorProps {
  node?: SemanticNode
  parentContext?: InspectorParentContext
  onUpdateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'projectId' | 'boardId'>>) => void
  onOpenDetail: (nodeId: string) => void
  onEditInternals?: (nodeId: string) => void
}
