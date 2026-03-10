import JSZip from 'jszip'
import { Board } from '@/domain/models/board'
import { PromptExportBundle, PromptExportItem, ExportPromptType } from '@/domain/models/export'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { Workspace } from '@/domain/models/workspace'

const MISSING_TEXT = 'Nao informado'

interface PromptExportBuildInput {
  workspace: Workspace
  boards: Board[]
  nodes: SemanticNode[]
  relations: Relation[]
  exportType: ExportPromptType
  exportedAt?: string
}

interface RelationDescriptor {
  id: string
  type: Relation['type']
  label?: string
  sourceNodeId: string
  sourceTitle: string
  targetNodeId: string
  targetTitle: string
  createdAt: string
}

interface N3NodeContext {
  node: SemanticNode
  relations: RelationDescriptor[]
}

interface N2NodeContext {
  node: SemanticNode
  relations: RelationDescriptor[]
  n3Nodes: N3NodeContext[]
}

interface ExportContext {
  workspace: Workspace
  rootBoard: Board
  rootNode: SemanticNode
  rootRelations: RelationDescriptor[]
  globalNotes: SemanticNode[]
  globalDecisions: SemanticNode[]
  n2Nodes: N2NodeContext[]
}

function textValue(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return MISSING_TEXT
}

function listValue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
}

function compareNodes(a: SemanticNode, b: SemanticNode): number {
  return (
    compareText(a.type, b.type) ||
    compareText(a.title, b.title) ||
    compareText(a.createdAt, b.createdAt) ||
    compareText(a.id, b.id)
  )
}

function compareRelations(a: RelationDescriptor, b: RelationDescriptor): number {
  return (
    compareText(a.type, b.type) ||
    compareText(a.sourceTitle, b.sourceTitle) ||
    compareText(a.targetTitle, b.targetTitle) ||
    compareText(a.createdAt, b.createdAt) ||
    compareText(a.id, b.id)
  )
}

function compareBoards(a: Board, b: Board): number {
  return compareText(a.createdAt, b.createdAt) || compareText(a.id, b.id)
}

function formatNodeData(data: Record<string, unknown>): string[] {
  const keys = Object.keys(data).sort((a, b) => compareText(a, b))
  if (keys.length === 0) return [`- ${MISSING_TEXT}`]

  return keys.map((key) => {
    const value = data[key]
    if (Array.isArray(value)) {
      const list = listValue(value)
      return `- ${key}: ${list.length > 0 ? list.join('; ') : MISSING_TEXT}`
    }

    if (typeof value === 'object' && value !== null) {
      return `- ${key}: ${JSON.stringify(value)}`
    }

    return `- ${key}: ${textValue(value)}`
  })
}

function formatRelations(relations: RelationDescriptor[]): string[] {
  if (relations.length === 0) return [`- ${MISSING_TEXT}`]

  return relations.map((relation) => {
    const label = relation.label ? ` [${relation.label}]` : ''
    return `- ${relation.sourceTitle} --${relation.type}${label}--> ${relation.targetTitle}`
  })
}

function formatNodes(nodes: SemanticNode[]): string[] {
  if (nodes.length === 0) return [`- ${MISSING_TEXT}`]

  return nodes.map((node) => `- ${node.type}: ${textValue(node.title)}`)
}

function firstDefinedText(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (Array.isArray(value)) {
      const list = listValue(value)
      if (list.length > 0) return list.join('; ')
    }
  }

  return MISSING_TEXT
}

function relationToDescriptor(
  relation: Relation,
  nodesById: Map<string, SemanticNode>
): RelationDescriptor | undefined {
  const source = nodesById.get(relation.sourceNodeId)
  const target = nodesById.get(relation.targetNodeId)
  if (!source || !target) return undefined

  return {
    id: relation.id,
    type: relation.type,
    label: relation.label,
    sourceNodeId: relation.sourceNodeId,
    sourceTitle: source.title,
    targetNodeId: relation.targetNodeId,
    targetTitle: target.title,
    createdAt: relation.createdAt
  }
}

function toSlug(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized.length === 0) return 'node'
  return normalized.slice(0, 60)
}

