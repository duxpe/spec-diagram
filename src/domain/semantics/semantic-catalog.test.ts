import { describe, expect, it } from 'vitest'
import {
  canOpenDetail,
  getAllowedNodeTypes,
  getAllowedRelationTypes,
  getDefaultNodeData,
  getN1RelationSuggestion
} from '@/domain/semantics/semantic-catalog'

describe('semantic-catalog', () => {
  it('returns N1 node whitelist for N1 boards', () => {
    const allowed = getAllowedNodeTypes('N1')

    expect(allowed).toContain('system')
    expect(allowed).toContain('decision')
    expect(allowed).not.toContain('class')
    expect(allowed).not.toContain('method')
  })

  it('returns N1 relation whitelist for N1 boards', () => {
    const allowed = getAllowedRelationTypes('N1')

    expect(allowed).toContain('depends_on')
    expect(allowed).toContain('decides')
    expect(allowed).not.toContain('implements')
    expect(allowed).not.toContain('contains')
  })

  it('returns N2 node and relation whitelists for N2 boards', () => {
    const allowedNodeTypes = getAllowedNodeTypes('N2')
    const allowedRelationTypes = getAllowedRelationTypes('N2')

    expect(allowedNodeTypes).toEqual(
      expect.arrayContaining([
        'class',
        'interface',
        'api_contract',
        'free_note_input',
        'free_note_output'
      ])
    )
    expect(allowedNodeTypes).not.toContain('system')

    expect(allowedRelationTypes).toEqual(
      expect.arrayContaining(['depends_on', 'implements', 'extends', 'uses', 'exposes', 'calls'])
    )
    expect(allowedRelationTypes).not.toContain('writes')
  })

  it('returns N3 node and relation whitelists for N3 boards', () => {
    const allowedNodeTypes = getAllowedNodeTypes('N3')
    const allowedRelationTypes = getAllowedRelationTypes('N3')

    expect(allowedNodeTypes).toEqual(
      expect.arrayContaining(['method', 'attribute', 'free_note_input', 'free_note_output'])
    )
    expect(allowedNodeTypes).not.toContain('class')

    expect(allowedRelationTypes).toEqual(expect.arrayContaining(['uses', 'depends_on', 'exposes']))
    expect(allowedRelationTypes).not.toContain('calls')
    expect(allowedRelationTypes).not.toContain('implements')
  })

  it('enforces N1 drill-down eligibility', () => {
    expect(canOpenDetail({ level: 'N1', type: 'system' })).toBe(true)
    expect(canOpenDetail({ level: 'N1', type: 'decision' })).toBe(false)
    expect(canOpenDetail({ level: 'N3', type: 'method' })).toBe(false)
  })

  it('enforces N2 drill-down eligibility', () => {
    expect(canOpenDetail({ level: 'N2', type: 'class' })).toBe(false)
    expect(canOpenDetail({ level: 'N2', type: 'api_contract' })).toBe(false)
    expect(canOpenDetail({ level: 'N2', type: 'free_note_input' })).toBe(false)
  })

  it('provides valid default payload for N1 types', () => {
    const data = getDefaultNodeData('N1', 'system')

    expect(data).toMatchObject({
      goal: expect.any(String),
      primaryResponsibilities: expect.any(Array)
    })
  })

  it('provides valid default payload for N2 types', () => {
    const classData = getDefaultNodeData('N2', 'class')
    const apiContractData = getDefaultNodeData('N2', 'api_contract')

    expect(classData).toMatchObject({
      responsibility: expect.any(String),
      internals: {
        methods: [],
        attributes: []
      }
    })
    expect(apiContractData).toMatchObject({
      kind: 'http',
      inputSummary: expect.any(Array),
      outputSummary: expect.any(Array),
      internals: {
        endpoints: []
      }
    })
  })

  it('provides valid default payload for N3 types', () => {
    const methodData = getDefaultNodeData('N3', 'method')
    const attributeData = getDefaultNodeData('N3', 'attribute')

    expect(methodData).toMatchObject({
      signature: expect.any(String),
      purpose: expect.any(String)
    })
    expect(attributeData).toMatchObject({
      typeSignature: expect.any(String),
      purpose: expect.any(String)
    })
  })

  it('returns non-blocking relation suggestion for specific N1 patterns', () => {
    const suggestion = getN1RelationSuggestion('database', 'container_service', 'calls')

    expect(suggestion).toContain('database')
  })
})
