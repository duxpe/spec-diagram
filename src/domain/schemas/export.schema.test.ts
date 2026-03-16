import { describe, expect, it } from 'vitest'
import { ProjectExportFile } from '@/domain/models/export'
import { projectExportFileSchema } from '@/domain/schemas/export.schema'

function buildValidExportPayload(): ProjectExportFile {
  const now = new Date().toISOString()

  return {
    version: '2.0.0',
    exportedAt: now,
    project: {
      id: 'ws_1',
      name: 'Project',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      createdAt: now,
      updatedAt: now
    },
    boards: [
      {
        id: 'board_1',
        projectId: 'ws_1',
        level: 'N1',
        name: 'Root Board',
        nodeIds: ['node_1'],
        relationIds: ['rel_1'],
        createdAt: now,
        updatedAt: now
      }
    ],
    nodes: [
      {
        id: 'node_1',
        projectId: 'ws_1',
        boardId: 'board_1',
        level: 'N1',
        type: 'system',
        title: 'System',
        x: 10,
        y: 20,
        width: 200,
        height: 120,
        data: {
          goal: 'Define system context',
          primaryResponsibilities: ['Coordinate architecture']
        },
        createdAt: now,
        updatedAt: now
      }
    ],
    relations: [
      {
        id: 'rel_1',
        projectId: 'ws_1',
        boardId: 'board_1',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_1',
        type: 'depends_on',
        createdAt: now,
        updatedAt: now
      }
    ]
  }
}

describe('projectExportFileSchema', () => {
  it('accepts valid payload', () => {
    const parsed = projectExportFileSchema.parse(buildValidExportPayload())
    expect(parsed.project.id).toBe('ws_1')
    expect(parsed.version).toBe('2.0.0')
  })

  it('rejects invalid semantic level', () => {
    const payload = buildValidExportPayload()
    payload.boards[0]!.level = 'N4' as 'N1'

    expect(() => projectExportFileSchema.parse(payload)).toThrowError()
  })

})
