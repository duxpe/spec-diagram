import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { RelationType } from '@/domain/models/relation'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import type { SemanticLevel } from '@/domain/models/board'
import type { ArchitecturePattern } from '@/domain/models/project'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'

export interface ConnectionSuggestion {
  nodeType: SemanticNodeType
  patternRole: string
  label: string
  marker: string
  suggestedRelationType: RelationType
  defaultAppearance?: Partial<NodeAppearance>
}

export function getConnectionSuggestions(input: {
  pattern?: ArchitecturePattern
  level: SemanticLevel
  sourceNodeType: SemanticNodeType
  sourcePatternRole?: string
}): ConnectionSuggestion[] {
  const { pattern, level, sourcePatternRole } = input

  // Only provide suggestions for N1 with a known pattern and role
  if (level !== 'N1' || !pattern || !sourcePatternRole) return []

  const definition = PATTERN_CATALOG[pattern]
  if (!definition) return []

  const suggestion = definition.nextNodeSuggestions.find(
    (s) => s.sourceRole === sourcePatternRole
  )
  if (!suggestion) return []

  const results: ConnectionSuggestion[] = []

  for (const targetRole of suggestion.suggestedTargetRoles) {
    const nodeEntry = definition.n1Nodes.find((n) => n.patternRole === targetRole)
    if (!nodeEntry) continue

    results.push({
      nodeType: nodeEntry.type,
      patternRole: nodeEntry.patternRole,
      label: nodeEntry.label,
      marker: nodeEntry.marker,
      suggestedRelationType: suggestion.defaultRelationType,
      defaultAppearance: nodeEntry.defaultAppearance
    })
  }

  return results.slice(0, 8)
}
