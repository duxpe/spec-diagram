import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Board } from '@/domain/models/board'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { BoardStoreGet, BoardStoreSet } from '@/features/board/model/board-store/types'

const createIdMock = vi.hoisted(() => vi.fn<(prefix: string) => string>())
const mockDb = vi.hoisted(() => ({
  projects: { put: vi.fn(async () => undefined) },
  boards: { put: vi.fn(async () => undefined) },
  nodes: { bulkPut: vi.fn(async () => undefined) },
  relations: { bulkPut: vi.fn(async () => undefined) },
  transaction: vi.fn(async (_mode: string, ...rest: unknown[]) => {
    const callback = rest[rest.length - 1] as () => Promise<void>
    await callback()
  })
}))
const boardRepoMock = vi.hoisted(() => ({
  getById: vi.fn<(id: string) => Promise<Board | undefined>>()
}))
const semanticNodeRepoMock = vi.hoisted(() => ({
  listByBoard: vi.fn<(boardId: string) => Promise<SemanticNode[]>>()
}))
const relationRepoMock = vi.hoisted(() => ({
  listByBoard: vi.fn<(boardId: string) => Promise<Relation[]>>()
}))
const projectRepoMock = vi.hoisted(() => ({
  getById: vi.fn<
    (id: string) => Promise<{ id: string; name: string; rootBoardId: string; boardIds: string[]; createdAt: string; updatedAt: string } | undefined>
  >()
}))

vi.mock('@/shared/lib/ids', () => ({
  createId: createIdMock
}))

vi.mock('@/infrastructure/db/dexie', () => ({
  db: mockDb
}))

vi.mock('@/infrastructure/db/repositories/board-repo', () => ({
  boardRepo: boardRepoMock
}))

vi.mock('@/infrastructure/db/repositories/semantic-node-repo', () => ({
  semanticNodeRepo: semanticNodeRepoMock
}))

vi.mock('@/infrastructure/db/repositories/relation-repo', () => ({
  relationRepo: relationRepoMock
}))

vi.mock('@/infrastructure/db/repositories/project-repo', () => ({
  projectRepo: projectRepoMock
}))

import { createDuplicateNodeAction } from '@/features/board/model/board-store/actions/node-actions'

const now = new Date().toISOString()

function makeBoard(id = 'board_1', level: Board['level'] = 'N2'): Board {
  return {
    id,
    projectId: 'ws_1',
    level,
    name: id,
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
    level: 'N2',
    type: 'class',
    title: id,
    x: 10,
    y: 20,
    width: 220,
    height: 110,
    data: {
      responsibility: 'Own business behavior',
      internals: {
        methods: [],
        attributes: []
      }
    },
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
    label: 'links',
    sourceHandleId: 'right',
    targetHandleId: 'left',
    createdAt: now,
    updatedAt: now
  }
}

function createHarness(input: {
  currentBoard: Board
  nodes: SemanticNode[]
  relations: Relation[]
}) {
  const state: {
    currentBoard?: Board
    nodes: SemanticNode[]
    relations: Relation[]
    dirty: boolean
    error?: string
  } = {
    currentBoard: input.currentBoard,
    nodes: input.nodes,
    relations: input.relations,
    dirty: false,
    error: undefined
  }

  const set = ((partial: unknown) => {
    const next = typeof partial === 'function' ? (partial as (s: typeof state) => Partial<typeof state>)(state) : partial
    Object.assign(state, next)
  }) as BoardStoreSet

  const get = (() => state as unknown as ReturnType<BoardStoreGet>) as BoardStoreGet
  return { state, action: createDuplicateNodeAction(set, get) }
}