function findChildBoard(
  node: SemanticNode,
  expectedLevel: Board['level'],
  boardsById: Map<string, Board>,
  childBoardsByParentNodeId: Map<string, Board[]>
): Board | undefined {
  if (node.childBoardId) {
    const board = boardsById.get(node.childBoardId)
    if (board && board.level === expectedLevel) return board
  }

  const fallbackBoards = childBoardsByParentNodeId.get(node.id) ?? []
  return fallbackBoards.find((board) => board.level === expectedLevel && board.parentBoardId === node.boardId)
}

function renderN2Blocks(context: ExportContext): string {
  if (context.n2Nodes.length === 0) return '- Nenhum componente N2 registrado para este bloco N1.'

  return context.n2Nodes
    .map((n2) => {
      const lines = [
        `### ${n2.node.type} - ${textValue(n2.node.title)}`,
        `- Descricao: ${textValue(n2.node.description)}`,
        '- Payload semantico:',
        ...formatNodeData(n2.node.data).map((line) => `  ${line}`),
        '- Relacoes do componente:',
        ...formatRelations(n2.relations).map((line) => `  ${line}`),
        '- Blocos N3:',
        ...formatNodes(n2.n3Nodes.map((entry) => entry.node)).map((line) => `  ${line}`)
      ]

      return lines.join('\n')
    })
    .join('\n\n')
}

function renderN3Details(context: ExportContext): string {
  const withDetails = context.n2Nodes.filter((n2) => n2.n3Nodes.length > 0)
  if (withDetails.length === 0) return '- Nenhum detalhe N3 registrado.'

  return withDetails
    .map((n2) => {
      const n3Markdown = n2.n3Nodes
        .map((n3) => {
          const lines = [
            `#### ${n3.node.type} - ${textValue(n3.node.title)}`,
            `- Descricao: ${textValue(n3.node.description)}`,
            '- Payload semantico:',
            ...formatNodeData(n3.node.data).map((line) => `  ${line}`),
            '- Relacoes locais:',
            ...formatRelations(n3.relations).map((line) => `  ${line}`)
          ]

          return lines.join('\n')
        })
        .join('\n\n')

      return `### Detalhes de ${textValue(n2.node.title)}\n${n3Markdown}`
    })
    .join('\n\n')
}

function renderContractsAndIntegrations(context: ExportContext): string {
  const candidates = context.n2Nodes.filter((entry) =>
    ['interface', 'api_contract'].includes(entry.node.type)
  )

  if (candidates.length === 0) return `- ${MISSING_TEXT}`

  return candidates
    .map((entry) => {
      const summary = firstDefinedText(entry.node.data, [
        'purpose',
        'responsibility',
        'inputSummary',
        'outputSummary'
      ])
      return `- ${entry.node.type}: ${entry.node.title} -> ${summary}`
    })
    .join('\n')
}

function renderGlobalDecisions(context: ExportContext): string {
  if (context.globalDecisions.length === 0) return `- ${MISSING_TEXT}`

  return context.globalDecisions
    .map((node) => `- ${node.title}: ${firstDefinedText(node.data, ['decision', 'rationale'])}`)
    .join('\n')
}

function renderGlobalNotes(context: ExportContext): string {
  if (context.globalNotes.length === 0) return `- ${MISSING_TEXT}`

  return context.globalNotes
    .map((node) => {
      const text = firstDefinedText(node.data, ['expectedInputsText', 'expectedOutputsText'])
      return `- ${node.type}: ${node.title} -> ${text}`
    })
    .join('\n')
}

