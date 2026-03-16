import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDb = vi.hoisted(() => {
  const createWhereDeleteTable = () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined)
    const equalsFn = vi.fn(() => ({ delete: deleteFn }))
    const whereFn = vi.fn(() => ({ equals: equalsFn }))
    return { where: whereFn, __deleteWhere: deleteFn }
  }

  return {
    projects: { delete: vi.fn().mockResolvedValue(undefined) },
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

vi.mock('@/infrastructure/db/dexie', () => ({
  db: mockDb,
  __mockDb: mockDb
}))

vi.mock('@/infrastructure/db/repositories/project-repo', () => ({
  projectRepo: {
    list: vi.fn(),
    getById: vi.fn()
  }
}))

vi.mock('@/infrastructure/db/repositories/board-repo', () => ({
  boardRepo: {
    listByProject: vi.fn()
  }
}))

vi.mock('@/features/project/model/app-store', () => ({
  useAppStore: {
    getState: () => ({ setLastContext })
  }
}))

import { useProjectStore } from '@/features/project/model/project-store'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'

const projectRepoMock = projectRepo as unknown as {
  list: ReturnType<typeof vi.fn>
  getById: ReturnType<typeof vi.fn>
}

const boardRepoMock = boardRepo as unknown as {
  listByProject: ReturnType<typeof vi.fn>
}

describe('project-store deleteProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProjectStore.setState({
      loading: false,
      error: undefined,
      projects: [],
      boards: [],
      currentProject: undefined
    })
  })

  it('hard deletes project data and clears state when list is empty', async () => {
    projectRepoMock.getById.mockResolvedValue({
      id: 'ws_1',
      name: 'Project',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    projectRepoMock.list.mockResolvedValue([])
    boardRepoMock.listByProject.mockResolvedValue([])

    await useProjectStore.getState().deleteProject('ws_1')

    expect(mockDb.projects.delete).toHaveBeenCalledWith('ws_1')
    expect(mockDb.boards.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.nodes.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.relations.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.exports.__deleteWhere).toHaveBeenCalledTimes(1)

    const state = useProjectStore.getState()
    expect(state.projects).toEqual([])
    expect(state.currentProject).toBeUndefined()
    expect(state.boards).toEqual([])
    expect(setLastContext).toHaveBeenCalledWith(undefined, undefined)
  })
})
