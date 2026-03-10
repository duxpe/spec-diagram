import { describe, expect, it } from 'vitest'
import { WorkspaceExportFile } from '@/domain/models/export'
import { workspaceExportFileSchema } from '@/domain/schemas/export.schema'

function buildValidExportPayload(): WorkspaceExportFile {
  const now = new Date().toISOString()

  return {
    version: '1.0.0',
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
        workspaceId: 'ws_1',
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
        workspaceId: 'ws_1',
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

  it('accepts valid N3 method payload', () => {
    const payload = buildValidExportPayload()

    payload.boards[0] = {
      ...payload.boards[0]!,
      level: 'N3',
      name: 'Detail Board'
    }
    payload.nodes[0] = {
      ...payload.nodes[0]!,
      level: 'N3',
      type: 'method',
      title: 'execute',
      data: {
        signature: 'execute(input): output',
        purpose: 'Process command'
      }
    }

    const parsed = workspaceExportFileSchema.parse(payload)
    expect(parsed.nodes[0]?.type).toBe('method')
  })

  it('rejects invalid N3 method payload with missing required fields', () => {
    const payload = buildValidExportPayload()

    payload.boards[0] = {
      ...payload.boards[0]!,
      level: 'N3',
      name: 'Detail Board'
    }
    payload.nodes[0] = {
      ...payload.nodes[0]!,
      level: 'N3',
      type: 'method',
      title: 'execute',
      data: {
        signature: '',
        purpose: ''
      }
    }

    expect(() => workspaceExportFileSchema.parse(payload)).toThrowError()
  })
})
