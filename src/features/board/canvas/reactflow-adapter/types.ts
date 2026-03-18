import type { Edge, Node } from '@xyflow/react'
import type { MouseEvent } from 'react'
import type { SemanticLevel } from '@/domain/models/board'
import type {
  AccentColorToken,
  GenericIconId,
  NodeShapeVariant,
  ProviderServiceId,
  VisualProvider
} from '@/domain/models/node-appearance'
import type { Relation, RelationType } from '@/domain/models/relation'
import type { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'

export interface RFNodeData extends Record<string, unknown> {
  semanticId: string
  semanticType: SemanticNodeType
  title: string
  shapeVariant: NodeShapeVariant
  icon: GenericIconId
  accentColor: AccentColorToken
  provider: VisualProvider
  providerService?: ProviderServiceId
  showProviderBadge: boolean
  hasChildBoard: boolean
  hasValidationErrors: boolean
  width: number
  height: number
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
}

export interface RFEdgeData extends Record<string, unknown> {
  semanticId: string
  relationType: RelationType
  label?: string
}

export type SemanticRFNode = Node<RFNodeData, 'semantic-node'>
export type SemanticRFEdge = Edge<RFEdgeData>

export interface CanvasMappingContext {
  projectId: string
  boardId: string
  level: SemanticLevel
  existingNodes: SemanticNode[]
  existingRelations: Relation[]
}

export interface CanvasMappingResult {
  nodes: SemanticNode[]
  relations: Relation[]
}

export interface NodeMappingOptions {
  onNodeContextMenu?: (nodeId: string, screenX: number, screenY: number) => void
}
