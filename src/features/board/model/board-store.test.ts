import { describe, expect, it, vi } from 'vitest'
import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { useBoardStore } from '@/features/board/model/board-store'
import { useProjectStore } from '@/features/project/model/project-store'

const now = new Date().toISOString()

function makeBoard(id = 'board_1', level: Board['level'] = 'N1'): Board {
  return {
    id,
    projectId: 'ws_1',
    level,
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
    projectId: 'ws_1',
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
    projectId: 'ws_1',
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
    const saveSpy = vi.fn(async () => true)

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [makeNode('node_a'), makeNode('node_b')],
      relations: [makeRelation('rel_ab', 'node_a', 'node_b')],
      dirty: false,
      saveCurrentBoard: saveSpy
    })

    const applied = useBoardStore.getState().applyCanvasState('board_1', [makeNode('node_a')], [])

    expect(applied).toBe(true)
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

    const applied = useBoardStore
      .getState()
      .applyCanvasState('board_1', [{ ...nodeA }], [{ ...relation }])

    expect(applied).toBe(false)
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

    const applied = useBoardStore
      .getState()
      .applyCanvasState('board_2', [makeNode('node_a', { x: 999 })], [])

    expect(applied).toBe(false)
    expect(useBoardStore.getState().nodes[0]?.x).toBe(10)
    expect(useBoardStore.getState().dirty).toBe(false)
  })

  it('deleteNode removes connected relations', () => {
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b')
    const saveSpy = vi.fn(async () => true)

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

  it('blocks relation type that is not allowed in N1', () => {
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b')

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [nodeA, nodeB],
      relations: [],
      dirty: false,
      error: undefined
    })

    useBoardStore.getState().createRelation('node_a', 'node_b', 'implements')

    expect(useBoardStore.getState().relations).toEqual([])
    expect(useBoardStore.getState().error).toContain('not allowed in N1')
  })

  it('allows pattern-specific N1 relation type', () => {
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b')
    useProjectStore.setState({
      currentProject: {
        id: 'ws_1',
        name: 'Project',
        rootBoardId: 'board_1',
        boardIds: ['board_1'],
        architecturePattern: 'hexagonal',
        createdAt: now,
        updatedAt: now
      }
    })

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [
        { ...nodeA, type: 'system', patternRole: 'application_core' },
        { ...nodeB, type: 'port', patternRole: 'inbound_port' }
      ],
      relations: [],
      dirty: false,
      error: undefined
    })

    useBoardStore.getState().createRelation('node_a', 'node_b', 'exposes_port')

    expect(useBoardStore.getState().relations).toHaveLength(1)
    expect(useBoardStore.getState().relations[0]?.type).toBe('exposes_port')
    expect(useBoardStore.getState().error).toBeUndefined()
    useProjectStore.setState({ currentProject: undefined })
  })

  it('allows all relation types for free mode in N1', () => {
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b')
    useProjectStore.setState({
      currentProject: {
        id: 'ws_1',
        name: 'Project',
        rootBoardId: 'board_1',
        boardIds: ['board_1'],
        architecturePattern: 'free_mode',
        createdAt: now,
        updatedAt: now
      }
    })

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [nodeA, nodeB],
      relations: [],
      dirty: false,
      error: undefined
    })

    useBoardStore.getState().createRelation('node_a', 'node_b', 'implements')

    expect(useBoardStore.getState().relations).toHaveLength(1)
    expect(useBoardStore.getState().relations[0]?.type).toBe('implements')
    expect(useBoardStore.getState().error).toBeUndefined()
    useProjectStore.setState({ currentProject: undefined })
  })

  it('blocks relation type that is not allowed in N2', () => {
    const nodeA = makeNode('node_a', { level: 'N2', type: 'class' })
    const nodeB = makeNode('node_b', { level: 'N2', type: 'interface' })

    useBoardStore.setState({
      currentBoard: makeBoard('board_2', 'N2'),
      nodes: [nodeA, nodeB],
      relations: [],
      dirty: false,
      error: undefined
    })

    useBoardStore.getState().createRelation('node_a', 'node_b', 'reads')

    expect(useBoardStore.getState().relations).toEqual([])
    expect(useBoardStore.getState().error).toContain('not allowed in N2')
  })

  it('reverseRelation keeps physical handles by swapping handle ids', () => {
    const saveSpy = vi.fn(async () => true)
    const relation = {
      ...makeRelation('rel_ab', 'node_a', 'node_b'),
      sourceHandleId: 'right',
      targetHandleId: 'left'
    }

    useBoardStore.setState({
      currentBoard: makeBoard(),
      nodes: [makeNode('node_a'), makeNode('node_b')],
      relations: [relation],
      dirty: false,
      saveCurrentBoard: saveSpy
    })

    useBoardStore.getState().reverseRelation('rel_ab')

    const reversed = useBoardStore.getState().relations[0]
    expect(reversed?.sourceNodeId).toBe('node_b')
    expect(reversed?.targetNodeId).toBe('node_a')
    expect(reversed?.sourceHandleId).toBe('left')
    expect(reversed?.targetHandleId).toBe('right')
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })
})
