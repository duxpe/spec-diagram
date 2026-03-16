export type SemanticLevel = 'N1' | 'N2'

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface Board {
  id: string
  projectId: string
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