function renderSpecPromptMarkdown(context: ExportContext): string {
  const expectedInputs = firstDefinedText(context.rootNode.data, [
    'expectedInputsText',
    'inputs',
    'inputSummary'
  ])
  const expectedOutputs = firstDefinedText(context.rootNode.data, [
    'expectedOutputsText',
    'outputs',
    'outputSummary'
  ])

  return [
    `# Prompt de Spec - ${context.rootNode.title}`,
    '',
    'Gere uma spec tecnica detalhada e implementavel usando apenas os dados abaixo.',
    '',
    'Regras:',
    '- Nao invente informacoes ausentes.',
    '- Nao mencione ferramentas, editor visual, canvas ou processo de modelagem.',
    '- Use somente os dados fornecidos.',
    '- Registre lacunas em "Open Questions / Assumptions".',
    '- Responda em Markdown.',
    '',
    '## Contexto geral do projeto',
    `- Nome: ${textValue(context.workspace.name)}`,
    `- Objetivo: ${textValue(context.workspace.description)}`,
    `- Contexto geral: ${textValue(context.rootBoard.description)}`,
    `- Escopo relevante: Board raiz ${textValue(context.rootBoard.name)} (N1).`,
    '- Restricoes globais:',
    renderGlobalNotes(context),
    '- Decisoes globais:',
    renderGlobalDecisions(context),
    '',
    '## Elemento principal',
    `- Tipo: ${context.rootNode.type}`,
    `- Nome: ${textValue(context.rootNode.title)}`,
    `- Descricao: ${textValue(context.rootNode.description)}`,
    `- Responsabilidade: ${firstDefinedText(context.rootNode.data, ['responsibility', 'goal', 'purpose', 'decision'])}`,
    `- Entradas esperadas: ${expectedInputs}`,
    `- Saidas esperadas: ${expectedOutputs}`,
    '- Relacoes externas:',
    ...formatRelations(context.rootRelations),
    '- Decisoes associadas:',
    renderGlobalDecisions(context),
    '- Observacoes:',
    renderGlobalNotes(context),
    '',
    '## Componentes internos',
    renderN2Blocks(context),
    '',
    '## Detalhes internos dos componentes',
    renderN3Details(context),
    '',
    '## Contratos, interfaces e integracoes',
    renderContractsAndIntegrations(context),
    '',
    '## Regras e restricoes',
    '- Regras funcionais: Priorize as regras descritas no payload semantico de cada bloco.',
    '- Restricoes tecnicas: Use apenas informacoes explicitadas nas secoes acima.',
    '- Restricoes de dominio: Nao extrapolar comportamento sem evidencia do contexto.',
    '- Requisitos nao funcionais: Apontar lacunas quando nao houver detalhes.',
    '',
    '## Estrutura obrigatoria da resposta',
    '1. Objetivo',
    '2. Papel arquitetural',
    '3. Escopo',
    '4. Visao estrutural',
    '5. Responsabilidades',
    '6. Componentes internos',
    '7. Classes, interfaces, contratos e detalhes internos',
    '8. Fluxo de funcionamento',
    '9. Regras e invariantes',
    '10. Dependencias e integracoes',
    '11. Decisoes tecnicas relevantes',
    '12. Open Questions / Assumptions',
    '13. Riscos de implementacao',
    '14. Criterios de aceite',
    '15. Resumo operacional para implementacao',
    '16. Sequencia sugerida de implementacao'
  ].join('\n')
}

function renderTaskPromptMarkdown(context: ExportContext): string {
  return [
    `# Prompt de Tasks - ${context.rootNode.title}`,
    '',
    'Voce e um engenheiro de software senior responsavel por decompor uma spec em tarefas executaveis.',
    '',
    'Com base no contexto abaixo, gere tasks tecnicas de implementacao.',
    '',
    '## Contexto do bloco',
    `- Nome: ${textValue(context.rootNode.title)}`,
    `- Tipo: ${context.rootNode.type}`,
    `- Objetivo: ${textValue(context.workspace.description)}`,
    `- Responsabilidades: ${firstDefinedText(context.rootNode.data, ['responsibility', 'goal', 'purpose', 'decision'])}`,
    '',
    '## Contexto geral do projeto',
    `- Workspace: ${textValue(context.workspace.name)}`,
    `- Board raiz: ${textValue(context.rootBoard.name)}`,
    `- Contexto adicional: ${textValue(context.rootBoard.description)}`,
    '',
    '## Relacoes externas do bloco',
    ...formatRelations(context.rootRelations),
    '',
    '## Detalhamento interno (N2)',
    renderN2Blocks(context),
    '',
    '## Detalhamento fino (N3)',
    renderN3Details(context),
    '',
    '## Contratos e integracoes',
    renderContractsAndIntegrations(context),
    '',
    '## Restricoes e decisoes',
    '- Decisoes arquiteturais relevantes:',
    renderGlobalDecisions(context),
    '- Dependencias conhecidas:',
    ...formatRelations(context.rootRelations),
    '- Inputs/outputs esperados:',
    renderGlobalNotes(context),
    '- Casos de erro conhecidos:',
    context.n2Nodes
      .flatMap((entry) => entry.n3Nodes)
      .flatMap((entry) => listValue(entry.node.data.errorCases))
      .map((value) => `- ${value}`)
      .join('\n') || `- ${MISSING_TEXT}`,
    '',
    '## Formato da resposta esperado',
    '- Separe por epicos ou grupos logicos.',
    '- Gere tasks pequenas e objetivas.',
    '- Inclua criterios de aceite por task.',
    '- Aponte dependencias entre tasks.',
    '- Escreva em portugues.',
    '- Nao invente contexto nao fornecido; use Open Questions / Assumptions para lacunas.'
  ].join('\n')
}

