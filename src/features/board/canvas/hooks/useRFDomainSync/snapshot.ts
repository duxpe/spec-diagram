import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'

export interface DomainSyncSnapshot {
  boardIdentity: string
  signature: string
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(value)
}

export function createDomainSyncSignature(
  nodes: SemanticNode[],
  relations: Relation[]
): string {
  const nodeSignature = nodes
    .map((node) => ({
      id: node.id,
      projectId: node.projectId,
      boardId: node.boardId,
      parentNodeId: node.parentNodeId ?? null,
      level: node.level,
      type: node.type,
      title: node.title,
      description: node.description ?? null,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      childBoardId: node.childBoardId ?? null,
      data: node.data,
      meaning: node.meaning ?? null,
      appearance: node.appearance ?? null
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const relationSignature = relations
    .map((relation) => ({
      id: relation.id,
      projectId: relation.projectId,
      boardId: relation.boardId,
      sourceNodeId: relation.sourceNodeId,
      targetNodeId: relation.targetNodeId,
      sourceHandleId: relation.sourceHandleId ?? null,
      targetHandleId: relation.targetHandleId ?? null,
      type: relation.type,
      label: relation.label ?? null
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  return stableSerialize({
    nodes: nodeSignature,
    relations: relationSignature
  })
}

export function createDomainSyncSnapshot(
  boardIdentity: string,
  nodes: SemanticNode[],
  relations: Relation[]
): DomainSyncSnapshot {
  return {
    boardIdentity,
    signature: createDomainSyncSignature(nodes, relations)
  }
}

export function resolveDomainSyncSkip(
  pendingSnapshot: DomainSyncSnapshot | null,
  currentBoardIdentity: string,
  nodes: SemanticNode[],
  relations: Relation[]
): { shouldSkip: boolean; nextPendingSnapshot: DomainSyncSnapshot | null } {
  if (!pendingSnapshot) {
    return { shouldSkip: false, nextPendingSnapshot: null }
  }

  if (pendingSnapshot.boardIdentity !== currentBoardIdentity) {
    return { shouldSkip: false, nextPendingSnapshot: null }
  }

  const currentSignature = createDomainSyncSignature(nodes, relations)
  if (currentSignature === pendingSnapshot.signature) {
    return { shouldSkip: true, nextPendingSnapshot: null }
  }

  return { shouldSkip: false, nextPendingSnapshot: null }
}
