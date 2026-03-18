import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { almostEqual } from '@/features/board/canvas/reactflow-adapter/normalization'

export function isNodeEquivalent(current: SemanticNode, next: SemanticNode): boolean {
  return (
    current.id === next.id &&
    current.projectId === next.projectId &&
    current.boardId === next.boardId &&
    current.parentNodeId === next.parentNodeId &&
    current.level === next.level &&
    current.type === next.type &&
    current.title === next.title &&
    current.description === next.description &&
    JSON.stringify(current.meaning ?? null) === JSON.stringify(next.meaning ?? null) &&
    almostEqual(current.x, next.x) &&
    almostEqual(current.y, next.y) &&
    almostEqual(current.width, next.width) &&
    almostEqual(current.height, next.height) &&
    current.childBoardId === next.childBoardId &&
    JSON.stringify(current.data) === JSON.stringify(next.data) &&
    JSON.stringify(current.appearance ?? null) === JSON.stringify(next.appearance ?? null)
  )
}

export function isRelationEquivalent(current: Relation, next: Relation): boolean {
  return (
    current.id === next.id &&
    current.projectId === next.projectId &&
    current.boardId === next.boardId &&
    current.sourceNodeId === next.sourceNodeId &&
    current.targetNodeId === next.targetNodeId &&
    current.sourceHandleId === next.sourceHandleId &&
    current.targetHandleId === next.targetHandleId &&
    current.label === next.label &&
    current.type === next.type
  )
}
