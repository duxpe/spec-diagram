import { SemanticLevel } from '@/domain/models/board'
import { RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { ArchitecturePattern } from '@/domain/models/workspace'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'

const ALL_NODE_TYPES: SemanticNodeType[] = [
  'system',
  'container_service',
  'database',
  'external_system',
  'api_contract',
  'decision',
  'class',
  'interface',
  'port',
  'adapter',
  'method',
  'attribute',
  'free_note_input',
  'free_note_output'
]

const ALL_RELATION_TYPES: RelationType[] = [
  'depends_on',
  'calls',
  'reads',
  'writes',
  'implements',
  'extends',
  'uses',
  'exposes',
  'contains',
  'decides',
  'invokes',
  'publishes_to',
  'subscribes_to',
  'communicates_with',
  'serves',
  'routes_to',
  'authenticates_with',
  'registers_in',
  'updates',
  'renders',
  'replicates_to',
  'consumes_from',
  'synchronizes_with',
  'requests_from',
  'responds_to',
  'delegates_to',
  'returns_to',
  'queues_for',
  'aggregates_from',
  'monitors',
  'loads',
  'exposes_port',
  'implemented_by_adapter'
]

const N1_NODE_TYPES: SemanticNodeType[] = [
  'system',
  'container_service',
  'database',
  'external_system',
  'port',
  'adapter',
  'decision',
  'free_note_input',
  'free_note_output'
]

const N2_NODE_TYPES: SemanticNodeType[] = [
  'class',
  'interface',
  'api_contract',
  'free_note_input',
  'free_note_output'
]

const N3_NODE_TYPES: SemanticNodeType[] = [
  'method',
  'attribute',
  'free_note_input',
  'free_note_output'
]

const N1_RELATION_TYPES: RelationType[] = [
  'depends_on',
  'calls',
  'reads',
  'writes',
  'uses',
  'exposes',
  'decides'
]

const N2_RELATION_TYPES: RelationType[] = [
  'depends_on',
  'implements',
  'extends',
  'uses',
  'exposes',
  'calls'
]

const N3_RELATION_TYPES: RelationType[] = ['uses', 'depends_on', 'exposes']

const N1_DRILLDOWN_ELIGIBLE_TYPES = new Set<SemanticNodeType>([
  'system',
  'container_service',
  'database',
  'external_system',
  'port',
  'adapter'
])

export function getAllowedNodeTypes(level: SemanticLevel): SemanticNodeType[] {
  if (level === 'N1') return N1_NODE_TYPES
  if (level === 'N2') return N2_NODE_TYPES
  if (level === 'N3') return N3_NODE_TYPES
  return ALL_NODE_TYPES
}

export function getAllowedRelationTypes(level: SemanticLevel): RelationType[] {
  if (level === 'N1') return N1_RELATION_TYPES
  if (level === 'N2') return N2_RELATION_TYPES
  if (level === 'N3') return N3_RELATION_TYPES
  return ALL_RELATION_TYPES
}

export function isNodeTypeAllowedForLevel(level: SemanticLevel, type: SemanticNodeType): boolean {
  return getAllowedNodeTypes(level).includes(type)
}

export function isRelationTypeAllowedForLevel(level: SemanticLevel, type: RelationType): boolean {
  return getAllowedRelationTypes(level).includes(type)
}

export function canOpenDetail(node: Pick<SemanticNode, 'level' | 'type'>): boolean {
  if (node.level === 'N3') return false
  if (node.level === 'N2') return false
  return N1_DRILLDOWN_ELIGIBLE_TYPES.has(node.type)
}

export function getDefaultNodeData(level: SemanticLevel, type: SemanticNodeType): Record<string, unknown> {
  if (level === 'N3') {
    switch (type) {
      case 'method':
        return {
          signature: 'execute(input): output',
          purpose: 'Describe method purpose',
          visibility: 'public',
          async: false
        }
      case 'attribute':
        return {
          typeSignature: 'string',
          purpose: 'Describe attribute purpose',
          visibility: 'private',
          required: false
        }
      case 'free_note_input':
        return {
          expectedInputsText: 'Describe expected inputs'
        }
      case 'free_note_output':
        return {
          expectedOutputsText: 'Describe expected outputs'
        }
      default:
        return {}
    }
  }

  if (level === 'N2') {
    switch (type) {
      case 'class':
        return {
          responsibility: 'Describe class responsibility',
          internals: {
            methods: [],
            attributes: []
          }
        }
      case 'interface':
        return {
          purpose: 'Describe interface purpose',
          internals: {
            methods: [],
            attributes: []
          }
        }
      case 'api_contract':
        return {
          kind: 'http',
          inputSummary: ['Describe contract input'],
          outputSummary: ['Describe contract output'],
          internals: {
            endpoints: []
          }
        }
      case 'free_note_input':
        return {
          expectedInputsText: 'Describe expected inputs'
        }
      case 'free_note_output':
        return {
          expectedOutputsText: 'Describe expected outputs'
        }
      default:
        return {}
    }
  }

  if (level !== 'N1') return {}

  switch (type) {
    case 'system':
      return {
        goal: 'Define the high-level business goal',
        primaryResponsibilities: ['Define primary responsibility']
      }
    case 'container_service':
      return {
        responsibility: 'Describe the main responsibility'
      }
    case 'database':
      return {
        purpose: 'Describe what this database stores',
        storageModel: 'relational'
      }
    case 'external_system':
      return {
        purpose: 'Describe why this external system exists',
        interactionType: 'unknown'
      }
    case 'port':
      return {
        direction: 'inbound',
        responsibility: 'Describe what this port is responsible for'
      }
    case 'adapter':
      return {
        responsibility: 'Describe what this adapter does'
      }
    case 'decision':
      return {
        decision: 'Describe the architectural decision',
        status: 'proposed'
      }
    case 'free_note_input':
      return {
        expectedInputsText: 'Describe expected inputs'
      }
    case 'free_note_output':
      return {
        expectedOutputsText: 'Describe expected outputs'
      }
    default:
      return {}
  }
}

export function getN1RelationSuggestion(
  sourceType: SemanticNodeType | undefined,
  targetType: SemanticNodeType | undefined,
  relationType: RelationType
): string | undefined {
  if (!sourceType || !targetType) return undefined

  if (sourceType === 'database' && relationType === 'calls') {
    return 'Suggestion: database usually should not originate "calls" in N1.'
  }

  if (
    sourceType === 'decision' &&
    relationType !== 'decides' &&
    relationType !== 'depends_on'
  ) {
    return 'Suggestion: decision usually uses "decides" or "depends_on".'
  }

  if (sourceType === 'port' && !['adapter', 'system', 'container_service'].includes(targetType)) {
    return 'Suggestion: port usually relates to adapter, system, or container_service.'
  }

  if (
    sourceType === 'adapter' &&
    !['port', 'external_system'].includes(targetType) &&
    (relationType === 'depends_on' || relationType === 'uses' || relationType === 'calls')
  ) {
    return 'Suggestion: adapter usually points to port and/or external_system.'
  }

  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-aware functions
// ─────────────────────────────────────────────────────────────────────────────

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
