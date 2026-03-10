import { z } from 'zod'

export const relationTypeSchema = z.enum([
  'depends_on',
  'calls',
  'reads',
  'writes',
  'implements',
  'extends',
  'uses',
  'exposes',
  'contains',
  'decides'
])

export const relationSchema = z
  .object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    boardId: z.string().min(1),
    sourceNodeId: z.string().min(1),
    targetNodeId: z.string().min(1),
    label: z.string().optional(),
    type: relationTypeSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type RelationSchema = z.infer<typeof relationSchema>
