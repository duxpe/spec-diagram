import type { Edge, Node } from '@xyflow/react'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { nowIso } from '@/shared/lib/dates'
import {
  NODE_HEIGHT_FALLBACK,
  NODE_WIDTH_FALLBACK
} from '@/features/board/canvas/reactflow-adapter/constants'
import {
  asFiniteNumber,
  asPositiveNumber,
  asRelationType,
  asSemanticNodeType
} from '@/features/board/canvas/reactflow-adapter/normalization'
import {
  isNodeEquivalent,
  isRelationEquivalent
} from '@/features/board/canvas/reactflow-adapter/equivalence'
import type {
  CanvasMappingContext,
  CanvasMappingResult,
  RFEdgeData,
  RFNodeData
} from '@/features/board/canvas/reactflow-adapter/types'

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
      projectId: context.projectId,
      boardId: context.boardId,
      parentNodeId: existingNode?.parentNodeId,
      level: existingNode?.level ?? context.level,
      type: asSemanticNodeType(nodeData.semanticType, 'system'),
      title:
        typeof nodeData.title === 'string' && nodeData.title.trim().length > 0
          ? nodeData.title
          : (existingNode?.title ?? 'Untitled Node'),
      description: existingNode?.description,
      meaning: existingNode?.meaning,
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

    if (!nodeById.has(rfEdge.source) || !nodeById.has(rfEdge.target)) {
      continue
    }

    const existingRelation = existingRelationById.get(edgeData.semanticId)

    const nextRelation: Relation = {
      id: edgeData.semanticId,
      projectId: context.projectId,
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

    if (existingRelation && isRelationEquivalent(existingRelation, nextRelation)) {
      relations.push(existingRelation)
      continue
    }

    relations.push(nextRelation)
  }

  return { nodes, relations }
}
