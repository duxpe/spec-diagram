import { z } from 'zod'
import { SemanticNodeType } from '@/domain/models/semantic-node'

const nonEmptyText = z.string().trim().min(1, 'This field is required')
const optionalText = z.string().trim().min(1).optional()
const optionalTextList = z.array(nonEmptyText).optional()
const visibilitySchema = z.enum(['public', 'protected', 'private', 'internal'])
const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD'
])

export const n3MethodInternalSchema = z
  .object({
    returnType: nonEmptyText,
    name: nonEmptyText,
    parameters: nonEmptyText,
    note: optionalText
  })
  .strict()

export const n3AttributeInternalSchema = z
  .object({
    type: nonEmptyText,
    name: nonEmptyText,
    defaultValue: optionalText,
    note: optionalText
  })
  .strict()

export const n3ContractEndpointInternalSchema = z
  .object({
    httpMethod: httpMethodSchema,
    url: nonEmptyText,
    requestFormat: nonEmptyText,
    responseFormat: nonEmptyText,
    note: optionalText
  })
  .strict()

export const n3ClassInterfaceInternalsSchema = z
  .object({
    methods: z.array(n3MethodInternalSchema).optional(),
    attributes: z.array(n3AttributeInternalSchema).optional()
  })
  .strict()

export const n3ApiContractInternalsSchema = z
  .object({
    endpoints: z.array(n3ContractEndpointInternalSchema).optional()
  })
  .strict()

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
    invariants: optionalTextList,
    internals: n3ClassInterfaceInternalsSchema.optional()
  })
  .strict()

export const n2InterfaceDataSchema = z
  .object({
    purpose: nonEmptyText,
    implementedByClassIds: optionalTextList,
    exposedOperationsSummary: optionalTextList,
    notes: optionalTextList,
    internals: n3ClassInterfaceInternalsSchema.optional()
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
    errorCases: optionalTextList,
    internals: n3ApiContractInternalsSchema.optional()
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

export type N3MethodInternal = z.infer<typeof n3MethodInternalSchema>
export type N3AttributeInternal = z.infer<typeof n3AttributeInternalSchema>
export type N3ContractEndpointInternal = z.infer<typeof n3ContractEndpointInternalSchema>

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
