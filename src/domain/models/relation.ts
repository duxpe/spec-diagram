export type RelationType =
  | 'depends_on'
  | 'calls'
  | 'reads'
  | 'writes'
  | 'implements'
  | 'extends'
  | 'uses'
  | 'exposes'
  | 'contains'
  | 'decides'
  | 'invokes'
  | 'publishes_to'
  | 'subscribes_to'
  | 'communicates_with'
  | 'serves'
  | 'routes_to'
  | 'authenticates_with'
  | 'registers_in'
  | 'updates'
  | 'renders'
  | 'replicates_to'
  | 'consumes_from'
  | 'synchronizes_with'
  | 'requests_from'
  | 'responds_to'
  | 'delegates_to'
  | 'returns_to'
  | 'queues_for'
  | 'aggregates_from'
  | 'monitors'
  | 'loads'
  | 'exposes_port'
  | 'implemented_by_adapter'

export interface Relation {
  id: string
  workspaceId: string
  boardId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandleId?: string
  targetHandleId?: string
  label?: string
  type: RelationType
  createdAt: string
  updatedAt: string
}
