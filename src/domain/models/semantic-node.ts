import { SemanticLevel } from '@/domain/models/board'
import type { NodeAppearance } from '@/domain/models/node-appearance'

export interface SemanticNodeMeaning {
  purpose?: string
  primaryResponsibility?: string
  role?: string
  summary?: string
  inputs?: string[]
  outputs?: string[]
  constraints?: string[]
  decisionNote?: string
  errorNote?: string
}

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
  | 'free_note_input'
  | 'free_note_output'

export interface SemanticNode {
  id: string
  projectId: string
  boardId: string
  parentNodeId?: string
  level: SemanticLevel
  type: SemanticNodeType
  patternRole?: string
  title: string
  description?: string
  meaning?: SemanticNodeMeaning
  x: number
  y: number
  width: number
  height: number
  childBoardId?: string
  data: Record<string, unknown>
  appearance?: NodeAppearance
  createdAt: string
  updatedAt: string
}
