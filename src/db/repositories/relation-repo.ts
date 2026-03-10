import { db } from '@/db/dexie'
import { Relation } from '@/domain/models/relation'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { ValidationService } from '@/domain/services/validation-service'

export const relationRepo = {
  async listByBoard(boardId: string): Promise<Relation[]> {
    const relations = await db.relations.where('boardId').equals(boardId).toArray()
    return ValidationService.parseArray(relationSchema, relations)
  },

  async listByWorkspace(workspaceId: string): Promise<Relation[]> {
    const relations = await db.relations.where('workspaceId').equals(workspaceId).toArray()
    return ValidationService.parseArray(relationSchema, relations)
  },

  async upsert(relation: Relation): Promise<void> {
    ValidationService.parse(relationSchema, relation)
    await db.relations.put(relation)
  },

  async bulkUpsert(relations: Relation[]): Promise<void> {
    relations.forEach((relation) => ValidationService.parse(relationSchema, relation))
    await db.relations.bulkPut(relations)
  }
}
