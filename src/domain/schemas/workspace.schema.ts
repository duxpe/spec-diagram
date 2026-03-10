import { z } from 'zod'

export const workspaceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    rootBoardId: z.string().min(1),
    boardIds: z.array(z.string().min(1)),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()

export type WorkspaceSchema = z.infer<typeof workspaceSchema>
