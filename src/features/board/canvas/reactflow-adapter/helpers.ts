import type { Node } from '@xyflow/react'
import type { RFNodeData } from '@/features/board/canvas/reactflow-adapter/types'

export function getSemanticNodeIdFromRFNode(rfNode: Node | undefined): string | undefined {
  if (!rfNode) return undefined
  if (rfNode.type !== 'semantic-node') return undefined
  const data = rfNode.data as RFNodeData | undefined
  return data?.semanticId
}
