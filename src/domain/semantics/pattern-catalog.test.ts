import { describe, expect, it } from 'vitest'
import type { ArchitecturePattern } from '@/domain/models/project'
import { getPatternDefinition, PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'

const EXPECTED_PATTERNS: ArchitecturePattern[] = [
  'free_mode',
  'hexagonal',
  'layered_n_tier',
  'microservices',
  'microkernel',
  'mvc',
  'space_based',
  'client_server',
  'master_slave'
]

describe('pattern-catalog', () => {
  it('registers every supported architecture pattern', () => {
    expect(Object.keys(PATTERN_CATALOG).sort()).toEqual([...EXPECTED_PATTERNS].sort())
  })

  it('keeps definition id aligned with registry key', () => {
    for (const pattern of EXPECTED_PATTERNS) {
      expect(getPatternDefinition(pattern).id).toBe(pattern)
    }
  })
})
