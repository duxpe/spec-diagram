import { db } from '@/db/dexie'
import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { boardRepo } from '@/db/repositories/board-repo'
import { relationRepo } from '@/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/db/repositories/semantic-node-repo'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { WorkspaceExportFile } from '@/domain/models/export'
import { workspaceExportFileSchema } from '@/domain/schemas/export.schema'
import { ValidationService } from '@/domain/services/validation-service'
import { parseJson, toPrettyJson } from '@/utils/json'

function normalizeImportPayload(payload: WorkspaceExportFile): WorkspaceExportFile {
  const workspaceId = payload.workspace.id

  const boards = payload.boards
    .filter((board) => board.workspaceId === workspaceId)
    .map((board) => ({ ...board, nodeIds: [], relationIds: [] }))

  const boardIdSet = new Set(boards.map((board) => board.id))

  const nodes = payload.nodes
    .filter((node) => node.workspaceId === workspaceId && boardIdSet.has(node.boardId))
    .map((node) => ({ ...node }))

  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const relations = payload.relations
    .filter((relation) => {
      const sourceNode = nodeById.get(relation.sourceNodeId)
      const targetNode = nodeById.get(relation.targetNodeId)
      if (!sourceNode || !targetNode) return false
      return (
        relation.workspaceId === workspaceId &&
        boardIdSet.has(relation.boardId) &&
        sourceNode.boardId === relation.boardId &&
        targetNode.boardId === relation.boardId
      )
    })
    .map((relation) => ({ ...relation }))

  const nodesByBoard = new Map<string, SemanticNode[]>()
  for (const node of nodes) {
    const current = nodesByBoard.get(node.boardId) ?? []
    current.push(node)
    nodesByBoard.set(node.boardId, current)
  }

  const relationsByBoard = new Map<string, Relation[]>()
  for (const relation of relations) {
    const current = relationsByBoard.get(relation.boardId) ?? []
    current.push(relation)
    relationsByBoard.set(relation.boardId, current)
  }

  const rebuiltBoards: Board[] = boards.map((board) => {
    const boardNodes = nodesByBoard.get(board.id) ?? []
    const boardRelations = relationsByBoard.get(board.id) ?? []

    return {
      ...board,
      nodeIds: boardNodes.map((node) => node.id),
      relationIds: boardRelations.map((relation) => relation.id)
    }
  })

  const fallbackRootBoardId = rebuiltBoards[0]?.id
  const rootBoardId = boardIdSet.has(payload.workspace.rootBoardId)
    ? payload.workspace.rootBoardId
    : fallbackRootBoardId

  if (!rootBoardId) {
    throw new Error('Imported workspace has no valid boards')
  }

  return {
    ...payload,
    workspace: {
      ...payload.workspace,
      rootBoardId,
      boardIds: rebuiltBoards.map((board) => board.id)
    },
    boards: rebuiltBoards,
    nodes,
    relations
  }
}

export class ExportService {
  static async exportWorkspace(workspaceId: string): Promise<string> {
    const workspace = await workspaceRepo.getById(workspaceId)

    if (!workspace) {
      throw new Error('Workspace not found for export')
    }

    const [boards, nodes, relations] = await Promise.all([
      boardRepo.listByWorkspace(workspaceId),
      semanticNodeRepo.listByWorkspace(workspaceId),
      relationRepo.listByWorkspace(workspaceId)
    ])

    const payload: WorkspaceExportFile = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspace,
      boards,
      nodes,
      relations
    }

    ValidationService.parse(workspaceExportFileSchema, payload)

    return toPrettyJson(payload)
  }

  static async importWorkspace(jsonInput: string): Promise<WorkspaceExportFile> {
    const parsed = parseJson(jsonInput)
    const payload = ValidationService.parse(workspaceExportFileSchema, parsed)
    const normalizedPayload = normalizeImportPayload(payload)
    ValidationService.parse(workspaceExportFileSchema, normalizedPayload)

    await db.transaction('rw', db.workspaces, db.boards, db.nodes, db.relations, async () => {
      await db.workspaces.put(normalizedPayload.workspace)
      await db.boards.bulkPut(normalizedPayload.boards)
      await db.nodes.bulkPut(normalizedPayload.nodes)
      await db.relations.bulkPut(normalizedPayload.relations)
    })

    return normalizedPayload
  }
}
