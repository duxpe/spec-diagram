import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDb = vi.hoisted(() => {
  const createWhereDeleteTable = () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined)
    const equalsFn = vi.fn(() => ({ delete: deleteFn }))
    const whereFn = vi.fn(() => ({ equals: equalsFn }))
    return {
      where: whereFn,
      __deleteWhere: deleteFn
    }
  }

  return {
    projects: {
      get: vi.fn(),
      put: vi.fn().mockResolvedValue(undefined)
    },
    boards: {
      get: vi.fn(),
      put: vi.fn().mockResolvedValue(undefined)
    },
    nodes: {
      ...createWhereDeleteTable(),
      bulkPut: vi.fn().mockResolvedValue(undefined)
    },
    relations: {
      ...createWhereDeleteTable(),
      bulkPut: vi.fn().mockResolvedValue(undefined)
    },
    transaction: vi.fn(async (_mode: string, ...rest: unknown[]) => {
      const callback = rest[rest.length - 1] as () => Promise<void>
      return callback()
    })
  }
})

vi.mock('@/infrastructure/db/dexie', () => ({
  db: mockDb
}))

import {
  pruneRecovery,
  readBoardSnapshot,
  removeProjectRecovery,
  replayRecoveryIntoDexie,
  writeBoardSnapshot,
  writeProjectSnapshot
} from '@/infrastructure/db/recovery'

const now = new Date().toISOString()

function makeProject(projectId = 'project_1', updatedAt = now) {
  return {
    id: projectId,
    name: `Project ${projectId}`,
    rootBoardId: `${projectId}_board_root`,
    boardIds: [`${projectId}_board_root`],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt
  }
}

function makeBoard(projectId = 'project_1', boardId = 'board_1', updatedAt = now) {
  return {
    id: boardId,
    projectId,
    level: 'N1' as const,
    name: `Board ${boardId}`,
    nodeIds: [],
    relationIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt
  }
}