function renderPromptMarkdown(context: ExportContext, exportType: ExportPromptType): string {
  if (exportType === 'task_prompt') return renderTaskPromptMarkdown(context)
  return renderSpecPromptMarkdown(context)
}

function buildExportContexts(input: PromptExportBuildInput): ExportContext[] {
  const boardsById = new Map(input.boards.map((board) => [board.id, board]))
  const childBoardsByParentNodeId = new Map<string, Board[]>()
  for (const board of input.boards) {
    if (!board.parentNodeId) continue
    const current = childBoardsByParentNodeId.get(board.parentNodeId) ?? []
    current.push(board)
    childBoardsByParentNodeId.set(board.parentNodeId, current)
  }
  for (const [, boards] of childBoardsByParentNodeId) {
    boards.sort(compareBoards)
  }

  const nodesById = new Map(input.nodes.map((node) => [node.id, node]))
  const nodesByBoardId = new Map<string, SemanticNode[]>()
  for (const node of input.nodes) {
    const current = nodesByBoardId.get(node.boardId) ?? []
    current.push(node)
    nodesByBoardId.set(node.boardId, current)
  }
  for (const [, nodes] of nodesByBoardId) {
    nodes.sort(compareNodes)
  }

  const relationsByBoardId = new Map<string, Relation[]>()
  for (const relation of input.relations) {
    const current = relationsByBoardId.get(relation.boardId) ?? []
    current.push(relation)
    relationsByBoardId.set(relation.boardId, current)
  }

  const rootBoard = boardsById.get(input.workspace.rootBoardId)
  if (!rootBoard) {
    throw new Error('Root board not found for workspace')
  }

  const rootBoardNodes = (nodesByBoardId.get(rootBoard.id) ?? []).filter((node) => node.level === 'N1')
  const rootBoardRelations = relationsByBoardId.get(rootBoard.id) ?? []

  const globalNotes = rootBoardNodes.filter(
    (node) => node.type === 'free_note_input' || node.type === 'free_note_output'
  )
  const globalDecisions = rootBoardNodes.filter((node) => node.type === 'decision')

  return rootBoardNodes.map((rootNode) => {
    const rootRelations = rootBoardRelations
      .filter((relation) => relation.sourceNodeId === rootNode.id || relation.targetNodeId === rootNode.id)
      .map((relation) => relationToDescriptor(relation, nodesById))
      .filter((relation): relation is RelationDescriptor => Boolean(relation))
      .sort(compareRelations)

    const n2Board = findChildBoard(rootNode, 'N2', boardsById, childBoardsByParentNodeId)
    const n2Nodes = n2Board ? (nodesByBoardId.get(n2Board.id) ?? []) : []
    const n2Relations = n2Board ? relationsByBoardId.get(n2Board.id) ?? [] : []

    const n2NodeContexts: N2NodeContext[] = n2Nodes.map((n2Node) => {
      const relations = n2Relations
        .filter((relation) => relation.sourceNodeId === n2Node.id || relation.targetNodeId === n2Node.id)
        .map((relation) => relationToDescriptor(relation, nodesById))
        .filter((relation): relation is RelationDescriptor => Boolean(relation))
        .sort(compareRelations)

      const n3Board = findChildBoard(n2Node, 'N3', boardsById, childBoardsByParentNodeId)
      const n3Nodes = n3Board ? (nodesByBoardId.get(n3Board.id) ?? []) : []
      const n3Relations = n3Board ? relationsByBoardId.get(n3Board.id) ?? [] : []

      const n3Contexts: N3NodeContext[] = n3Nodes.map((n3Node) => ({
        node: n3Node,
        relations: n3Relations
          .filter((relation) => relation.sourceNodeId === n3Node.id || relation.targetNodeId === n3Node.id)
          .map((relation) => relationToDescriptor(relation, nodesById))
          .filter((relation): relation is RelationDescriptor => Boolean(relation))
          .sort(compareRelations)
      }))

      return {
        node: n2Node,
        relations,
        n3Nodes: n3Contexts
      }
    })

    return {
      workspace: input.workspace,
      rootBoard,
      rootNode,
      rootRelations,
      globalNotes: globalNotes.filter((node) => node.id !== rootNode.id),
      globalDecisions: globalDecisions.filter((node) => node.id !== rootNode.id),
      n2Nodes: n2NodeContexts
    }
  })
}

