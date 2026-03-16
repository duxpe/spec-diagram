import type { ArchitecturePattern } from '@/domain/models/project'
import hexagonal from '@/domain/semantics/pattern-catalog/patterns/hexagonal'
import layeredNTier from '@/domain/semantics/pattern-catalog/patterns/layered-n-tier'
import microservices from '@/domain/semantics/pattern-catalog/patterns/microservices'
import microkernel from '@/domain/semantics/pattern-catalog/patterns/microkernel'
import mvc from '@/domain/semantics/pattern-catalog/patterns/mvc'
import spaceBased from '@/domain/semantics/pattern-catalog/patterns/space-based'
import clientServer from '@/domain/semantics/pattern-catalog/patterns/client-server'
import masterSlave from '@/domain/semantics/pattern-catalog/patterns/master-slave'
import type { PatternDefinition, PatternNodeEntry } from '@/domain/semantics/pattern-catalog/types'

export type {
  PatternDefinition,
  PatternNodeEntry,
  PatternRelationEntry,
  PatternNextNodeSuggestion
} from '@/domain/semantics/pattern-catalog/types'

export const PATTERN_CATALOG: Record<ArchitecturePattern, PatternDefinition> = {
  hexagonal,
  layered_n_tier: layeredNTier,
  microservices,
  microkernel,
  mvc,
  space_based: spaceBased,
  client_server: clientServer,
  master_slave: masterSlave
}

export function getPatternDefinition(pattern: ArchitecturePattern): PatternDefinition {
  return PATTERN_CATALOG[pattern]
}

export function getPatternNodeByRole(
  pattern: ArchitecturePattern,
  role: string
): PatternNodeEntry | undefined {
  return PATTERN_CATALOG[pattern]?.n1Nodes.find((n) => n.patternRole === role)
}
