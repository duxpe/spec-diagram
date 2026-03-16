import { describe, expect, it } from 'vitest'
import {
  getPayloadIssuesForNodeType,
  getPayloadSchemaForNodeType
} from '@/domain/schemas/semantic-node-payload.schema'

describe('semantic-node-payload schema (N1/N2)', () => {
  it('accepts valid payloads for all N1 node types', () => {
    expect(() =>
      getPayloadSchemaForNodeType('system').parse({
        goal: 'Provide business value',
        primaryResponsibilities: ['Coordinate modules']
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('container_service').parse({
        responsibility: 'Handle billing flow'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('database').parse({
        purpose: 'Store account records'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('external_system').parse({
        purpose: 'Payment provider integration'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('port').parse({
        direction: 'inbound',
        responsibility: 'Accept incoming commands'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('adapter').parse({
        responsibility: 'Translate external webhook payload'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('decision').parse({
        decision: 'Use event-driven orchestration'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('free_note_input').parse({
        expectedInputsText: 'Account identifier'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('free_note_output').parse({
        expectedOutputsText: 'Generated invoice'
      })
    ).not.toThrow()
  })

  it('accepts valid payloads for all N2 node types', () => {
    expect(() =>
      getPayloadSchemaForNodeType('class').parse({
        responsibility: 'Aggregate account state',
        internals: {
          methods: [
            {
              returnType: 'Account',
              name: 'getById',
              parameters: 'id: UUID'
            }
          ],
          attributes: [
            {
              type: 'UUID',
              name: 'accountId'
            }
          ]
        }
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('interface').parse({
        purpose: 'Expose account repository contract'
      })
    ).not.toThrow()

    expect(() =>
      getPayloadSchemaForNodeType('api_contract').parse({
        kind: 'http',
        inputSummary: ['accountId path param'],
        outputSummary: ['account payload'],
        internals: {
          endpoints: [
            {
              httpMethod: 'GET',
              url: '/accounts/{id}',
              requestFormat: 'path param',
              responseFormat: 'application/json'
            }
          ]
        }
      })
    ).not.toThrow()
  })

  it('returns field-specific issues when required N1 fields are missing', () => {
    expect(getPayloadIssuesForNodeType('system', {})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'goal' }),
        expect.objectContaining({ field: 'primaryResponsibilities' })
      ])
    )

    expect(getPayloadIssuesForNodeType('port', { direction: 'inbound' })).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'responsibility' })])
    )
  })

  it('returns field-specific issues when required N2 fields are missing', () => {
    expect(getPayloadIssuesForNodeType('class', {})).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'responsibility' })])
    )

    expect(getPayloadIssuesForNodeType('api_contract', { kind: 'http' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'inputSummary' }),
        expect.objectContaining({ field: 'outputSummary' })
      ])
    )
  })

  it('returns field-specific issues for invalid N2 internals', () => {
    expect(
      getPayloadIssuesForNodeType('class', {
        responsibility: 'Aggregate account state',
        internals: {
          methods: [
            {
              returnType: '',
              name: 'getById',
              parameters: 'id: UUID'
            }
          ]
        }
      })
    ).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'internals.methods.0.returnType' })]))
  })

})
