export {
  getAllowedNodeTypes,
  getAllowedRelationTypes,
  isNodeTypeAllowedForLevel,
  isRelationTypeAllowedForLevel,
  canOpenDetail
} from '@/domain/semantics/semantic-catalog/level-rules'

export { getDefaultNodeData } from '@/domain/semantics/semantic-catalog/default-node-data'

export { getN1RelationSuggestion } from '@/domain/semantics/semantic-catalog/relation-suggestions'

export {
  getPatternN1NodeTypes,
  getPatternAllowedRelationTypes,
  isPatternRelationTypeAllowed,
  getPatternNextNodeSuggestions
} from '@/domain/semantics/semantic-catalog/pattern-rules'
