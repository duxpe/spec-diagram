import type { NodeAppearance } from '@/domain/models/node-appearance'
import type { RelationType } from '@/domain/models/relation'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import type { ArchitecturePattern } from '@/domain/models/project'

export interface PatternNodeEntry {
  type: SemanticNodeType
  patternRole: string
  label: string
  marker: string
  defaultAppearance?: Partial<NodeAppearance>
}

export interface PatternRelationEntry {
  type: RelationType
  label: string
  sourceRoles?: string[]
  targetRoles?: string[]
}

export interface PatternNextNodeSuggestion {
  sourceRole: string
  suggestedTargetRoles: string[]
  defaultRelationType: RelationType
}

export interface PatternDefinition {
  id: ArchitecturePattern
  name: string
  description: string
  n1Nodes: PatternNodeEntry[]
  n1Relations: PatternRelationEntry[]
  nextNodeSuggestions: PatternNextNodeSuggestion[]
}
