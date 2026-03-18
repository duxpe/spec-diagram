import type {
  N3AttributeInternal,
  N3ContractEndpointInternal,
  N3MethodInternal
} from '@/domain/schemas/semantic-node-payload.schema'

export type InternalsNodeType = 'class' | 'interface' | 'api_contract'
export type ClassTab = 'methods' | 'attributes'

export type MethodRow = N3MethodInternal & { localId: string }
export type AttributeRow = N3AttributeInternal & { localId: string }
export type EndpointRow = N3ContractEndpointInternal & { localId: string }

export type NoteTarget =
  | { scope: 'method'; localId: string }
  | { scope: 'attribute'; localId: string }
  | { scope: 'endpoint'; localId: string }

export const EMPTY_METHOD: Omit<MethodRow, 'localId'> = {
  returnType: '',
  name: '',
  parameters: '',
  note: undefined
}

export const EMPTY_ATTRIBUTE: Omit<AttributeRow, 'localId'> = {
  type: '',
  name: '',
  defaultValue: undefined,
  note: undefined
}

export const EMPTY_ENDPOINT: Omit<EndpointRow, 'localId'> = {
  httpMethod: 'GET',
  url: '',
  requestFormat: '',
  responseFormat: '',
  note: undefined
}

export const CONTRACT_KINDS = ['http', 'event', 'message', 'rpc', 'other'] as const
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const
