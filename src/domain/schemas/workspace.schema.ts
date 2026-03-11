import { z } from 'zod'

export const architecturePatternSchema = z.enum([
  'hexagonal',
  'layered_n_tier',
  'microservices',
  'microkernel',
  'mvc',
  'space_based',
  'client_server',
  'master_slave'
])

export const workspaceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    rootBoardId: z.string().min(1),
    boardIds: z.array(z.string().min(1)),
    architecturePattern: architecturePatternSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type WorkspaceSchema = z.infer<typeof workspaceSchema>
