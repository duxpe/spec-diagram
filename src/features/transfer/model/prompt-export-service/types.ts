import type { Board } from '@/domain/models/board'
import type { ExportPromptType } from '@/domain/models/export'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { Project } from '@/domain/models/project'

export interface PromptExportBuildInput {
  project: Project
  boards: Board[]
  nodes: SemanticNode[]
  relations: Relation[]
  exportType: ExportPromptType
  exportedAt?: string
}

export interface RelationDescriptor {
  id: string
  type: Relation['type']
  label?: string
  sourceNodeId: string
  sourceTitle: string
  targetNodeId: string
  targetTitle: string
  createdAt: string
}

export interface N3NodeContext {
  type: 'method' | 'attribute' | 'endpoint'
  title: string
  description?: string
  data: Record<string, unknown>
}

export interface N2NodeContext {
  node: SemanticNode
  relations: RelationDescriptor[]
  n3Nodes: N3NodeContext[]
}

export interface ExportContext {
  project: Project
  rootBoard: Board
  rootNode: SemanticNode
  rootRelations: RelationDescriptor[]
  globalNotes: SemanticNode[]
  globalDecisions: SemanticNode[]
  n2Nodes: N2NodeContext[]
}