export function buildPromptExportBundle(input: PromptExportBuildInput): PromptExportBundle {
  const exportedAt = input.exportedAt ?? new Date().toISOString()
  const contexts = buildExportContexts(input).sort((a, b) => compareNodes(a.rootNode, b.rootNode))
  const indexWidth = Math.max(2, String(contexts.length).length)

  const items: PromptExportItem[] = contexts.map((context, index) => {
    const prefix = String(index + 1).padStart(indexWidth, '0')
    const filename = `${prefix}-${toSlug(context.rootNode.title)}-${input.exportType}.md`

    return {
      rootNodeId: context.rootNode.id,
      rootNodeTitle: context.rootNode.title,
      rootNodeType: context.rootNode.type,
      filename,
      markdown: renderPromptMarkdown(context, input.exportType)
    }
  })

  return {
    workspaceId: input.workspace.id,
    workspaceName: input.workspace.name,
    exportType: input.exportType,
    exportedAt,
    items
  }
}

function renderPromptBundleIndex(bundle: PromptExportBundle): string {
  const lines = [
    '# Prompt Export Bundle',
    '',
    `- Workspace: ${bundle.workspaceName}`,
    `- Workspace ID: ${bundle.workspaceId}`,
    `- Export type: ${bundle.exportType}`,
    `- Exported at: ${bundle.exportedAt}`,
    `- Prompt count: ${bundle.items.length}`,
    '',
    '## Files'
  ]

  if (bundle.items.length === 0) {
    lines.push(`- ${MISSING_TEXT}`)
  } else {
    for (const item of bundle.items) {
      lines.push(`- ${item.filename} (${item.rootNodeType}: ${item.rootNodeTitle})`)
    }
  }

  return lines.join('\n')
}

export async function createPromptZipBytes(bundle: PromptExportBundle): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('index.md', renderPromptBundleIndex(bundle))

  for (const item of bundle.items) {
    zip.file(item.filename, item.markdown)
  }

  return zip.generateAsync({ type: 'uint8array' })
}

export async function createPromptZipBlob(bundle: PromptExportBundle): Promise<Blob> {
  const zipBytes = await createPromptZipBytes(bundle)
  const zipBuffer = zipBytes.buffer.slice(
    zipBytes.byteOffset,
    zipBytes.byteOffset + zipBytes.byteLength
  ) as ArrayBuffer
  return new Blob([zipBuffer], { type: 'application/zip' })
}

export function buildPromptZipFileName(bundle: PromptExportBundle): string {
  const dateToken = bundle.exportedAt.replace(/[:.]/g, '-')
  return `${toSlug(bundle.workspaceName)}-${bundle.exportType}-${dateToken}.zip`
}
