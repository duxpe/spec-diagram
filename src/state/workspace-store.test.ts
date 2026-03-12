import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDb = vi.hoisted(() => {
  const createWhereDeleteTable = () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined)
    const equalsFn = vi.fn(() => ({ delete: deleteFn }))
    const whereFn = vi.fn(() => ({ equals: equalsFn }))
    return { where: whereFn, __deleteWhere: deleteFn }
  }

  return {
    workspaces: { delete: vi.fn().mockResolvedValue(undefined) },
    boards: createWhereDeleteTable(),
    nodes: createWhereDeleteTable(),
    relations: createWhereDeleteTable(),
    exports: createWhereDeleteTable(),
    transaction: vi.fn(async (_mode: string, ...rest: unknown[]) => {
      const callback = rest[rest.length - 1] as () => Promise<void>
      return callback()
    })
  }
})

const setLastContext = vi.hoisted(() => vi.fn())

vi.mock('@/db/dexie', () => ({
  db: mockDb,
  __mockDb: mockDb
}))

vi.mock('@/db/repositories/workspace-repo', () => ({
  workspaceRepo: {
    list: vi.fn(),
    getById: vi.fn()
  }
}))

vi.mock('@/db/repositories/board-repo', () => ({
  boardRepo: {
    listByWorkspace: vi.fn()
  }
}))

vi.mock('@/state/app-store', () => ({
  useAppStore: {
    getState: () => ({ setLastContext })
  }
}))

import { useWorkspaceStore } from '@/state/workspace-store'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { boardRepo } from '@/db/repositories/board-repo'

const workspaceRepoMock = workspaceRepo as unknown as {
  list: ReturnType<typeof vi.fn>
  getById: ReturnType<typeof vi.fn>
}

const boardRepoMock = boardRepo as unknown as {
  listByWorkspace: ReturnType<typeof vi.fn>
}

describe('workspace-store deleteWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorkspaceStore.setState({
      loading: false,
      error: undefined,
      workspaces: [],
      boards: [],
      currentWorkspace: undefined
    })
  })

  it('hard deletes workspace data and clears state when list is empty', async () => {
    workspaceRepoMock.getById.mockResolvedValue({
      id: 'ws_1',
      name: 'Workspace',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    workspaceRepoMock.list.mockResolvedValue([])
    boardRepoMock.listByWorkspace.mockResolvedValue([])

    await useWorkspaceStore.getState().deleteWorkspace('ws_1')

    expect(mockDb.workspaces.delete).toHaveBeenCalledWith('ws_1')
    expect(mockDb.boards.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.nodes.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.relations.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.exports.__deleteWhere).toHaveBeenCalledTimes(1)

    const state = useWorkspaceStore.getState()
    expect(state.workspaces).toEqual([])
    expect(state.currentWorkspace).toBeUndefined()
    expect(state.boards).toEqual([])
    expect(setLastContext).toHaveBeenCalledWith(undefined, undefined)
  })
})
