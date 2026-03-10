import { db } from '@/db/dexie'
import { boardRepo } from '@/db/repositories/board-repo'
import { relationRepo } from '@/db/repositories/relation-repo'
import { semanticNodeRepo } from '@/db/repositories/semantic-node-repo'
import { workspaceRepo } from '@/db/repositories/workspace-repo'
import { WorkspaceExportFile } from '@/domain/models/export'
import { workspaceExportFileSchema } from '@/domain/schemas/export.schema'
import { ValidationService } from '@/domain/services/validation-service'
import { parseJson, toPrettyJson } from '@/utils/json'

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

    await db.transaction('rw', db.workspaces, db.boards, db.nodes, db.relations, async () => {
      await db.workspaces.put(payload.workspace)
      await db.boards.bulkPut(payload.boards)
      await db.nodes.bulkPut(payload.nodes)
      await db.relations.bulkPut(payload.relations)
    })

    return payload
  }
}
