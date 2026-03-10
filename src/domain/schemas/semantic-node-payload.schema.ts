import { z } from 'zod'
import { SemanticNodeType } from '@/domain/models/semantic-node'

const passthroughObject = z.object({}).passthrough()

const payloadSchemas: Record<SemanticNodeType, z.ZodTypeAny> = {
  system: passthroughObject,
  container_service: passthroughObject,
  database: passthroughObject,
  external_system: passthroughObject,
  api_contract: passthroughObject,
  decision: passthroughObject,
  class: passthroughObject,
  interface: passthroughObject,
  port: passthroughObject,
  adapter: passthroughObject,
  method: passthroughObject,
  attribute: passthroughObject,
  free_note_input: passthroughObject,
  free_note_output: passthroughObject
}

export function getPayloadSchemaForNodeType(type: SemanticNodeType): z.ZodTypeAny {
  return payloadSchemas[type]
}
