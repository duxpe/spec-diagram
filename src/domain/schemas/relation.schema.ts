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
  'decides',
  'invokes',
  'publishes_to',
  'subscribes_to',
  'communicates_with',
  'serves',
  'routes_to',
  'authenticates_with',
  'registers_in',
  'updates',
  'renders',
  'replicates_to',
  'consumes_from',
  'synchronizes_with',
  'requests_from',
  'responds_to',
  'delegates_to',
  'returns_to',
  'queues_for',
  'aggregates_from',
  'monitors',
  'loads',
  'exposes_port',
  'implemented_by_adapter'
])

export const relationSchema = z
  .object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    boardId: z.string().min(1),
    sourceNodeId: z.string().min(1),
    targetNodeId: z.string().min(1),
    sourceHandleId: z.string().min(1).optional(),
    targetHandleId: z.string().min(1).optional(),
    label: z.string().optional(),
    type: relationTypeSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type RelationSchema = z.infer<typeof relationSchema>