function makeNode(projectId = 'project_1', boardId = 'board_1', nodeId = 'node_1') {
  return {
    id: nodeId,
    projectId,
    boardId,
    level: 'N1' as const,
    type: 'free_note_input' as const,
    title: nodeId,
    x: 10,
    y: 10,
    width: 180,
    height: 90,
    data: {
      expectedInputsText: 'Input text'
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

function makeRelation(projectId = 'project_1', boardId = 'board_1', relationId = 'rel_1') {
  return {
    id: relationId,
    projectId,
    boardId,
    sourceNodeId: 'node_1',
    targetNodeId: 'node_1',
    type: 'depends_on' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('recovery local snapshots', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('writes and reads a valid board snapshot', () => {
    const board = makeBoard('project_1', 'board_1')
    const node = makeNode('project_1', 'board_1', 'node_1')
    const relation = makeRelation('project_1', 'board_1', 'rel_1')

    writeBoardSnapshot({
      board,
      nodes: [node],
      relations: [relation]
    })

    const record = readBoardSnapshot('project_1', 'board_1')

    expect(record).toBeDefined()
    expect(record?.board.id).toBe('board_1')
    expect(record?.board.nodeIds).toEqual(['node_1'])
    expect(record?.board.relationIds).toEqual(['rel_1'])
    expect(record?.nodes).toHaveLength(1)
    expect(record?.relations).toHaveLength(1)
  })

  it('returns undefined and cleans malformed board record', () => {
    localStorage.setItem('designer-recovery-v1:board:project_1:board_1', '{invalid')

    const record = readBoardSnapshot('project_1', 'board_1')

    expect(record).toBeUndefined()
    expect(localStorage.getItem('designer-recovery-v1:board:project_1:board_1')).toBeNull()
  })

  it('prunes snapshots by recency limits', () => {
    writeBoardSnapshot({
      board: makeBoard('project_1', 'board_1'),
      nodes: [makeNode('project_1', 'board_1', 'node_1')],
      relations: []
    })
    writeBoardSnapshot({
      board: makeBoard('project_1', 'board_2'),
      nodes: [makeNode('project_1', 'board_2', 'node_2')],
      relations: []
    })
    writeProjectSnapshot(makeProject('project_1'))
    writeProjectSnapshot(makeProject('project_2'))

    pruneRecovery(1, 1)

    const boardSnapshots = [
      readBoardSnapshot('project_1', 'board_1'),
      readBoardSnapshot('project_1', 'board_2')
    ].filter(Boolean)

    expect(boardSnapshots).toHaveLength(1)
    expect(
      [
        localStorage.getItem('designer-recovery-v1:project:project_1'),
        localStorage.getItem('designer-recovery-v1:project:project_2')
      ].filter(Boolean)
    ).toHaveLength(1)
  })

  it('removes project and related board snapshots on project cleanup', () => {
    writeProjectSnapshot(makeProject('project_1'))
    writeProjectSnapshot(makeProject('project_2'))
    writeBoardSnapshot({
      board: makeBoard('project_1', 'board_1'),
      nodes: [makeNode('project_1', 'board_1', 'node_1')],
      relations: []
    })
    writeBoardSnapshot({
      board: makeBoard('project_2', 'board_2'),
      nodes: [makeNode('project_2', 'board_2', 'node_2')],
      relations: []
    })

    removeProjectRecovery('project_1')

    expect(localStorage.getItem('designer-recovery-v1:project:project_1')).toBeNull()
    expect(readBoardSnapshot('project_1', 'board_1')).toBeUndefined()
    expect(localStorage.getItem('designer-recovery-v1:project:project_2')).not.toBeNull()
    expect(readBoardSnapshot('project_2', 'board_2')).toBeDefined()
  })
})

describe('replayRecoveryIntoDexie', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('replays newer project and board snapshots into Dexie', async () => {
    const project = makeProject('project_1', '2026-01-03T00:00:00.000Z')
    const board = makeBoard('project_1', 'board_1', '2026-01-03T00:00:00.000Z')
    const node = makeNode('project_1', 'board_1', 'node_1')
    const relation = makeRelation('project_1', 'board_1', 'rel_1')

    writeProjectSnapshot(project)
    writeBoardSnapshot({
      board,
      nodes: [node],
      relations: [relation]
    })

    mockDb.projects.get.mockResolvedValue({
      ...project,
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
    mockDb.boards.get.mockResolvedValue({
      ...board,
      updatedAt: '2026-01-01T00:00:00.000Z'
    })

    await replayRecoveryIntoDexie()

    expect(mockDb.projects.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'project_1' }))
    expect(mockDb.boards.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'board_1' }))
    expect(mockDb.nodes.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.nodes.bulkPut).toHaveBeenCalledWith([expect.objectContaining({ id: 'node_1' })])
    expect(mockDb.relations.__deleteWhere).toHaveBeenCalledTimes(1)
    expect(mockDb.relations.bulkPut).toHaveBeenCalledWith([expect.objectContaining({ id: 'rel_1' })])
  })

  it('skips replay when Dexie already has newer data', async () => {
    const project = makeProject('project_1', '2026-01-01T00:00:00.000Z')
    const board = makeBoard('project_1', 'board_1', '2026-01-01T00:00:00.000Z')

    writeProjectSnapshot(project)
    writeBoardSnapshot({
      board,
      nodes: [makeNode('project_1', 'board_1', 'node_1')],
      relations: []
    })

    mockDb.projects.get.mockResolvedValue({
      ...project,
      updatedAt: '2026-01-04T00:00:00.000Z'
    })
    mockDb.boards.get.mockResolvedValue({
      ...board,
      updatedAt: '2026-01-04T00:00:00.000Z'
    })

    await replayRecoveryIntoDexie()

    expect(mockDb.projects.put).not.toHaveBeenCalled()
    expect(mockDb.boards.put).not.toHaveBeenCalled()
  })
})
