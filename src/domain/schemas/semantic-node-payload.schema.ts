import { z } from 'zod'
import { SemanticNodeType } from '@/domain/models/semantic-node'

const nonEmptyText = z.string().trim().min(1, 'This field is required')
const optionalText = z.string().trim().min(1).optional()
const optionalTextList = z.array(nonEmptyText).optional()
const visibilitySchema = z.enum(['public', 'protected', 'private', 'internal'])

export const n1SystemDataSchema = z
  .object({
    goal: nonEmptyText,
    businessContext: optionalText,
    primaryResponsibilities: z.array(nonEmptyText).min(1, 'Add at least one responsibility'),
    boundaries: optionalTextList,
    assumptions: optionalTextList
  })
  .strict()

export const n1ContainerServiceDataSchema = z
  .object({
    responsibility: nonEmptyText,
    inputs: optionalTextList,
    outputs: optionalTextList,
    technologies: optionalTextList,
    ownedBy: optionalText,
    exposesPorts: optionalTextList,
    dependsOn: optionalTextList
  })
  .strict()

export const n1DatabaseDataSchema = z
  .object({
    purpose: nonEmptyText,
    storageModel: z.enum(['relational', 'document', 'key_value', 'graph', 'event_store', 'other']).optional(),
    mainEntities: optionalTextList,
    accessedBy: optionalTextList,
    consistencyNotes: optionalTextList
  })
  .strict()

export const n1ExternalSystemDataSchema = z
  .object({
    purpose: nonEmptyText,
    interactionType: z.enum(['sync', 'async', 'batch', 'manual', 'unknown']).optional(),
    contractsKnown: optionalTextList,
    risks: optionalTextList
  })
  .strict()

export const n1PortDataSchema = z
  .object({
    direction: z.enum(['inbound', 'outbound']),
    protocol: optionalText,
    responsibility: nonEmptyText,
    ownedByBlockId: optionalText
  })
  .strict()

export const n1AdapterDataSchema = z
  .object({
    responsibility: nonEmptyText,
    adaptsPortId: optionalText,
    technology: optionalText,
    externalDependency: optionalText
  })
  .strict()

export const n1DecisionDataSchema = z
  .object({
    decision: nonEmptyText,
    rationale: optionalText,
    consequences: optionalTextList,
    alternativesConsidered: optionalTextList,
    status: z.enum(['proposed', 'accepted', 'deprecated']).optional()
  })
  .strict()

export const n1FreeNoteInputDataSchema = z
  .object({
    expectedInputsText: nonEmptyText
  })
  .strict()

export const n1FreeNoteOutputDataSchema = z
  .object({
    expectedOutputsText: nonEmptyText
  })
  .strict()

export const n2ClassDataSchema = z
  .object({
    responsibility: nonEmptyText,
    stereotypes: optionalTextList,
    dependsOnClassIds: optionalTextList,
    implementsInterfaceIds: optionalTextList,
    exposesMethodsSummary: optionalTextList,
    ownsAttributesSummary: optionalTextList,
    invariants: optionalTextList
  })
  .strict()

export const n2InterfaceDataSchema = z
  .object({
    purpose: nonEmptyText,
    implementedByClassIds: optionalTextList,
    exposedOperationsSummary: optionalTextList,
    notes: optionalTextList
  })
  .strict()

export const n2ApiContractDataSchema = z
  .object({
    kind: z.enum(['http', 'event', 'message', 'rpc', 'other']),
    consumer: optionalText,
    provider: optionalText,
    inputSummary: z.array(nonEmptyText).min(1, 'Add at least one input'),
    outputSummary: z.array(nonEmptyText).min(1, 'Add at least one output'),
    constraints: optionalTextList,
    errorCases: optionalTextList
  })
  .strict()

export const n3MethodDataSchema = z
  .object({
    signature: nonEmptyText,
    purpose: nonEmptyText,
    inputs: optionalTextList,
    outputs: optionalTextList,
    sideEffects: optionalTextList,
    preconditions: optionalTextList,
    postconditions: optionalTextList,
    errorCases: optionalTextList,
    visibility: visibilitySchema.optional(),
    async: z.boolean().optional()
  })
  .strict()

export const n3AttributeDataSchema = z
  .object({
    typeSignature: nonEmptyText,
    purpose: nonEmptyText,
    visibility: visibilitySchema.optional(),
    required: z.boolean().optional(),
    defaultValue: optionalText,
    invariants: optionalTextList
  })
  .strict()

const payloadSchemas: Record<SemanticNodeType, z.ZodTypeAny> = {
  system: n1SystemDataSchema,
  container_service: n1ContainerServiceDataSchema,
  database: n1DatabaseDataSchema,
  external_system: n1ExternalSystemDataSchema,
  api_contract: n2ApiContractDataSchema,
  decision: n1DecisionDataSchema,
  class: n2ClassDataSchema,
  interface: n2InterfaceDataSchema,
  port: n1PortDataSchema,
  adapter: n1AdapterDataSchema,
  method: n3MethodDataSchema,
  attribute: n3AttributeDataSchema,
  free_note_input: n1FreeNoteInputDataSchema,
  free_note_output: n1FreeNoteOutputDataSchema
}

export interface NodePayloadIssue {
  field: string
  message: string
}

export function getPayloadSchemaForNodeType(type: SemanticNodeType): z.ZodTypeAny {
  return payloadSchemas[type]
}

export function getPayloadIssuesForNodeType(
  type: SemanticNodeType,
  payload: unknown
): NodePayloadIssue[] {
  const parsed = getPayloadSchemaForNodeType(type).safeParse(payload)
  if (parsed.success) return []

  return parsed.error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message
  }))
}
