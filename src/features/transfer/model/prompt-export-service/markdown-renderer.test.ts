import { describe, expect, it } from 'vitest'
import type { ExportContext } from '@/features/transfer/model/prompt-export-service/types'
import { renderPromptMarkdown } from '@/features/transfer/model/prompt-export-service/markdown-renderer'

const baseContext: ExportContext = {
  project: {
    id: 'project_1',
    name: 'Payments',
    rootBoardId: 'board_n1',
    boardIds: ['board_n1'],
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z'
  },
  rootBoard: {
    id: 'board_n1',
    projectId: 'project_1',
    level: 'N1',
    name: 'Root',
    nodeIds: [],
    relationIds: [],
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z'
  },
  rootNode: {
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
    data: {},
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z'
  },
  rootRelations: [],
  globalNotes: [],
  globalDecisions: [],
  n2Nodes: []
}

describe('prompt-export markdown renderer', () => {
  it('renders both spec and task prompt variants with root node title', () => {
    const spec = renderPromptMarkdown(baseContext, 'spec_prompt')
    const task = renderPromptMarkdown(baseContext, 'task_prompt')

    expect(spec).toContain('# Spec Prompt - Root service')
    expect(task).toContain('# Task Prompt - Root service')
  })
})
