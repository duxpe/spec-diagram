import type { RelationType } from '@/domain/models/relation'
import type { CreateNodeRequest } from '@/features/board/ui/components/hud/FloatingToolbar'

export interface PendingNodeCreation {
  request: CreateNodeRequest
  x?: number
  y?: number
  relationSourceNodeId?: string
  relationType?: RelationType
}

export interface ConnectionSuggestionState {
  sourceNodeId: string
  screenX: number
  screenY: number
  canvasX: number
  canvasY: number
}

export interface PendingRelationState {
  sourceNodeId: string
  targetNodeId: string
  sourceHandleId?: string
  targetHandleId?: string
}
