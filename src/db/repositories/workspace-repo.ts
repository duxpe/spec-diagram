import { db } from '@/db/dexie'
import { Workspace } from '@/domain/models/workspace'
import { workspaceSchema } from '@/domain/schemas/workspace.schema'
import { ValidationService } from '@/domain/services/validation-service'

export const workspaceRepo = {
  async list(): Promise<Workspace[]> {
    const workspaces = await db.workspaces.orderBy('updatedAt').reverse().toArray()
    return ValidationService.parseArray(workspaceSchema, workspaces)
  },

  async getById(id: string): Promise<Workspace | undefined> {
    const workspace = await db.workspaces.get(id)
    if (!workspace) return undefined

    return ValidationService.parse(workspaceSchema, workspace)
  },

  async upsert(workspace: Workspace): Promise<void> {
    ValidationService.parse(workspaceSchema, workspace)
    await db.workspaces.put(workspace)
  },

  async delete(id: string): Promise<void> {
    await db.workspaces.delete(id)
  }
}
