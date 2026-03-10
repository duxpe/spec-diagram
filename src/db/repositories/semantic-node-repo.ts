import { db } from '@/db/dexie'
import { SemanticNode } from '@/domain/models/semantic-node'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { ValidationService } from '@/domain/services/validation-service'

export const semanticNodeRepo = {
  async listByBoard(boardId: string): Promise<SemanticNode[]> {
    const nodes = await db.nodes.where('boardId').equals(boardId).toArray()
    return ValidationService.parseArray(semanticNodeSchema, nodes)
  },

  async listByWorkspace(workspaceId: string): Promise<SemanticNode[]> {
    const nodes = await db.nodes.where('workspaceId').equals(workspaceId).toArray()
    return ValidationService.parseArray(semanticNodeSchema, nodes)
  },

  async upsert(node: SemanticNode): Promise<void> {
    ValidationService.parse(semanticNodeSchema, node)
    await db.nodes.put(node)
  },

  async bulkUpsert(nodes: SemanticNode[]): Promise<void> {
    nodes.forEach((node) => ValidationService.parse(semanticNodeSchema, node))
    await db.nodes.bulkPut(nodes)
  }
}
