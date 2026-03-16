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

vi.mock('@/features/project/model/app-store', () => ({
  useAppStore: {
    getState: () => ({ setLastContext: vi.fn() })
  }
}))

import { useBoardStore } from '@/features/board/model/board-store'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'

const boardRepoMock = boardRepo as unknown as { getById: ReturnType<typeof vi.fn> }

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
    useBoardStore.setState({
      currentBoard: makeBoard(),
      parentContext: undefined,
      nodes: [makeNode('node_a')],
      relations: [],
      dirty: true,
      error: undefined,
      loading: false,
      saving: false
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
})
