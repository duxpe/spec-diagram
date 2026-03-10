export type SemanticLevel = 'N1' | 'N2' | 'N3'

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

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
  viewportState?: ViewportState
  createdAt: string
  updatedAt: string
}
