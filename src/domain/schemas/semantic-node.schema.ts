import { z } from 'zod'
import { semanticLevelSchema } from '@/domain/schemas/board.schema'
import { getPayloadSchemaForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { nodeAppearanceSchema } from '@/domain/schemas/node-appearance.schema'

export const semanticNodeTypeSchema = z.enum([
  'system',
  'container_service',
  'database',
  'external_system',
  'api_contract',
  'decision',
  'class',
  'interface',
  'port',
  'adapter',
  'method',
  'attribute',
  'free_note_input',
  'free_note_output'
])

export const semanticNodeSchema = z
  .object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    boardId: z.string().min(1),
    parentNodeId: z.string().min(1).optional(),
    level: semanticLevelSchema,
    type: semanticNodeTypeSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    childBoardId: z.string().min(1).optional(),
    data: z.record(z.unknown()),
    appearance: nodeAppearanceSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()
  .superRefine((node, context) => {
    const payloadSchema = getPayloadSchemaForNodeType(node.type)
    const result = payloadSchema.safeParse(node.data)

    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', ...issue.path],
          message: issue.message
        })
      }
    }
  })

export type SemanticNodeSchema = z.infer<typeof semanticNodeSchema>
