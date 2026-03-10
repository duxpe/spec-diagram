import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Workspace } from '@/domain/models/workspace'
import {
  buildPromptExportBundle,
  buildPromptZipFileName,
  createPromptZipBytes
} from '@/domain/services/prompt-export-service'

const now = '2026-03-10T00:00:00.000Z'

function buildFixture() {
  const workspace: Workspace = {
    id: 'ws_1',
    name: 'Payments Platform',
    description: 'Sistema de pagamentos modular',
    rootBoardId: 'board_n1',
    boardIds: ['board_n1', 'board_n2', 'board_n3'],
    createdAt: now,
    updatedAt: now
  }

  const boards: Board[] = [
    {
      id: 'board_n1',
      workspaceId: 'ws_1',
      level: 'N1',
      name: 'Root Board',
      nodeIds: [],
      relationIds: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'board_n2',
      workspaceId: 'ws_1',
      parentBoardId: 'board_n1',
      parentNodeId: 'node_sys',
      level: 'N2',
      name: 'Payments Service detail',
      nodeIds: [],
      relationIds: [],
      createdAt: '2026-03-10T00:10:00.000Z',
      updatedAt: now
    },
    {
      id: 'board_n3',
      workspaceId: 'ws_1',
      parentBoardId: 'board_n2',
      parentNodeId: 'node_class',
      level: 'N3',
      name: 'AccountService detail',
      nodeIds: [],
      relationIds: [],
      createdAt: '2026-03-10T00:20:00.000Z',
      updatedAt: now
    }
  ]

  const nodes: SemanticNode[] = [
    {
      id: 'node_sys',
      workspaceId: 'ws_1',
      boardId: 'board_n1',
      level: 'N1',
      type: 'system',
      title: 'Payments Service',
      description: 'Orquestra pagamentos',
      x: 10,
      y: 10,
      width: 220,
      height: 110,
      childBoardId: 'board_n2',
      data: {
        goal: 'Processar pagamentos'
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'node_decision',
      workspaceId: 'ws_1',
      boardId: 'board_n1',
      level: 'N1',
      type: 'decision',
      title: 'Adotar eventos',
      x: 10,
      y: 180,
      width: 220,
      height: 110,
      data: {
        decision: 'Processamento assíncrono'
      },
      createdAt: '2026-03-10T00:01:00.000Z',
      updatedAt: now
    },
    {
      id: 'node_note',
      workspaceId: 'ws_1',
      boardId: 'board_n1',
      level: 'N1',
      type: 'free_note_input',
      title: 'Input de negocio',
      x: 10,
      y: 340,
      width: 220,
      height: 110,
      data: {
        expectedInputsText: 'payment_id e customer_id'
      },
      createdAt: '2026-03-10T00:02:00.000Z',
      updatedAt: now
    },
    {
      id: 'node_class',
      workspaceId: 'ws_1',
      boardId: 'board_n2',
      level: 'N2',
      type: 'class',
      title: 'AccountService',
      x: 20,
      y: 20,
      width: 220,
      height: 110,
      childBoardId: 'board_n3',
      data: {
        responsibility: 'Aplicar regras de conta'
      },
      createdAt: '2026-03-10T00:11:00.000Z',
      updatedAt: now
    },
    {
      id: 'node_interface',
      workspaceId: 'ws_1',
      boardId: 'board_n2',
      level: 'N2',
      type: 'interface',
      title: 'AccountGateway',
      x: 280,
      y: 20,
      width: 220,
      height: 110,
      data: {
        purpose: 'Contrato de acesso externo'
      },
      createdAt: '2026-03-10T00:12:00.000Z',
      updatedAt: now
    },
    {
      id: 'node_method',
      workspaceId: 'ws_1',
      boardId: 'board_n3',
      level: 'N3',
      type: 'method',
      title: 'execute',
      x: 20,
      y: 20,
      width: 220,
      height: 110,
      data: {
        signature: 'execute(input): output',
        purpose: 'Executar comando'
      },
      createdAt: '2026-03-10T00:21:00.000Z',
      updatedAt: now
    },
    {
      id: 'node_attribute',
      workspaceId: 'ws_1',
      boardId: 'board_n3',
      level: 'N3',
      type: 'attribute',
      title: 'accountId',
      x: 280,
      y: 20,
      width: 220,
      height: 110,
      data: {
        typeSignature: 'string',
        purpose: 'Identificador da conta'
      },
      createdAt: '2026-03-10T00:22:00.000Z',
      updatedAt: now
    }
  ]

  const relations: Relation[] = [
    {
      id: 'rel_n1',
      workspaceId: 'ws_1',
      boardId: 'board_n1',
      sourceNodeId: 'node_sys',
      targetNodeId: 'node_decision',
      type: 'depends_on',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'rel_n2',
      workspaceId: 'ws_1',
      boardId: 'board_n2',
      sourceNodeId: 'node_class',
      targetNodeId: 'node_interface',
      type: 'implements',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'rel_n3',
      workspaceId: 'ws_1',
      boardId: 'board_n3',
      sourceNodeId: 'node_method',
      targetNodeId: 'node_attribute',
      type: 'uses',
      createdAt: now,
      updatedAt: now
    }
  ]

  return { workspace, boards, nodes, relations }
}

describe('prompt-export-service', () => {
  it('generates one prompt per N1 node and includes N2/N3 descendants for each branch', () => {
    const fixture = buildFixture()

    const bundle = buildPromptExportBundle({
      ...fixture,
      exportType: 'spec_prompt',
      exportedAt: now
    })

    expect(bundle.items).toHaveLength(3)
    expect(bundle.items.map((item) => item.rootNodeType)).toEqual([
      'decision',
      'free_note_input',
      'system'
    ])

    const systemPrompt = bundle.items.find((item) => item.rootNodeId === 'node_sys')
    expect(systemPrompt?.markdown).toContain('### class - AccountService')
    expect(systemPrompt?.markdown).toContain('#### method - execute')
    expect(systemPrompt?.markdown).toContain('## Contratos, interfaces e integracoes')
  })

  it('is deterministic even when input arrays are shuffled', () => {
    const fixture = buildFixture()

    const bundleA = buildPromptExportBundle({
      ...fixture,
      exportType: 'task_prompt',
      exportedAt: now
    })

    const bundleB = buildPromptExportBundle({
      workspace: fixture.workspace,
      boards: [...fixture.boards].reverse(),
      nodes: [...fixture.nodes].reverse(),
      relations: [...fixture.relations].reverse(),
      exportType: 'task_prompt',
      exportedAt: now
    })

    expect(bundleA.items.map((item) => item.filename)).toEqual(bundleB.items.map((item) => item.filename))
    expect(bundleA.items.map((item) => item.markdown)).toEqual(bundleB.items.map((item) => item.markdown))
  })

  it('creates zip with index and one markdown file per prompt', async () => {
    const fixture = buildFixture()
    const bundle = buildPromptExportBundle({
      ...fixture,
      exportType: 'spec_prompt',
      exportedAt: now
    })

    const zipBytes = await createPromptZipBytes(bundle)
    const zip = await JSZip.loadAsync(zipBytes)
    const zipFiles = Object.keys(zip.files)

    expect(zipFiles).toContain('index.md')
    for (const item of bundle.items) {
      expect(zipFiles).toContain(item.filename)
    }

    const indexContent = await zip.file('index.md')?.async('string')
    expect(indexContent).toContain('Prompt Export Bundle')
    expect(indexContent).toContain(bundle.workspaceName)
  })

  it('builds deterministic zip file name from bundle metadata', () => {
    const fixture = buildFixture()
    const bundle = buildPromptExportBundle({
      ...fixture,
      exportType: 'task_prompt',
      exportedAt: now
    })

    expect(buildPromptZipFileName(bundle)).toContain('task_prompt')
    expect(buildPromptZipFileName(bundle)).toContain('.zip')
  })
})
