import { z } from 'zod'

const nonEmptyTrimmedText = z.string().trim().min(1)
const optionalTextList = z.array(nonEmptyTrimmedText).optional()

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

export const projectBriefSchema = z
  .object({
    goal: z.string().trim().min(1).optional(),
    context: z.string().trim().min(1).optional(),
    scopeIn: optionalTextList,
    scopeOut: optionalTextList,
    constraints: optionalTextList,
    nfrs: optionalTextList,
    globalDecisions: optionalTextList
  })
  .strict()

export const projectSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    brief: projectBriefSchema.optional(),
    rootBoardId: z.string().min(1),
    boardIds: z.array(z.string().min(1)),
    architecturePattern: architecturePatternSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type ProjectSchema = z.infer<typeof projectSchema>
