import type { RelationType } from '@/domain/models/relation'
import type { SemanticNodeType } from '@/domain/models/semantic-node'

export const ALL_NODE_TYPES: SemanticNodeType[] = [
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
  'free_note_input',
  'free_note_output'
]

export const ALL_RELATION_TYPES: RelationType[] = [
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

export const N1_NODE_TYPES: SemanticNodeType[] = [
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

export const N2_NODE_TYPES: SemanticNodeType[] = [
  'class',
  'interface',
  'api_contract',
  'free_note_input',
  'free_note_output'
]

export const N1_RELATION_TYPES: RelationType[] = [
  'depends_on',
  'calls',
  'reads',
  'writes',
  'uses',
  'exposes',
  'decides'
]

export const N2_RELATION_TYPES: RelationType[] = [
  'depends_on',
  'implements',
  'extends',
  'uses',
  'exposes',
  'calls'
]

export const N1_DRILLDOWN_ELIGIBLE_TYPES = new Set<SemanticNodeType>([
  'system',
  'container_service',
  'database',
  'external_system',
  'port',
  'adapter'
])
