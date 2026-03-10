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

export interface Relation {
  id: string
  workspaceId: string
  boardId: string
  sourceNodeId: string
  targetNodeId: string
  label?: string
  type: RelationType
  createdAt: string
  updatedAt: string
}
