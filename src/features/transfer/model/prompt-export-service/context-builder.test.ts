import { describe, expect, it } from 'vitest'
import type { Board } from '@/domain/models/board'
import type { Project } from '@/domain/models/project'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { buildExportContexts } from '@/features/transfer/model/prompt-export-service/context-builder'

const now = '2026-03-16T00:00:00.000Z'

describe('prompt-export context builder', () => {
  it('builds N1 root contexts with nested N2/N3 details', () => {
    const project: Project = {
      id: 'project_1',
      name: 'Payments',
      rootBoardId: 'board_n1',
      boardIds: ['board_n1', 'board_n2'],
      createdAt: now,
      updatedAt: now
    }

    const boards: Board[] = [
      {
        id: 'board_n1',
        projectId: 'project_1',
        level: 'N1',
        name: 'Root',
        nodeIds: [],
        relationIds: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'board_n2',
        projectId: 'project_1',
        parentBoardId: 'board_n1',
        parentNodeId: 'node_root',
        level: 'N2',
        name: 'Detail',
        nodeIds: [],
        relationIds: [],
        createdAt: now,
        updatedAt: now
      }
    ]

    const nodes: SemanticNode[] = [
      {
        id: 'node_root',
        projectId: 'project_1',
        boardId: 'board_n1',
        level: 'N1',
        type: 'system',
        title: 'Root service',
        x: 0,
        y: 0,
        width: 220,
        height: 110,
        childBoardId: 'board_n2',
        data: {},
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'node_class',
        projectId: 'project_1',
        boardId: 'board_n2',
        level: 'N2',
        type: 'class',
        title: 'AccountService',
        x: 0,
        y: 0,
        width: 220,
        height: 110,
        data: {
          internals: {
            methods: [{ name: 'execute' }],
            attributes: [{ name: 'accountId' }]
          }
        },
        createdAt: now,
        updatedAt: now
      }
    ]

    const relations: Relation[] = [
      {
        id: 'rel_1',
        projectId: 'project_1',
        boardId: 'board_n1',
        sourceNodeId: 'node_root',
        targetNodeId: 'node_root',
        type: 'depends_on',
        createdAt: now,
        updatedAt: now
      }
    ]

    const contexts = buildExportContexts({
      project,
      boards,
      nodes,
      relations,
      exportType: 'spec_prompt'
    })

    expect(contexts).toHaveLength(1)
    expect(contexts[0]?.n2Nodes[0]?.n3Nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'method', title: 'execute' }),
        expect.objectContaining({ type: 'attribute', title: 'accountId' })
      ])
    )
  })
})
