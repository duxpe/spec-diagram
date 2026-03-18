import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infrastructure/db/repositories/board-repo', () => ({
  boardRepo: { getById: vi.fn() }
}))

vi.mock('@/infrastructure/db/repositories/semantic-node-repo', () => ({
  semanticNodeRepo: { listByBoard: vi.fn() }
}))

vi.mock('@/infrastructure/db/repositories/relation-repo', () => ({
  relationRepo: { listByBoard: vi.fn() }
}))

vi.mock('@/infrastructure/db/recovery', () => ({
  readBoardSnapshot: vi.fn()
}))

vi.mock('@/features/project/model/app-store', () => ({
  useAppStore: {
    getState: () => ({ setLastContext: vi.fn() })
  }
}))

import { useBoardStore } from '@/features/board/model/board-store'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { relationRepo } from '@/infrastructure/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import { readBoardSnapshot } from '@/infrastructure/db/recovery'

const boardRepoMock = boardRepo as unknown as { getById: ReturnType<typeof vi.fn> }
const semanticNodeRepoMock = semanticNodeRepo as unknown as { listByBoard: ReturnType<typeof vi.fn> }
const relationRepoMock = relationRepo as unknown as { listByBoard: ReturnType<typeof vi.fn> }
const readBoardSnapshotMock = readBoardSnapshot as unknown as ReturnType<typeof vi.fn>
const originalSaveCurrentBoard = useBoardStore.getState().saveCurrentBoard

const now = new Date().toISOString()

function makeBoard(id = 'board_1', projectId = 'ws_1') {
  return {
    id,
    projectId,
    level: 'N1' as const,
    name: 'Board',
    nodeIds: [],
    relationIds: [],
    createdAt: now,
    updatedAt: now
  }
}

function makeNode(id: string) {
  return {
    id,
    projectId: 'ws_1',
    boardId: 'board_1',
    level: 'N1' as const,
    type: 'system' as const,
    title: id,
    x: 10,
    y: 10,
    width: 200,
    height: 120,
    data: {},
    createdAt: now,
    updatedAt: now
  }
}

describe('board-store loadBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    boardRepoMock.getById.mockResolvedValue(makeBoard())
    semanticNodeRepoMock.listByBoard.mockResolvedValue([])
    relationRepoMock.listByBoard.mockResolvedValue([])
    readBoardSnapshotMock.mockReturnValue(undefined)
    useBoardStore.setState({
      currentBoard: makeBoard(),
      parentContext: undefined,
      nodes: [makeNode('node_a')],
      relations: [],
      dirty: true,
      error: undefined,
      loading: false,
      saving: false,
      saveCurrentBoard: originalSaveCurrentBoard
    })
  })

  it('clears stale state when board is not found for project', async () => {
    boardRepoMock.getById.mockResolvedValue(undefined)

    await useBoardStore.getState().loadBoard('ws_missing', 'board_missing')

    const state = useBoardStore.getState()
    expect(state.currentBoard).toBeUndefined()
    expect(state.nodes).toEqual([])
    expect(state.relations).toEqual([])
    expect(state.dirty).toBe(false)
    expect(state.error).toBe('Board not found for project')
  })

  it('loads board from recovery snapshot when board is missing in Dexie', async () => {
    boardRepoMock.getById.mockResolvedValue(undefined)
    const recoveryBoard = makeBoard('board_1', 'ws_1')
    const recoveryNode = makeNode('node_from_recovery')
    const saveSpy = vi.fn(async () => true)

    readBoardSnapshotMock.mockReturnValue({
      version: 1,
      kind: 'board',
      key: 'designer-recovery-v1:board:ws_1:board_1',
      projectId: 'ws_1',
      boardId: 'board_1',
      board: recoveryBoard,
      nodes: [recoveryNode],
      relations: [],
      capturedAt: now
    })

    useBoardStore.setState({
      saveCurrentBoard: saveSpy
    })

    await useBoardStore.getState().loadBoard('ws_1', 'board_1')

    const state = useBoardStore.getState()
    expect(state.currentBoard?.id).toBe('board_1')
    expect(state.nodes.map((node) => node.id)).toEqual(['node_from_recovery'])
    expect(state.dirty).toBe(true)
    expect(state.error).toBeUndefined()
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('prefers newer recovery board over stale Dexie board and schedules convergence save', async () => {
    const staleBoard = {
      ...makeBoard('board_1', 'ws_1'),
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
    const staleNode = makeNode('node_stale')
    boardRepoMock.getById.mockResolvedValue(staleBoard)
    semanticNodeRepoMock.listByBoard.mockResolvedValue([staleNode])

    const freshBoard = {
      ...makeBoard('board_1', 'ws_1'),
      updatedAt: '2026-01-03T00:00:00.000Z'
    }
    const freshNode = makeNode('node_fresh')
    const saveSpy = vi.fn(async () => true)

    readBoardSnapshotMock.mockReturnValue({
      version: 1,
      kind: 'board',
      key: 'designer-recovery-v1:board:ws_1:board_1',
      projectId: 'ws_1',
      boardId: 'board_1',
      board: freshBoard,
      nodes: [freshNode],
      relations: [],
      capturedAt: now
    })

    useBoardStore.setState({
      saveCurrentBoard: saveSpy
    })

    await useBoardStore.getState().loadBoard('ws_1', 'board_1')

    const state = useBoardStore.getState()
    expect(state.currentBoard?.updatedAt).toBe('2026-01-03T00:00:00.000Z')
    expect(state.nodes.map((node) => node.id)).toEqual(['node_fresh'])
    expect(state.dirty).toBe(true)
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })
})
