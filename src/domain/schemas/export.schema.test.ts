import { describe, expect, it } from 'vitest'
import { workspaceExportFileSchema } from '@/domain/schemas/export.schema'

function buildValidExportPayload() {
  const now = new Date().toISOString()

  return {
    version: '1.0.0' as const,
    exportedAt: now,
    workspace: {
      id: 'ws_1',
      name: 'Workspace',
      rootBoardId: 'board_1',
      boardIds: ['board_1'],
      createdAt: now,
      updatedAt: now
    },
    boards: [
      {
        id: 'board_1',
        workspaceId: 'ws_1',
        level: 'N1' as const,
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
        workspaceId: 'ws_1',
        boardId: 'board_1',
        level: 'N1' as const,
        type: 'system' as const,
        title: 'System',
        x: 10,
        y: 20,
        width: 200,
        height: 120,
        data: {},
        createdAt: now,
        updatedAt: now
      }
    ],
    relations: [
      {
        id: 'rel_1',
        workspaceId: 'ws_1',
        boardId: 'board_1',
        sourceNodeId: 'node_1',
        targetNodeId: 'node_1',
        type: 'depends_on' as const,
        createdAt: now,
        updatedAt: now
      }
    ]
  }
}

describe('workspaceExportFileSchema', () => {
  it('accepts valid payload', () => {
    const parsed = workspaceExportFileSchema.parse(buildValidExportPayload())
    expect(parsed.workspace.id).toBe('ws_1')
    expect(parsed.version).toBe('1.0.0')
  })

  it('rejects invalid semantic level', () => {
    const payload = buildValidExportPayload()
    payload.boards[0]!.level = 'N4' as 'N1'

    expect(() => workspaceExportFileSchema.parse(payload)).toThrowError()
  })
})
