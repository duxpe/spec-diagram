import { describe, expect, it } from 'vitest'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import {
  createDomainSyncSnapshot,
  resolveDomainSyncSkip
} from '@/features/board/canvas/hooks/useRFDomainSync/snapshot'

const now = new Date().toISOString()

function makeNode(id: string, patch?: Partial<SemanticNode>): SemanticNode {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N2',
    type: 'class',
    title: id,
    x: 10,
    y: 10,
    width: 220,
    height: 110,
    data: {},
    createdAt: now,
    updatedAt: now,
    ...patch
  }
}

function makeRelation(
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  patch?: Partial<Relation>
): Relation {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    sourceNodeId,
    targetNodeId,
    type: 'implements',
    createdAt: now,
    updatedAt: now,
    ...patch
  }
}

describe('useRFDomainSync snapshot skip logic', () => {
  it('returns skip=true for the same board and same snapshot', () => {
    const nodes = [makeNode('node_a'), makeNode('node_b', { type: 'interface' })]
    const relations = [makeRelation('rel_ab', 'node_a', 'node_b')]
    const pending = createDomainSyncSnapshot('ws_1:board_1', nodes, relations)

    const decision = resolveDomainSyncSkip(pending, 'ws_1:board_1', nodes, relations)

    expect(decision.shouldSkip).toBe(true)
    expect(decision.nextPendingSnapshot).toBeNull()
  })

  it('returns skip=false when relations differ', () => {
    const nodes = [makeNode('node_a'), makeNode('node_b', { type: 'interface' })]
    const pending = createDomainSyncSnapshot('ws_1:board_1', nodes, [
      makeRelation('rel_ab', 'node_a', 'node_b')
    ])

    const decision = resolveDomainSyncSkip(pending, 'ws_1:board_1', nodes, [])

    expect(decision.shouldSkip).toBe(false)
    expect(decision.nextPendingSnapshot).toBeNull()
  })

  it('returns skip=false when nodes differ', () => {
    const nodes = [makeNode('node_a'), makeNode('node_b', { type: 'interface' })]
    const pending = createDomainSyncSnapshot('ws_1:board_1', nodes, [])

    const changedNodes = [makeNode('node_a', { x: 42 }), makeNode('node_b', { type: 'interface' })]
    const decision = resolveDomainSyncSkip(pending, 'ws_1:board_1', changedNodes, [])

    expect(decision.shouldSkip).toBe(false)
    expect(decision.nextPendingSnapshot).toBeNull()
  })

  it('returns skip=false and clears pending when board identity changed', () => {
    const nodes = [makeNode('node_a')]
    const pending = createDomainSyncSnapshot('ws_1:board_1', nodes, [])

    const decision = resolveDomainSyncSkip(pending, 'ws_1:board_2', nodes, [])

    expect(decision.shouldSkip).toBe(false)
    expect(decision.nextPendingSnapshot).toBeNull()
  })
})
