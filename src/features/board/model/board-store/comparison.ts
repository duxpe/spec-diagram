import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'

const FLOAT_TOLERANCE = 0.05

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= FLOAT_TOLERANCE
}

function isNodeSemanticallyEqual(a: SemanticNode, b: SemanticNode): boolean {
  return (
    a.id === b.id &&
    a.projectId === b.projectId &&
    a.boardId === b.boardId &&
    a.parentNodeId === b.parentNodeId &&
    a.level === b.level &&
    a.type === b.type &&
    a.title === b.title &&
    a.description === b.description &&
    JSON.stringify(a.meaning ?? null) === JSON.stringify(b.meaning ?? null) &&
    nearlyEqual(a.x, b.x) &&
    nearlyEqual(a.y, b.y) &&
    nearlyEqual(a.width, b.width) &&
    nearlyEqual(a.height, b.height) &&
    a.childBoardId === b.childBoardId &&
    JSON.stringify(a.data) === JSON.stringify(b.data) &&
    JSON.stringify(a.appearance ?? null) === JSON.stringify(b.appearance ?? null)
  )
}

function isRelationSemanticallyEqual(a: Relation, b: Relation): boolean {
  return (
    a.id === b.id &&
    a.projectId === b.projectId &&
    a.boardId === b.boardId &&
    a.sourceNodeId === b.sourceNodeId &&
    a.targetNodeId === b.targetNodeId &&
    a.sourceHandleId === b.sourceHandleId &&
    a.targetHandleId === b.targetHandleId &&
    a.label === b.label &&
    a.type === b.type
  )
}

export function hasCanvasDiff(
  currentNodes: SemanticNode[],
  nextNodes: SemanticNode[],
  currentRelations: Relation[],
  nextRelations: Relation[]
): boolean {
  if (currentNodes.length !== nextNodes.length) return true
  if (currentRelations.length !== nextRelations.length) return true

  const currentNodesById = new Map(currentNodes.map((node) => [node.id, node]))
  const currentRelationsById = new Map(currentRelations.map((relation) => [relation.id, relation]))

  for (const nextNode of nextNodes) {
    const currentNode = currentNodesById.get(nextNode.id)
    if (!currentNode || !isNodeSemanticallyEqual(currentNode, nextNode)) {
      return true
    }
  }

  for (const nextRelation of nextRelations) {
    const currentRelation = currentRelationsById.get(nextRelation.id)
    if (!currentRelation || !isRelationSemanticallyEqual(currentRelation, nextRelation)) {
      return true
    }
  }

  return false
}
