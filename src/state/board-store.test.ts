import { describe, expect, it, vi } from 'vitest'
import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { useBoardStore } from '@/state/board-store'

const now = new Date().toISOString()

function makeBoard(id = 'board_1'): Board {
  return {
    id,
    workspaceId: 'ws_1',
    level: 'N1',
    name: 'Board',
    nodeIds: [],
    relationIds: [],
    createdAt: now,
    updatedAt: now
  }
}

function makeNode(id: string, patch?: Partial<SemanticNode>): SemanticNode {
  return {
    id,
    workspaceId: 'ws_1',
    boardId: 'board_1',
    level: 'N1',
    type: 'system',
    title: id,
    x: 10,
    y: 10,
    width: 200,
    height: 120,
    data: {},
    createdAt: now,
    updatedAt: now,
    ...patch
  }
}

function makeRelation(id: string, sourceNodeId: string, targetNodeId: string): Relation {
  return {
    id,
    workspaceId: 'ws_1',
    boardId: 'board_1',
    sourceNodeId,
    targetNodeId,
    type: 'depends_on',
    createdAt: now,
    updatedAt: now
  }
}

describe('board-store canvas sync actions', () => {
  it('applyCanvasState triggers immediate persistence on destructive changes', async () => {
    const saveSpy = vi.fn(async () => undefined)

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [makeNode('node_a'), makeNode('node_b')],
      relations: [makeRelation('rel_ab', 'node_a', 'node_b')],
      dirty: false,
      saveCurrentBoard: saveSpy
    })

    useBoardStore.getState().applyCanvasState('board_1', [makeNode('node_a')], [])

    expect(useBoardStore.getState().nodes).toHaveLength(1)
    expect(useBoardStore.getState().relations).toHaveLength(0)
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('applyCanvasState is a no-op when semantic state did not change', () => {
    const nodeA = makeNode('node_a')
    const relation = makeRelation('rel_ab', 'node_a', 'node_a')

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [nodeA],
      relations: [relation],
      dirty: false
    })

    useBoardStore
      .getState()
      .applyCanvasState('board_1', [{ ...nodeA }], [{ ...relation }])

    expect(useBoardStore.getState().dirty).toBe(false)
    expect(useBoardStore.getState().nodes[0]).toBe(nodeA)
    expect(useBoardStore.getState().relations[0]).toBe(relation)
  })

  it('applyCanvasState ignores stale callbacks from other boards', () => {
    const nodeA = makeNode('node_a')

    useBoardStore.setState({
      currentBoard: makeBoard('board_1'),
      nodes: [nodeA],
      relations: [],
      dirty: false
    })

    useBoardStore
      .getState()
      .applyCanvasState('board_2', [makeNode('node_a', { x: 999 })], [])

    expect(useBoardStore.getState().nodes[0]?.x).toBe(10)
    expect(useBoardStore.getState().dirty).toBe(false)
  })

  it('deleteNode removes connected relations', () => {
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b')
    const saveSpy = vi.fn(async () => undefined)

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [nodeA, nodeB],
      relations: [makeRelation('rel_ab', 'node_a', 'node_b')],
      dirty: false,
      saveCurrentBoard: saveSpy
    })

    useBoardStore.getState().deleteNode('node_a')

    expect(useBoardStore.getState().nodes.map((node) => node.id)).toEqual(['node_b'])
    expect(useBoardStore.getState().relations).toEqual([])
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })
})
