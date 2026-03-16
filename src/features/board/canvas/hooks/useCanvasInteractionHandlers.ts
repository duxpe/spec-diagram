import { useCallback, useRef, type MutableRefObject } from 'react'
import type {
  Connection,
  Edge,
  Node,
  OnSelectionChangeParams,
  ReactFlowInstance
} from '@xyflow/react'
import type { RFEdgeData } from '@/features/board/canvas/reactflow-adapter'
import { getSemanticNodeIdFromRFNode } from '@/features/board/canvas/reactflow-adapter'

interface UseCanvasInteractionHandlersInput {
  onPendingConnect?: (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  onSelectNode: (nodeId?: string) => void
  onEdgeContextMenu?: (edgeId: string, screenX: number, screenY: number) => void
  onConnectionToEmpty?: (
    sourceNodeId: string,
    screenX: number,
    screenY: number,
    canvasX: number,
    canvasY: number
  ) => void
  reactFlowInstanceRef: MutableRefObject<ReactFlowInstance<Node, Edge> | null>
}

export function useCanvasInteractionHandlers({
  onPendingConnect,
  onSelectNode,
  onEdgeContextMenu,
  onConnectionToEmpty,
  reactFlowInstanceRef
}: UseCanvasInteractionHandlersInput) {
  const connectStartRef = useRef<string | null>(null)

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !onPendingConnect) return
      onPendingConnect(
        connection.source,
        connection.target,
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined
      )
    },
    [onPendingConnect]
  )

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length === 1) {
        const semanticId = getSemanticNodeIdFromRFNode(selectedNodes[0])
        onSelectNode(semanticId)
      }
    },
    [onSelectNode]
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(undefined)
  }, [onSelectNode])

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      if (!onEdgeContextMenu) return
      const data = edge.data as RFEdgeData | undefined
      const edgeId = data?.semanticId ?? edge.id
      onEdgeContextMenu(edgeId, event.clientX, event.clientY)
    },
    [onEdgeContextMenu]
  )

  const handleConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params: { nodeId: string | null }) => {
      connectStartRef.current = params.nodeId
    },
    []
  )

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const sourceNodeId = connectStartRef.current
      connectStartRef.current = null

      if (!sourceNodeId || !onConnectionToEmpty) return

      const target = event.target as HTMLElement
      if (target.closest('.react-flow__handle')) return

      const clientX = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX ?? 0
      const clientY = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY ?? 0

      const canvasPos = reactFlowInstanceRef.current?.screenToFlowPosition({ x: clientX, y: clientY }) ?? {
        x: clientX,
        y: clientY
      }
      onConnectionToEmpty(sourceNodeId, clientX, clientY, canvasPos.x, canvasPos.y)
    },
    [onConnectionToEmpty, reactFlowInstanceRef]
  )

  return {
    handleConnect,
    handleSelectionChange,
    handlePaneClick,
    handleEdgeContextMenu,
    handleConnectStart,
    handleConnectEnd
  }
}
