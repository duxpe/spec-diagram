import { db } from '@/infrastructure/db/dexie'
import { Board } from '@/domain/models/board'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'
import { boardRepo } from '@/infrastructure/db/repositories/board-repo'
import { relationRepo } from '@/infrastructure/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/infrastructure/db/repositories/semantic-node-repo'
import { projectRepo } from '@/infrastructure/db/repositories/project-repo'
import { ExportPromptType, PromptExportBundle, ProjectExportFile } from '@/domain/models/export'
import { projectExportFileSchema } from '@/domain/schemas/export.schema'
import { buildPromptExportBundle } from '@/features/transfer/model/prompt-export-service'
import { ValidationService } from '@/domain/services/validation-service'
import { parseJson, toPrettyJson } from '@/shared/lib/json'

function normalizeImportPayload(payload: ProjectExportFile): ProjectExportFile {
  const projectId = payload.project.id

  const boards = payload.boards
    .filter((board) => board.projectId === projectId)
    .map((board) => ({ ...board, nodeIds: [], relationIds: [] }))

  const boardIdSet = new Set(boards.map((board) => board.id))

  const nodes = payload.nodes
    .filter((node) => node.projectId === projectId && boardIdSet.has(node.boardId))
    .map((node) => ({ ...node }))

  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const relations = payload.relations
    .filter((relation) => {
      const sourceNode = nodeById.get(relation.sourceNodeId)
      const targetNode = nodeById.get(relation.targetNodeId)
      if (!sourceNode || !targetNode) return false
      return (
        relation.projectId === projectId &&
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
  const rootBoardId = boardIdSet.has(payload.project.rootBoardId)
    ? payload.project.rootBoardId
    : fallbackRootBoardId

  if (!rootBoardId) {
    throw new Error('Imported project has no valid boards')
  }

  return {
    ...payload,
    project: {
      ...payload.project,
      rootBoardId,
      boardIds: rebuiltBoards.map((board) => board.id)
    },
    boards: rebuiltBoards,
    nodes,
    relations
  }
}

export class ExportService {
  static async exportProject(projectId: string): Promise<string> {
    const project = await projectRepo.getById(projectId)

    if (!project) {
      throw new Error('Project not found for export')
    }

    const [boards, nodes, relations] = await Promise.all([
      boardRepo.listByProject(projectId),
      semanticNodeRepo.listByProject(projectId),
      relationRepo.listByProject(projectId)
    ])

    const payload: ProjectExportFile = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project,
      boards,
      nodes,
      relations
    }

    ValidationService.parse(projectExportFileSchema, payload)

    return toPrettyJson(payload)
  }

  static async importProject(jsonInput: string): Promise<ProjectExportFile> {
    const parsed = parseJson(jsonInput)
    const payload = ValidationService.parse(projectExportFileSchema, parsed)
    const normalizedPayload = normalizeImportPayload(payload)
    ValidationService.parse(projectExportFileSchema, normalizedPayload)

    await db.transaction('rw', db.projects, db.boards, db.nodes, db.relations, async () => {
      await db.projects.put(normalizedPayload.project)
      await db.boards.bulkPut(normalizedPayload.boards)
      await db.nodes.bulkPut(normalizedPayload.nodes)
      await db.relations.bulkPut(normalizedPayload.relations)
    })

    return normalizedPayload
  }

  static async generateProjectPromptBundle(
    projectId: string,
    exportType: ExportPromptType
  ): Promise<PromptExportBundle> {
    const project = await projectRepo.getById(projectId)

    if (!project) {
      throw new Error('Project not found for prompt export')
    }

    const [boards, nodes, relations] = await Promise.all([
      boardRepo.listByProject(projectId),
      semanticNodeRepo.listByProject(projectId),
      relationRepo.listByProject(projectId)
    ])

    return buildPromptExportBundle({
      project,
      boards,
      nodes,
      relations,
      exportType
    })
  }
}
