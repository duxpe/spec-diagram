import { z } from 'zod'
import { boardSchema } from '@/domain/schemas/board.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { workspaceSchema } from '@/domain/schemas/workspace.schema'

export const workspaceExportFileSchema = z
  .object({
    version: z.literal('1.0.0'),
    exportedAt: z.string().datetime(),
    workspace: workspaceSchema,
    boards: z.array(boardSchema),
    nodes: z.array(semanticNodeSchema),
    relations: z.array(relationSchema)
  })
  .strict()

export type WorkspaceExportFileSchema = z.infer<typeof workspaceExportFileSchema>
