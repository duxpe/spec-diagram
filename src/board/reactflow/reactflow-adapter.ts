import { MarkerType, type Node, type Edge } from '@xyflow/react'
import type { MouseEvent } from 'react'
import { SemanticLevel } from '@/domain/models/board'
import type {
  AccentColorToken,
  GenericIconId,
  NodeShapeVariant,
  ProviderServiceId,
  VisualProvider
} from '@/domain/models/node-appearance'
import { Relation, RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { relationTypeSchema } from '@/domain/schemas/relation.schema'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { semanticNodeTypeSchema } from '@/domain/schemas/semantic-node.schema'
import { resolveNodeVisual } from '@/domain/semantics/node-visual-catalog'
import { nowIso } from '@/utils/dates'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NODE_WIDTH_FALLBACK = 220
const NODE_HEIGHT_FALLBACK = 110
const FLOAT_TOLERANCE = 0.05

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  workspaceId: string
  boardId: string
  level: SemanticLevel
  existingNodes: SemanticNode[]
  existingRelations: Relation[]
}

export interface CanvasMappingResult {
  nodes: SemanticNode[]
  relations: Relation[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

function normalizeNumber(value: number, precision = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function almostEqual(a: number, b: number, tolerance = FLOAT_TOLERANCE): boolean {
  return Math.abs(a - b) <= tolerance
}

function asFiniteNumber(input: unknown, fallback: number): number {
  return typeof input === 'number' && Number.isFinite(input) ? normalizeNumber(input) : fallback
}

function asPositiveNumber(input: unknown, fallback: number): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0) {
    return fallback
  }
  return normalizeNumber(input)
}

function asSemanticNodeType(input: unknown, fallback: SemanticNodeType): SemanticNodeType {
  const parsed = semanticNodeTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}

function asRelationType(input: unknown, fallback: RelationType): RelationType {
  const parsed = relationTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Equivalence Checks (for object identity preservation)
// ─────────────────────────────────────────────────────────────────────────────

export function isNodeEquivalent(current: SemanticNode, next: SemanticNode): boolean {
  return (
    current.id === next.id &&
    current.workspaceId === next.workspaceId &&
    current.boardId === next.boardId &&
    current.parentNodeId === next.parentNodeId &&
    current.level === next.level &&
    current.type === next.type &&
    current.title === next.title &&
    current.description === next.description &&
    almostEqual(current.x, next.x) &&
    almostEqual(current.y, next.y) &&
    almostEqual(current.width, next.width) &&
    almostEqual(current.height, next.height) &&
    current.childBoardId === next.childBoardId &&
    JSON.stringify(current.data) === JSON.stringify(next.data) &&
    JSON.stringify(current.appearance ?? null) === JSON.stringify(next.appearance ?? null)
  )
}

export function isRelationEquivalent(current: Relation, next: Relation): boolean {
  return (
    current.id === next.id &&
    current.workspaceId === next.workspaceId &&
    current.boardId === next.boardId &&
    current.sourceNodeId === next.sourceNodeId &&
    current.targetNodeId === next.targetNodeId &&
    current.sourceHandleId === next.sourceHandleId &&
    current.targetHandleId === next.targetHandleId &&
    current.label === next.label &&
    current.type === next.type
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain -> React Flow Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts semantic domain nodes to React Flow nodes.
 */
export interface NodeMappingOptions {
  onNodeContextMenu?: (nodeId: string, screenX: number, screenY: number) => void
}

export function toRFNodes(nodes: SemanticNode[], options?: NodeMappingOptions): SemanticRFNode[] {
  return nodes.map((node) => {
    const visual = resolveNodeVisual(node)
    const hasValidationIssues = getPayloadIssuesForNodeType(node.type, node.data).length > 0

    const contextMenuHandler = options?.onNodeContextMenu
      ? (event: MouseEvent<HTMLDivElement>) =>
          options.onNodeContextMenu?.(node.id, event.clientX, event.clientY)
      : undefined

    return {
      id: node.id,
      type: 'semantic-node',
      position: {
        x: normalizeNumber(node.x),
        y: normalizeNumber(node.y)
      },
      data: {
        semanticId: node.id,
        semanticType: node.type,
        title: node.title,
        shapeVariant: visual.shapeVariant,
        icon: visual.icon,
        accentColor: visual.accentColor,
        provider: visual.provider,
        providerService: visual.providerService,
        showProviderBadge: visual.showProviderBadge,
        hasChildBoard: !!node.childBoardId,
        hasValidationErrors: hasValidationIssues,
        width: normalizeNumber(node.width),
        height: normalizeNumber(node.height),
        onContextMenu: contextMenuHandler
      },
      width: normalizeNumber(node.width),
      height: normalizeNumber(node.height),
      style: {
        width: normalizeNumber(node.width),
        height: normalizeNumber(node.height)
      }
    }
  })
}

/**
 * Converts semantic domain relations to React Flow edges.
 */
export function toRFEdges(relations: Relation[], nodeById?: Map<string, SemanticNode>): SemanticRFEdge[] {
  return relations
    .filter((relation) => {
      // If nodeById is provided, verify both endpoints exist
      if (nodeById) {
        return nodeById.has(relation.sourceNodeId) && nodeById.has(relation.targetNodeId)
      }
      return true
    })
    .map((relation) => ({
      id: relation.id,
      type: 'relation',
      source: relation.sourceNodeId,
      target: relation.targetNodeId,
      sourceHandle: relation.sourceHandleId ?? 'right',
      targetHandle: relation.targetHandleId ?? 'left',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      label: relation.label,
      data: {
        semanticId: relation.id,
        relationType: relation.type,
        label: relation.label
      }
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// React Flow -> Domain Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts React Flow nodes and edges back to semantic domain state.
 * Preserves object identity when nodes/relations haven't semantically changed.
 */
export function fromRFChanges(
  rfNodes: Node[],
  rfEdges: Edge[],
  context: CanvasMappingContext
): CanvasMappingResult {
  const now = nowIso()
  const existingNodeById = new Map(context.existingNodes.map((node) => [node.id, node]))
  const existingRelationById = new Map(context.existingRelations.map((relation) => [relation.id, relation]))

  const nodes: SemanticNode[] = []

  for (const rfNode of rfNodes) {
    if (rfNode.type !== 'semantic-node') continue

    const nodeData = rfNode.data as RFNodeData | undefined
    if (!nodeData?.semanticId) continue

    const existingNode = existingNodeById.get(nodeData.semanticId)

    const nextNode: SemanticNode = {
      id: nodeData.semanticId,
      workspaceId: context.workspaceId,
      boardId: context.boardId,
      parentNodeId: existingNode?.parentNodeId,
      level: existingNode?.level ?? context.level,
      type: asSemanticNodeType(nodeData.semanticType, 'system'),
      title:
        typeof nodeData.title === 'string' && nodeData.title.trim().length > 0
          ? nodeData.title
          : (existingNode?.title ?? 'Untitled Node'),
      description: existingNode?.description,
      x: asFiniteNumber(rfNode.position?.x, existingNode?.x ?? 0),
      y: asFiniteNumber(rfNode.position?.y, existingNode?.y ?? 0),
      width: asPositiveNumber(
        rfNode.width ?? nodeData.width,
        existingNode?.width ?? NODE_WIDTH_FALLBACK
      ),
      height: asPositiveNumber(
        rfNode.height ?? nodeData.height,
        existingNode?.height ?? NODE_HEIGHT_FALLBACK
      ),
      childBoardId: existingNode?.childBoardId,
      data: existingNode?.data ?? {},
      appearance: existingNode?.appearance,
      createdAt: existingNode?.createdAt ?? now,
      updatedAt: now
    }

    // Object identity preservation
    if (existingNode && isNodeEquivalent(existingNode, nextNode)) {
      nodes.push(existingNode)
      continue
    }

    nodes.push(nextNode)
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const relations: Relation[] = []

  for (const rfEdge of rfEdges) {
    if (rfEdge.type !== 'relation') continue

    const edgeData = rfEdge.data as RFEdgeData | undefined
    if (!edgeData?.semanticId) continue

    // Verify both endpoints still exist
    if (!nodeById.has(rfEdge.source) || !nodeById.has(rfEdge.target)) {
      continue
    }

    const existingRelation = existingRelationById.get(edgeData.semanticId)

    const nextRelation: Relation = {
      id: edgeData.semanticId,
      workspaceId: context.workspaceId,
      boardId: context.boardId,
      sourceNodeId: rfEdge.source,
      targetNodeId: rfEdge.target,
      sourceHandleId:
        typeof rfEdge.sourceHandle === 'string' && rfEdge.sourceHandle.trim().length > 0
          ? (existingRelation?.sourceHandleId || rfEdge.sourceHandle !== 'right'
              ? rfEdge.sourceHandle
              : undefined)
          : existingRelation?.sourceHandleId,
      targetHandleId:
        typeof rfEdge.targetHandle === 'string' && rfEdge.targetHandle.trim().length > 0
          ? (existingRelation?.targetHandleId || rfEdge.targetHandle !== 'left'
              ? rfEdge.targetHandle
              : undefined)
          : existingRelation?.targetHandleId,
      label:
        typeof edgeData.label === 'string' && edgeData.label.trim().length > 0
          ? edgeData.label
          : undefined,
      type: asRelationType(edgeData.relationType, existingRelation?.type ?? 'depends_on'),
      createdAt: existingRelation?.createdAt ?? now,
      updatedAt: now
    }

    // Object identity preservation
    if (existingRelation && isRelationEquivalent(existingRelation, nextRelation)) {
      relations.push(existingRelation)
      continue
    }

    relations.push(nextRelation)
  }

  return { nodes, relations }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Exports
// ─────────────────────────────────────────────────────────────────────────────

export function getSemanticNodeIdFromRFNode(rfNode: Node | undefined): string | undefined {
  if (!rfNode) return undefined
  if (rfNode.type !== 'semantic-node') return undefined
  const data = rfNode.data as RFNodeData | undefined
  return data?.semanticId
}

export { FLOAT_TOLERANCE, NODE_WIDTH_FALLBACK, NODE_HEIGHT_FALLBACK }
