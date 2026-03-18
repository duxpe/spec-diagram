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
const replayRecoveryIntoDexie = vi.hoisted(() => vi.fn(async () => undefined))
const removeProjectRecovery = vi.hoisted(() => vi.fn())

vi.mock('@/infrastructure/db/dexie', () => ({
  db: mockDb,
  __mockDb: mockDb
}))

vi.mock('@/infrastructure/db/repositories/project-repo', () => ({
  projectRepo: {
    list: vi.fn(),
    getById: vi.fn(),
    upsert: vi.fn()
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

vi.mock('@/infrastructure/db/recovery', () => ({
  replayRecoveryIntoDexie,
  removeProjectRecovery
}))

import { useProjectStore } from '@/features/project/model/project-store'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'

const projectRepoMock = projectRepo as unknown as {
  list: ReturnType<typeof vi.fn>
  getById: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
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
    expect(removeProjectRecovery).toHaveBeenCalledWith('ws_1')

    const state = useProjectStore.getState()
    expect(state.projects).toEqual([])
    expect(state.currentProject).toBeUndefined()
    expect(state.boards).toEqual([])
    expect(setLastContext).toHaveBeenCalledWith(undefined, undefined)
  })
})

describe('project-store bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProjectStore.setState({
      loading: true,
      error: undefined,
      projects: [],
      boards: [],
      currentProject: undefined
    })
  })

  it('replays recovery data before loading projects', async () => {
    const project = {
      id: 'ws_1',
      name: 'Recovered',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const board = {
      id: 'board_1',
      projectId: 'ws_1',
      level: 'N1' as const,
      name: 'Board',
      nodeIds: [],
      relationIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projectRepoMock.list.mockResolvedValue([project])
    boardRepoMock.listByProject.mockResolvedValue([board])

    await useProjectStore.getState().bootstrap()

    expect(replayRecoveryIntoDexie).toHaveBeenCalledTimes(1)
    expect(useProjectStore.getState().currentProject?.id).toBe('ws_1')
    expect(useProjectStore.getState().boards).toEqual([board])
  })
})

describe('project-store updateProject', () => {
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

  it('ignores architecturePattern changes on update', async () => {
    const existingProject = {
      id: 'ws_1',
      name: 'Project',
      description: 'Old description',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      architecturePattern: 'hexagonal' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projectRepoMock.getById.mockResolvedValue(existingProject)
    projectRepoMock.list.mockResolvedValue([existingProject])
    boardRepoMock.listByProject.mockResolvedValue([])

    const updated = await useProjectStore.getState().updateProject('ws_1', {
      name: 'Updated name',
      architecturePattern: 'microservices'
    })

    expect(projectRepoMock.upsert).toHaveBeenCalledTimes(1)
    expect(projectRepoMock.upsert.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        id: 'ws_1',
        name: 'Updated name',
        architecturePattern: 'hexagonal'
      })
    )
    expect(updated?.architecturePattern).toBe('hexagonal')
    expect(useProjectStore.getState().currentProject?.architecturePattern).toBe('hexagonal')
  })
})
