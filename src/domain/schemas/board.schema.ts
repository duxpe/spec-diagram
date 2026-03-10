import { z } from 'zod'

export const semanticLevelSchema = z.enum(['N1', 'N2', 'N3'])

export const boardSchema = z
  .object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    parentBoardId: z.string().min(1).optional(),
    parentNodeId: z.string().min(1).optional(),
    level: semanticLevelSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    nodeIds: z.array(z.string().min(1)),
    relationIds: z.array(z.string().min(1)),
    tlSnapshot: z.unknown().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type BoardSchema = z.infer<typeof boardSchema>
