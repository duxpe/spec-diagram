import type { Board } from '@/domain/models/board'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import {
  compareBoards,
  compareNodes,
  compareRelations
} from '@/features/transfer/model/prompt-export-service/formatting'
import type {
  ExportContext,
  N2NodeContext,
  N3NodeContext,
  PromptExportBuildInput,
  RelationDescriptor
} from '@/features/transfer/model/prompt-export-service/types'

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

function buildN3ContextEntries(node: SemanticNode): N3NodeContext[] {
  if (node.type !== 'class' && node.type !== 'interface' && node.type !== 'api_contract') {
    return []
  }

  const internals =
    typeof node.data.internals === 'object' && node.data.internals !== null
      ? (node.data.internals as Record<string, unknown>)
      : {}

  const asNonEmpty = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (node.type === 'api_contract') {
    const endpoints = Array.isArray(internals.endpoints) ? internals.endpoints : []
    return endpoints
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => {
        const method = asNonEmpty(entry.httpMethod) ?? 'METHOD'
        const url = asNonEmpty(entry.url) ?? 'endpoint'
        return {
          type: 'endpoint',
          title: `${method} ${url}`,
          description: asNonEmpty(entry.note),
          data: {
            httpMethod: entry.httpMethod,
            url: entry.url,
            requestFormat: entry.requestFormat,
            responseFormat: entry.responseFormat,
            note: entry.note
          }
        } satisfies N3NodeContext
      })
  }

  const methods = Array.isArray(internals.methods) ? internals.methods : []
  const attributes = Array.isArray(internals.attributes) ? internals.attributes : []

  const methodEntries = methods
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      type: 'method' as const,
      title: asNonEmpty(entry.name) ?? 'method',
      description: asNonEmpty(entry.note),
      data: {
        returnType: entry.returnType,
        name: entry.name,
        parameters: entry.parameters,
        note: entry.note
      }
    }))

  const attributeEntries = attributes
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      type: 'attribute' as const,
      title: asNonEmpty(entry.name) ?? 'attribute',
      description: asNonEmpty(entry.note),
      data: {
        type: entry.type,
        name: entry.name,
        defaultValue: entry.defaultValue,
        note: entry.note
      }
    }))

  return [...methodEntries, ...attributeEntries]
}

export function buildExportContexts(input: PromptExportBuildInput): ExportContext[] {
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

  const rootBoard = boardsById.get(input.project.rootBoardId)
  if (!rootBoard) {
    throw new Error('Root board not found for project')
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

      return {
        node: n2Node,
        relations,
        n3Nodes: buildN3ContextEntries(n2Node)
      }
    })

    return {
      project: input.project,
      rootBoard,
      rootNode,
      rootRelations,
      globalNotes: globalNotes.filter((node) => node.id !== rootNode.id),
      globalDecisions: globalDecisions.filter((node) => node.id !== rootNode.id),
      n2Nodes: n2NodeContexts
    }
  })
}
