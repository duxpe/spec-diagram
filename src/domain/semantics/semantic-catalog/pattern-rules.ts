import { RelationType } from '@/domain/models/relation'
import { SemanticNodeType } from '@/domain/models/semantic-node'
import { ArchitecturePattern } from '@/domain/models/project'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'
import { N1_NODE_TYPES, N1_RELATION_TYPES } from '@/domain/semantics/semantic-catalog/constants'

export function getPatternN1NodeTypes(pattern: ArchitecturePattern): SemanticNodeType[] {
  const definition = PATTERN_CATALOG[pattern]
  if (!definition) return N1_NODE_TYPES
  const uniqueTypes = new Set(definition.n1Nodes.map((entry) => entry.type))
  return [...uniqueTypes]
}

export function getPatternAllowedRelationTypes(
  pattern: ArchitecturePattern,
  sourceRole?: string,
  targetRole?: string
): RelationType[] {
  const definition = PATTERN_CATALOG[pattern]
  if (!definition) return N1_RELATION_TYPES

  const relations = definition.n1Relations

  if (sourceRole && targetRole) {
    const matching = relations.filter(
      (r) =>
        (!r.sourceRoles || r.sourceRoles.length === 0 || r.sourceRoles.includes(sourceRole)) &&
        (!r.targetRoles || r.targetRoles.length === 0 || r.targetRoles.includes(targetRole))
    )
    if (matching.length > 0) {
      return [...new Set(matching.map((r) => r.type))]
    }
  }

  if (sourceRole) {
    const matching = relations.filter(
      (r) => !r.sourceRoles || r.sourceRoles.length === 0 || r.sourceRoles.includes(sourceRole)
    )
    if (matching.length > 0) {
      return [...new Set(matching.map((r) => r.type))]
    }
  }

  return [...new Set(relations.map((r) => r.type))]
}

export function isPatternRelationTypeAllowed(
  pattern: ArchitecturePattern,
  relationType: RelationType,
  sourceRole?: string,
  targetRole?: string
): boolean {
  const definition = PATTERN_CATALOG[pattern]
  if (!definition) return false

  return definition.n1Relations.some((relation) => {
    if (relation.type !== relationType) return false

    const sourceMatches = sourceRole
      ? !relation.sourceRoles || relation.sourceRoles.length === 0 || relation.sourceRoles.includes(sourceRole)
      : !relation.sourceRoles || relation.sourceRoles.length === 0
    const targetMatches = targetRole
      ? !relation.targetRoles || relation.targetRoles.length === 0 || relation.targetRoles.includes(targetRole)
      : !relation.targetRoles || relation.targetRoles.length === 0

    return sourceMatches && targetMatches
  })
}

export function getPatternNextNodeSuggestions(
  pattern: ArchitecturePattern,
  sourceRole: string
): { targetRoles: string[]; defaultRelationType: RelationType } | undefined {
  const definition = PATTERN_CATALOG[pattern]
  if (!definition) return undefined

  const suggestion = definition.nextNodeSuggestions.find((s) => s.sourceRole === sourceRole)
  if (!suggestion) return undefined

  return {
    targetRoles: suggestion.suggestedTargetRoles,
    defaultRelationType: suggestion.defaultRelationType
  }
}
