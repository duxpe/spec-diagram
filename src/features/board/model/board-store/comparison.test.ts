import { describe, expect, it } from 'vitest'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { hasCanvasDiff } from '@/features/board/model/board-store/comparison'

const now = '2026-03-16T00:00:00.000Z'

function makeNode(id: string): SemanticNode {
  return {
    id,
    projectId: 'project_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'system',
    title: id,
    x: 10,
    y: 10,
    width: 220,
    height: 110,
    data: {},
    createdAt: now,
    updatedAt: now
  }
}

function makeRelation(id: string): Relation {
  return {
    id,
    projectId: 'project_1',
    boardId: 'board_1',
    sourceNodeId: 'node_a',
    targetNodeId: 'node_b',
    type: 'depends_on',
    createdAt: now,
    updatedAt: now
  }
}

describe('board-store comparison', () => {
  it('treats tiny floating-point movement as unchanged', () => {
    const current = makeNode('node_a')
    const next = { ...current, x: 10.04 }

    expect(hasCanvasDiff([current], [next], [], [])).toBe(false)
  })

  it('detects changed relations', () => {
    const currentRelation = makeRelation('rel_1')
    const changedRelation = { ...currentRelation, targetNodeId: 'node_c' }

    expect(hasCanvasDiff([], [], [currentRelation], [changedRelation])).toBe(true)
  })
})
