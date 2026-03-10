import { TLShape, TLShapePartial } from 'tldraw'
import { SemanticLevel } from '@/domain/models/board'
import { AccentColorToken } from '@/domain/models/node-appearance'
import { Relation, RelationType } from '@/domain/models/relation'
import { SemanticNode, SemanticNodeType } from '@/domain/models/semantic-node'
import { relationTypeSchema } from '@/domain/schemas/relation.schema'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { semanticNodeTypeSchema } from '@/domain/schemas/semantic-node.schema'
import { resolveNodeVisual } from '@/domain/semantics/node-visual-catalog'
import { nowIso } from '@/utils/dates'
import type { SemanticNodeShape } from './SemanticNodeShapeUtil'

const NODE_META_KIND = 'node'
const RELATION_META_KIND = 'relation'

const NODE_WIDTH_FALLBACK = 220
const NODE_HEIGHT_FALLBACK = 110
const EDGE_PADDING = 8
const FLOAT_TOLERANCE = 0.05
const TL_COLOR_BY_ACCENT: Record<AccentColorToken, string> = {
  cyan: 'light-blue',
  teal: 'green',
  amber: 'yellow',
  gray: 'grey',
  indigo: 'violet',
  orange: 'orange',
  blue: 'blue',
  purple: 'light-violet',
  green: 'green',
  neutral: 'grey'
}

interface SemanticNodeShapeMeta {
  semanticKind: typeof NODE_META_KIND
  semanticId: string
  semanticType: SemanticNodeType
}

interface SemanticRelationShapeMeta {
  semanticKind: typeof RELATION_META_KIND
  semanticId: string
  sourceNodeId: string
  targetNodeId: string
  relationType: RelationType
}

interface Point {
  x: number
  y: number
}

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

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null
}

function asSemanticNodeType(input: unknown, fallback: SemanticNodeType): SemanticNodeType {
  const parsed = semanticNodeTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}

function asRelationType(input: unknown, fallback: RelationType): RelationType {
  const parsed = relationTypeSchema.safeParse(input)
  return parsed.success ? parsed.data : fallback
}

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

function buildNodeMeta(node: SemanticNode): SemanticNodeShapeMeta {
  return {
    semanticKind: NODE_META_KIND,
    semanticId: node.id,
    semanticType: node.type
  }
}

function buildRelationMeta(relation: Relation): SemanticRelationShapeMeta {
  return {
    semanticKind: RELATION_META_KIND,
    semanticId: relation.id,
    sourceNodeId: relation.sourceNodeId,
    targetNodeId: relation.targetNodeId,
    relationType: relation.type
  }
}

function isSemanticNodeMeta(meta: unknown): meta is SemanticNodeShapeMeta {
  if (!isObjectRecord(meta)) return false

  return (
    meta.semanticKind === NODE_META_KIND &&
    typeof meta.semanticId === 'string' &&
    meta.semanticId.length > 0 &&
    semanticNodeTypeSchema.safeParse(meta.semanticType).success
  )
}

function isSemanticRelationMeta(meta: unknown): meta is SemanticRelationShapeMeta {
  if (!isObjectRecord(meta)) return false

  return (
    meta.semanticKind === RELATION_META_KIND &&
    typeof meta.semanticId === 'string' &&
    meta.semanticId.length > 0 &&
    typeof meta.sourceNodeId === 'string' &&
    meta.sourceNodeId.length > 0 &&
    typeof meta.targetNodeId === 'string' &&
    meta.targetNodeId.length > 0 &&
    relationTypeSchema.safeParse(meta.relationType).success
  )
}

function getNodeCenter(node: SemanticNode): Point {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  }
}

