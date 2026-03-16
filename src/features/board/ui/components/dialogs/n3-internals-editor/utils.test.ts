import { describe, expect, it } from 'vitest'
import {
  buildPayloadForSave,
  toEndpointRows,
  toMethodRows
} from '@/features/board/ui/components/dialogs/n3-internals-editor/utils'

describe('n3 internals utils', () => {
  it('normalizes method rows and trims optional note', () => {
    const rows = toMethodRows(
      [{ returnType: 'void', name: 'run', parameters: 'id: string', note: '  note  ' }],
      () => 'row_1'
    )

    expect(rows).toEqual([
      { localId: 'row_1', returnType: 'void', name: 'run', parameters: 'id: string', note: 'note' }
    ])
  })

  it('falls back to GET for invalid endpoint method', () => {
    const rows = toEndpointRows([{ httpMethod: 'invalid', url: '/x' }], () => 'row_2')
    expect(rows[0]?.httpMethod).toBe('GET')
  })

  it('builds contract payload preserving internals endpoint shape', () => {
    const payload = buildPayloadForSave({
      eligible: 'api_contract',
      nodeData: {},
      contractKind: 'http',
      contractConsumer: 'frontend',
      contractProvider: 'service',
      contractInputSummary: ['in'],
      contractOutputSummary: ['out'],
      contractConstraints: [],
      contractErrorCases: [],
      methods: [],
      attributes: [],
      endpoints: [
        {
          localId: 'row_3',
          httpMethod: 'POST',
          url: '/orders',
          requestFormat: 'json',
          responseFormat: 'json',
          note: undefined
        }
      ]
    })

    expect(payload).toMatchObject({
      kind: 'http',
      consumer: 'frontend',
      provider: 'service',
      internals: {
        endpoints: [{ httpMethod: 'POST', url: '/orders' }]
      }
    })
  })
})
