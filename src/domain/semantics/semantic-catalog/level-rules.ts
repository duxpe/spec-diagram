import { SemanticLevel } from '@/domain/models/board'
import { RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import {
  ALL_NODE_TYPES,
  ALL_RELATION_TYPES,
  N1_DRILLDOWN_ELIGIBLE_TYPES,
  N1_NODE_TYPES,
  N1_RELATION_TYPES,
  N2_NODE_TYPES,
  N2_RELATION_TYPES
} from '@/domain/semantics/semantic-catalog/constants'

export function getAllowedNodeTypes(level: SemanticLevel): SemanticNodeType[] {
  if (level === 'N1') return N1_NODE_TYPES
  if (level === 'N2') return N2_NODE_TYPES
  return ALL_NODE_TYPES
}

export function getAllowedRelationTypes(level: SemanticLevel): RelationType[] {
  if (level === 'N1') return N1_RELATION_TYPES
  if (level === 'N2') return N2_RELATION_TYPES
  return ALL_RELATION_TYPES
}

export function isNodeTypeAllowedForLevel(level: SemanticLevel, type: SemanticNodeType): boolean {
  return getAllowedNodeTypes(level).includes(type)
}

export function isRelationTypeAllowedForLevel(level: SemanticLevel, type: RelationType): boolean {
  return getAllowedRelationTypes(level).includes(type)
}

export function canOpenDetail(node: Pick<SemanticNode, 'level' | 'type'>): boolean {
  if (node.level === 'N2') return false
  return N1_DRILLDOWN_ELIGIBLE_TYPES.has(node.type)
}