function getEdgeAnchorPoint(node: SemanticNode, toward: Point, padding: number): Point {
  const center = getNodeCenter(node)
  const vectorX = toward.x - center.x
  const vectorY = toward.y - center.y

  if (almostEqual(vectorX, 0) && almostEqual(vectorY, 0)) {
    return center
  }

  const halfWidth = node.width / 2
  const halfHeight = node.height / 2

  const scale =
    1 /
    Math.max(Math.abs(vectorX) / Math.max(halfWidth, 1), Math.abs(vectorY) / Math.max(halfHeight, 1))

  const edgeX = center.x + vectorX * scale
  const edgeY = center.y + vectorY * scale

  const length = Math.hypot(vectorX, vectorY)
  const normX = vectorX / (length || 1)
  const normY = vectorY / (length || 1)

  return {
    x: normalizeNumber(edgeX + normX * padding),
    y: normalizeNumber(edgeY + normY * padding)
  }
}

function relationArrowGeometry(sourceNode: SemanticNode, targetNode: SemanticNode): {
  x: number
  y: number
  startX: number
  startY: number
  endX: number
  endY: number
} {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)

  const startPoint = getEdgeAnchorPoint(sourceNode, targetCenter, EDGE_PADDING)
  const endPoint = getEdgeAnchorPoint(targetNode, sourceCenter, EDGE_PADDING)

  const x = Math.min(startPoint.x, endPoint.x)
  const y = Math.min(startPoint.y, endPoint.y)

  return {
    x,
    y,
    startX: normalizeNumber(startPoint.x - x),
    startY: normalizeNumber(startPoint.y - y),
    endX: normalizeNumber(endPoint.x - x),
    endY: normalizeNumber(endPoint.y - y)
  }
}

