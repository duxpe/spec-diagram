import type { InternalsNodeType, MethodRow, AttributeRow, EndpointRow } from '@/features/board/ui/components/dialogs/n3-internals-editor/types'
import { CONTRACT_KINDS, HTTP_METHODS } from '@/features/board/ui/components/dialogs/n3-internals-editor/types'

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function normalizeList(items: string[]): string[] {
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= items.length) return items

  const clone = [...items]
  const [item] = clone.splice(index, 1)
  if (!item) return items
  clone.splice(target, 0, item)
  return clone
}

export function sanitizeOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toMethodRows(value: unknown, nextId: () => string): MethodRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      localId: nextId(),
      returnType: asString(entry.returnType),
      name: asString(entry.name),
      parameters: asString(entry.parameters),
      note: sanitizeOptional(asString(entry.note))
    }))
}

export function toAttributeRows(value: unknown, nextId: () => string): AttributeRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      localId: nextId(),
      type: asString(entry.type),
      name: asString(entry.name),
      defaultValue: sanitizeOptional(asString(entry.defaultValue)),
      note: sanitizeOptional(asString(entry.note))
    }))
}

export function toEndpointRows(value: unknown, nextId: () => string): EndpointRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => {
      const method = asString(entry.httpMethod).toUpperCase()
      return {
        localId: nextId(),
        httpMethod: (HTTP_METHODS.includes(method as EndpointRow['httpMethod'])
          ? method
          : 'GET') as EndpointRow['httpMethod'],
        url: asString(entry.url),
        requestFormat: asString(entry.requestFormat),
        responseFormat: asString(entry.responseFormat),
        note: sanitizeOptional(asString(entry.note))
      }
    })
}

interface BuildPayloadInput {
  eligible: InternalsNodeType
  nodeData: Record<string, unknown>
  contractKind: string
  contractConsumer: string
  contractProvider: string
  contractInputSummary: string[]
  contractOutputSummary: string[]
  contractConstraints: string[]
  contractErrorCases: string[]
  methods: MethodRow[]
  attributes: AttributeRow[]
  endpoints: EndpointRow[]
}

export function buildPayloadForSave(input: BuildPayloadInput): Record<string, unknown> {
  if (input.eligible === 'api_contract') {
    return {
      kind: CONTRACT_KINDS.includes(input.contractKind as (typeof CONTRACT_KINDS)[number])
        ? input.contractKind
        : 'http',
      consumer: sanitizeOptional(input.contractConsumer),
      provider: sanitizeOptional(input.contractProvider),
      inputSummary: normalizeList(input.contractInputSummary),
      outputSummary: normalizeList(input.contractOutputSummary),
      constraints: normalizeList(input.contractConstraints),
      errorCases: normalizeList(input.contractErrorCases),
      internals: {
        endpoints: input.endpoints.map((row) => ({
          httpMethod: row.httpMethod,
          url: row.url,
          requestFormat: row.requestFormat,
          responseFormat: row.responseFormat,
          note: row.note
        }))
      }
    }
  }

  return {
    ...input.nodeData,
    internals: {
      methods: input.methods.map((row) => ({
        returnType: row.returnType,
        name: row.name,
        parameters: row.parameters,
        note: row.note
      })),
      attributes: input.attributes.map((row) => ({
        type: row.type,
        name: row.name,
        defaultValue: row.defaultValue,
        note: row.note
      }))
    }
  }
}
