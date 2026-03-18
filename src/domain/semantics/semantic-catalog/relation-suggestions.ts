import { RelationType } from '@/domain/models/relation'
import { SemanticNodeType } from '@/domain/models/semantic-node'

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
