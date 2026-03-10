export type SemanticLevel = 'N1' | 'N2' | 'N3'

export interface Board {
  id: string
  workspaceId: string
  parentBoardId?: string
  parentNodeId?: string
  level: SemanticLevel
  name: string
  description?: string
  nodeIds: string[]
  relationIds: string[]
  tlSnapshot?: unknown
  createdAt: string
  updatedAt: string
}