describe('createDuplicateNodeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const counters: Record<string, number> = {}
    createIdMock.mockImplementation((prefix: string) => {
      const next = (counters[prefix] ?? 0) + 1
      counters[prefix] = next
      return `${prefix}_copy_${next}`
    })

    boardRepoMock.getById.mockResolvedValue(undefined)
    semanticNodeRepoMock.listByBoard.mockResolvedValue([])
    relationRepoMock.listByBoard.mockResolvedValue([])
    projectRepoMock.getById.mockResolvedValue(undefined)
  })

  it('duplicates node and rewires connected relations to the new node', async () => {
    const board = makeBoard('board_1', 'N2')
    const nodeA = makeNode('node_a')
    const nodeB = makeNode('node_b', { type: 'interface', data: { purpose: 'Define contract' } })
    const relationOut = makeRelation('rel_ab', 'node_a', 'node_b')
    const relationIn = makeRelation('rel_ba', 'node_b', 'node_a')

    const { state, action } = createHarness({
      currentBoard: board,
      nodes: [nodeA, nodeB],
      relations: [relationOut, relationIn]
    })

    const duplicated = await action('node_a')

    expect(duplicated).toBeDefined()
    expect(duplicated?.id).toBe('node_copy_1')
    expect(duplicated?.x).toBe(nodeA.x + 40)
    expect(duplicated?.y).toBe(nodeA.y + 40)
    expect(duplicated?.title).toBe('node_a (copy)')

    const duplicatedRelations = state.relations.filter((relation) => relation.id.startsWith('rel_copy_'))
    expect(duplicatedRelations).toHaveLength(2)
    expect(duplicatedRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceNodeId: 'node_copy_1', targetNodeId: 'node_b' }),
        expect.objectContaining({ sourceNodeId: 'node_b', targetNodeId: 'node_copy_1' })
      ])
    )
    expect(state.error).toBeUndefined()
    expect(state.dirty).toBe(true)
  })

  it('hardens invalid source payload and avoids required-field failure on duplicate', async () => {
    const board = makeBoard('board_1', 'N2')
    const node = makeNode('node_interface', {
      type: 'interface',
      data: {}
    })

    const { state, action } = createHarness({
      currentBoard: board,
      nodes: [node],
      relations: []
    })

    const duplicated = await action('node_interface')

    expect(duplicated).toBeDefined()
    expect(duplicated?.type).toBe('interface')
    expect(duplicated?.data).toEqual(
      expect.objectContaining({
        purpose: expect.any(String)
      })
    )
    expect(state.error).toBeUndefined()
  })

  it('deep-clones child board graph and links duplicate to cloned board', async () => {
    const rootBoard = makeBoard('board_root', 'N1')
    const sourceNode = makeNode('node_parent', {
      level: 'N1',
      type: 'system',
      boardId: rootBoard.id,
      childBoardId: 'board_child'
    })

    const childBoard: Board = {
      id: 'board_child',
      projectId: 'ws_1',
      parentBoardId: rootBoard.id,
      parentNodeId: sourceNode.id,
      level: 'N2',
      name: 'Child Board',
      nodeIds: ['child_node_a', 'child_node_b'],
      relationIds: ['child_rel_ab'],
      createdAt: now,
      updatedAt: now
    }
    const childNodeA = makeNode('child_node_a', {
      boardId: childBoard.id,
      level: 'N2',
      type: 'class'
    })
    const childNodeB = makeNode('child_node_b', {
      boardId: childBoard.id,
      level: 'N2',
      type: 'interface',
      data: { purpose: 'Contract' }
    })
    const childRelation: Relation = {
      ...makeRelation('child_rel_ab', childNodeA.id, childNodeB.id),
      boardId: childBoard.id
    }

    boardRepoMock.getById.mockResolvedValue(childBoard)
    semanticNodeRepoMock.listByBoard.mockResolvedValue([childNodeA, childNodeB])
    relationRepoMock.listByBoard.mockResolvedValue([childRelation])
    projectRepoMock.getById.mockResolvedValue({
      id: 'ws_1',
      name: 'Project',
      rootBoardId: rootBoard.id,
      boardIds: [rootBoard.id, childBoard.id],
      createdAt: now,
      updatedAt: now
    })

    const { state, action } = createHarness({
      currentBoard: rootBoard,
      nodes: [sourceNode],
      relations: []
    })

    const duplicated = await action(sourceNode.id)

    expect(duplicated).toBeDefined()
    expect(duplicated?.childBoardId).toBe('board_copy_1')

    expect(mockDb.boards.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'board_copy_1',
        parentBoardId: rootBoard.id,
        parentNodeId: duplicated?.id
      })
    )

    expect(mockDb.nodes.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ boardId: 'board_copy_1', id: 'node_copy_2' }),
        expect.objectContaining({ boardId: 'board_copy_1', id: 'node_copy_3' })
      ])
    )

    expect(mockDb.relations.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          boardId: 'board_copy_1',
          sourceNodeId: 'node_copy_2',
          targetNodeId: 'node_copy_3'
        })
      ])
    )

    expect(mockDb.projects.put).toHaveBeenCalledWith(
      expect.objectContaining({
        boardIds: expect.arrayContaining(['board_copy_1'])
      })
    )

    expect(state.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ childBoardId: 'board_copy_1' })]))
    expect(state.error).toBeUndefined()
  })
})
