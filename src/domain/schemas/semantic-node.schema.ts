import { z } from 'zod'
import { semanticLevelSchema } from '@/domain/schemas/board.schema'
import { getPayloadSchemaForNodeType } from '@/domain/schemas/semantic-node-payload.schema'

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
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()
  .superRefine((node, context) => {
    const payloadSchema = getPayloadSchemaForNodeType(node.type)
    const result = payloadSchema.safeParse(node.data)

    if (!result.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data'],
        message: `Invalid payload for node type ${node.type}`
      })
    }
  })

export type SemanticNodeSchema = z.infer<typeof semanticNodeSchema>
