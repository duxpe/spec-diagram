import { z } from 'zod'
import { boardSchema } from '@/domain/schemas/board.schema'
import { relationSchema } from '@/domain/schemas/relation.schema'
import { semanticNodeSchema } from '@/domain/schemas/semantic-node.schema'
import { projectSchema } from '@/domain/schemas/project.schema'

export const projectExportFileSchema = z
  .object({
    version: z.literal('2.0.0'),
    exportedAt: z.string().datetime(),
    project: projectSchema,
    boards: z.array(boardSchema),
    nodes: z.array(semanticNodeSchema),
    relations: z.array(relationSchema)
  })
  .strict()

export type ProjectExportFileSchema = z.infer<typeof projectExportFileSchema>
