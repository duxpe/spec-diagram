import { SemanticLevel } from '@/domain/models/board'

export type SemanticNodeType =
  | 'system'
  | 'container_service'
  | 'database'
  | 'external_system'
  | 'api_contract'
  | 'decision'
  | 'class'
  | 'interface'
  | 'port'
  | 'adapter'
  | 'method'
  | 'attribute'
  | 'free_note_input'
  | 'free_note_output'

export interface SemanticNode {
  id: string
  workspaceId: string
  boardId: string
  parentNodeId?: string
  level: SemanticLevel
  type: SemanticNodeType
  title: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  childBoardId?: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
