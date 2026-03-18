import { MarkerType } from '@xyflow/react'
import type { MouseEvent } from 'react'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { resolveNodeVisual } from '@/domain/semantics/node-visual-catalog'
import { normalizeNumber } from '@/features/board/canvas/reactflow-adapter/normalization'
import type {
  NodeMappingOptions,
  SemanticRFEdge,
  SemanticRFNode
} from '@/features/board/canvas/reactflow-adapter/types'

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

export function toRFEdges(relations: Relation[], nodeById?: Map<string, SemanticNode>): SemanticRFEdge[] {
  return relations
    .filter((relation) => {
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