function isNodeEquivalent(current: SemanticNode, next: SemanticNode): boolean {
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

function isRelationEquivalent(current: Relation, next: Relation): boolean {
  return (
    current.id === next.id &&
    current.workspaceId === next.workspaceId &&
    current.boardId === next.boardId &&
    current.sourceNodeId === next.sourceNodeId &&
    current.targetNodeId === next.targetNodeId &&
    current.label === next.label &&
    current.type === next.type
  )
}

export function getNodeShapeId(nodeId: string): string {
  return `shape:semantic-node-${nodeId}`
}

export function getRelationShapeId(relationId: string): string {
  return `shape:semantic-relation-${relationId}`
}

export function isSemanticShape(shape: TLShape): boolean {
  return shape.type === 'semantic-node' || isSemanticRelationMeta(shape.meta)
}

export function getSemanticNodeIdFromShape(shape: TLShape | undefined): string | undefined {
  if (!shape) return undefined

  if (shape.type === 'semantic-node') {
    const props = isObjectRecord(shape.props) ? shape.props : {}
    return typeof props.semanticId === 'string' ? props.semanticId : undefined
  }

  return undefined
}

export function toTlRecords(nodes: SemanticNode[], relations: Relation[]): TLShapePartial[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const nodeShapes: TLShapePartial[] = nodes.map(
    (node) => {
      const visual = resolveNodeVisual(node)
      const hasValidationIssues = getPayloadIssuesForNodeType(node.type, node.data).length > 0

      return {
        id: getNodeShapeId(node.id),
        type: 'semantic-node',
        x: normalizeNumber(node.x),
        y: normalizeNumber(node.y),
        props: {
          w: normalizeNumber(node.width),
          h: normalizeNumber(node.height),
          text: node.title,
          color: TL_COLOR_BY_ACCENT[visual.accentColor],
          // Semantic metadata
          semanticId: node.id,
          semanticType: node.type,
          // Visual properties
          shapeVariant: visual.shapeVariant,
          icon: visual.icon,
          accentColor: visual.accentColor,
          provider: visual.provider,
          providerService: visual.providerService,
          showProviderBadge: visual.showProviderBadge,
          hasChildBoard: !!node.childBoardId,
          hasValidationErrors: hasValidationIssues
        }
      } as TLShapePartial
    }
  )

  const relationShapes: TLShapePartial[] = []

  for (const relation of relations) {
    const sourceNode = nodeById.get(relation.sourceNodeId)
    const targetNode = nodeById.get(relation.targetNodeId)

    if (!sourceNode || !targetNode) {
      continue
    }

    const geometry = relationArrowGeometry(sourceNode, targetNode)

    relationShapes.push({
      id: getRelationShapeId(relation.id),
      type: 'arrow',
      x: geometry.x,
      y: geometry.y,
      meta: buildRelationMeta(relation) as unknown as Record<string, unknown>,
      props: {
        labelColor: 'black',
        color: 'black',
        fill: 'none',
        dash: 'solid',
        size: 'm',
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        font: 'sans',
        start: {
          x: geometry.startX,
          y: geometry.startY
        },
        end: {
          x: geometry.endX,
          y: geometry.endY
        },
        bend: 0,
        text: relation.label ?? '',
        labelPosition: 0.5,
        scale: 1
      }
    } as TLShapePartial)
  }

  return [...nodeShapes, ...relationShapes]
}

export function fromTlChanges(shapes: TLShape[], context: CanvasMappingContext): CanvasMappingResult {
  const now = nowIso()
  const existingNodeById = new Map(context.existingNodes.map((node) => [node.id, node]))
  const existingRelationById = new Map(context.existingRelations.map((relation) => [relation.id, relation]))

  const nodes: SemanticNode[] = []

  for (const shape of shapes) {
    if (shape.type !== 'semantic-node') continue

    // For semantic-node shapes, properties are directly in props
    const props = isObjectRecord(shape.props) ? shape.props : {}
    const semanticId = typeof props.semanticId === 'string' ? props.semanticId : ''
    const semanticType = asSemanticNodeType(props.semanticType, 'system')

    if (!semanticId) continue

    const existingNode = existingNodeById.get(semanticId)

    const nextNode: SemanticNode = {
      id: semanticId,
      workspaceId: context.workspaceId,
      boardId: context.boardId,
      parentNodeId: existingNode?.parentNodeId,
      level: existingNode?.level ?? context.level,
      type: semanticType,
      title:
        typeof props.text === 'string' && props.text.trim().length > 0
          ? props.text
          : (existingNode?.title ?? 'Untitled Node'),
      description: existingNode?.description,
      x: asFiniteNumber(shape.x, existingNode?.x ?? 0),
      y: asFiniteNumber(shape.y, existingNode?.y ?? 0),
      width: asPositiveNumber(props.w, existingNode?.width ?? NODE_WIDTH_FALLBACK),
      height: asPositiveNumber(props.h, existingNode?.height ?? NODE_HEIGHT_FALLBACK),
      childBoardId: existingNode?.childBoardId,
      data: existingNode?.data ?? {},
      appearance: existingNode?.appearance,
      createdAt: existingNode?.createdAt ?? now,
      updatedAt: now
    }

    if (existingNode && isNodeEquivalent(existingNode, nextNode)) {
      nodes.push(existingNode)
      continue
    }

    nodes.push(nextNode)
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const relations: Relation[] = []

  for (const shape of shapes) {
    if (shape.type !== 'arrow') continue
    if (!isSemanticRelationMeta(shape.meta)) continue

    if (!nodeById.has(shape.meta.sourceNodeId) || !nodeById.has(shape.meta.targetNodeId)) {
      continue
    }

    const existingRelation = existingRelationById.get(shape.meta.semanticId)
    const props = isObjectRecord(shape.props) ? shape.props : {}

    const nextRelation: Relation = {
      id: shape.meta.semanticId,
      workspaceId: context.workspaceId,
      boardId: context.boardId,
      sourceNodeId: shape.meta.sourceNodeId,
      targetNodeId: shape.meta.targetNodeId,
      label: typeof props.text === 'string' && props.text.trim().length > 0 ? props.text : undefined,
      type: asRelationType(shape.meta.relationType, existingRelation?.type ?? 'depends_on'),
      createdAt: existingRelation?.createdAt ?? now,
      updatedAt: now
    }

    if (existingRelation && isRelationEquivalent(existingRelation, nextRelation)) {
      relations.push(existingRelation)
      continue
    }

    relations.push(nextRelation)
  }

  return { nodes, relations }
}
