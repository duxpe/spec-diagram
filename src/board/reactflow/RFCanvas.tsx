import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  type OnSelectionChangeParams,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
  type ReactFlowInstance,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { SemanticLevel } from '@/domain/models/board'
import { ActiveTheme } from '@/domain/models/node-appearance'
import { Relation } from '@/domain/models/relation'
import { SemanticNode } from '@/domain/models/semantic-node'

import { SemanticNode as SemanticNodeComponent } from './nodes/SemanticNode'
import { RelationEdge } from './edges/RelationEdge'
import {
  toRFNodes,
  toRFEdges,
  fromRFChanges,
  getSemanticNodeIdFromRFNode,
  type RFNodeData,
  type RFEdgeData
} from './reactflow-adapter'
import './styles/reactflow.css'

// ─────────────────────────────────────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface ZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
}

interface RFCanvasProps {
  persistenceKey: string
  workspaceId: string
  boardId: string
  level: SemanticLevel
  theme: ActiveTheme
  nodes: SemanticNode[]
  relations: Relation[]
  selectedNodeId?: string
  onSelectNode: (nodeId?: string) => void
  onCanvasChange: (boardId: string, nodes: SemanticNode[], relations: Relation[]) => boolean | void
  onCanvasReady?: (controls: ZoomControls) => void
  onNodeClick?: (nodeId: string, screenX: number, screenY: number) => void
  onPendingConnect?: (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  onEdgeContextMenu?: (edgeId: string, screenX: number, screenY: number) => void
  onConnectionToEmpty?: (sourceNodeId: string, screenX: number, screenY: number, canvasX: number, canvasY: number) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Node/Edge Types
// ─────────────────────────────────────────────────────────────────────────────

const nodeTypes = {
  'semantic-node': SemanticNodeComponent
}

const edgeTypes = {
  relation: RelationEdge
}

const defaultEdgeOptions = {
  type: 'relation',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: 'rgba(156, 163, 175, 0.6)'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: exposes zoom controls to parent via callback
// ─────────────────────────────────────────────────────────────────────────────

function CanvasControls({ onReady }: { onReady?: (ctrl: ZoomControls) => void }): null {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  useEffect(() => {
    if (!onReady) return
    onReady({ zoomIn, zoomOut, fitView })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RFCanvas({
  workspaceId,
  boardId,
  level,
  theme,
  nodes: semanticNodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onCanvasChange,
  onCanvasReady,
  onNodeClick: onNodeClickProp,
  onPendingConnect,
  onEdgeContextMenu: onEdgeContextMenuProp,
  onConnectionToEmpty
}: RFCanvasProps): JSX.Element {
  // Refs for feedback loop prevention and board identity guard
  const isApplyingDomainRef = useRef(false)
  const mountedBoardIdentity = useRef(`${workspaceId}:${boardId}`)
  const latestPropsRef = useRef({
    workspaceId,
    boardId,
    level,
    nodes: semanticNodes,
    relations
  })

  // Keep latestPropsRef up to date
  useEffect(() => {
    latestPropsRef.current = {
      workspaceId,
      boardId,
      level,
      nodes: semanticNodes,
      relations
    }
  }, [workspaceId, boardId, level, semanticNodes, relations])

  // Convert domain state to React Flow state
  const initialNodes = useMemo(() => toRFNodes(semanticNodes) as Node[], [])
  const initialEdges = useMemo(() => {
    const nodeById = new Map(semanticNodes.map((n) => [n.id, n]))
    return toRFEdges(relations, nodeById) as Edge[]
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const latestCanvasStateRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: initialNodes,
    edges: initialEdges
  })
  const skipDomainSyncRef = useRef(false)
  const pendingDomainSyncRef = useRef(false)
  const syncFrameRef = useRef<number | null>(null)
  const latestDomainStateRef = useRef({ nodes: semanticNodes, relations })

  useEffect(() => {
    latestCanvasStateRef.current = { nodes, edges }
  }, [nodes, edges])

  // Sync domain state changes to React Flow (domain -> RF)
  const runDomainSync = useCallback(() => {
    const { nodes: currentNodes, relations: currentRelations } = latestDomainStateRef.current
    const nodeById = new Map(currentNodes.map((n) => [n.id, n]))
    const rfNodes = toRFNodes(currentNodes) as Node[]
    const rfEdges = toRFEdges(currentRelations, nodeById) as Edge[]

    setNodes((currentNodes) => {
      const selectedIds = new Set(currentNodes.filter((n) => n.selected).map((n) => n.id))
      return rfNodes.map((n) => ({ ...n, selected: selectedIds.has(n.id) }))
    })
    setEdges(rfEdges)
  }, [setNodes, setEdges])

  const attemptDomainSync = useCallback(() => {
    if (skipDomainSyncRef.current) {
      skipDomainSyncRef.current = false
      return
    }

    if (isApplyingDomainRef.current) {
      if (pendingDomainSyncRef.current) return

      pendingDomainSyncRef.current = true
      syncFrameRef.current = requestAnimationFrame(() => {
        syncFrameRef.current = null
        pendingDomainSyncRef.current = false
        if (isApplyingDomainRef.current) {
          attemptDomainSync()
          return
        }
        runDomainSync()
      })
      return
    }

    runDomainSync()
  }, [runDomainSync])

  useEffect(() => {
    attemptDomainSync()
    return () => {
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current)
        syncFrameRef.current = null
        pendingDomainSyncRef.current = false
      }
    }
  }, [attemptDomainSync])

  useEffect(() => {
    latestDomainStateRef.current = { nodes: semanticNodes, relations }
    attemptDomainSync()
  }, [semanticNodes, relations, attemptDomainSync])

  const emitCanvasChange = useCallback(() => {
    if (isApplyingDomainRef.current) return

    const latest = latestPropsRef.current
    const latestBoardIdentity = `${latest.workspaceId}:${latest.boardId}`
    if (latestBoardIdentity !== mountedBoardIdentity.current) return

    isApplyingDomainRef.current = true
    try {
      const { nodes: currentNodes, edges: currentEdges } = latestCanvasStateRef.current
      const mapped = fromRFChanges(currentNodes, currentEdges, {
        workspaceId: latest.workspaceId,
        boardId: latest.boardId,
        level: latest.level,
        existingNodes: latest.nodes,
        existingRelations: latest.relations
      })

      const applied = onCanvasChange(latest.boardId, mapped.nodes, mapped.relations)
      if (applied === true) {
        skipDomainSyncRef.current = true
      }
    } finally {
      isApplyingDomainRef.current = false
    }
  }, [onCanvasChange])

  // Handle node changes from React Flow
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local React Flow state
      onNodesChange(changes)

      // Skip mapping back to domain if we're applying domain changes
      if (isApplyingDomainRef.current) return

      // Board identity guard - prevent stale updates
      const latest = latestPropsRef.current
      const latestBoardIdentity = `${latest.workspaceId}:${latest.boardId}`
      if (latestBoardIdentity !== mountedBoardIdentity.current) return

      // Only process position/dimension changes, not selection changes
      const hasRelevantChanges = changes.some(
        (change) =>
          change.type === 'position' ||
          change.type === 'dimensions' ||
          change.type === 'remove'
      )

      if (!hasRelevantChanges) return

      // Debounce the mapping back to domain - use requestAnimationFrame
      requestAnimationFrame(() => {
        emitCanvasChange()
      })
    },
    [onNodesChange, emitCanvasChange]
  )

  // Handle edge changes from React Flow
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)

      // Skip if applying domain changes
      if (isApplyingDomainRef.current) return

      // Board identity guard
      const latest = latestPropsRef.current
      const latestBoardIdentity = `${latest.workspaceId}:${latest.boardId}`
      if (latestBoardIdentity !== mountedBoardIdentity.current) return

      // Only process remove changes
      const hasRelevantChanges = changes.some((change) => change.type === 'remove')
      if (!hasRelevantChanges) return

      requestAnimationFrame(() => {
        emitCanvasChange()
      })
    },
    [onEdgesChange, emitCanvasChange]
  )

  // Handle new connections (edge creation) → open relation type dialog in parent
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !onPendingConnect) return
      // RF node IDs are the semantic node IDs (see reactflow-adapter)
      onPendingConnect(
        connection.source,
        connection.target,
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined
      )
    },
    [onPendingConnect]
  )

  // Handle node click → expose screen position to parent for NodeActionMenu
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!onNodeClickProp) return
      if (event.button !== 0) return
      const semanticId = getSemanticNodeIdFromRFNode(node)
      if (semanticId) {
        onNodeClickProp(semanticId, event.clientX, event.clientY)
      }
    },
    [onNodeClickProp]
  )

  // Handle selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length === 1) {
        const semanticId = getSemanticNodeIdFromRFNode(selectedNodes[0])
        onSelectNode(semanticId)
      }
      // Multi-selection or transient empty selections keep current selection.
    },
    [onSelectNode]
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(undefined)
  }, [onSelectNode])

  // Handle edge right-click → context menu
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      if (!onEdgeContextMenuProp) return
      const data = edge.data as RFEdgeData | undefined
      const edgeId = data?.semanticId ?? edge.id
      onEdgeContextMenuProp(edgeId, event.clientX, event.clientY)
    },
    [onEdgeContextMenuProp]
  )

  // Track connection start for empty-space detection
  const connectStartRef = useRef<string | null>(null)
  const reactFlowInstanceRef = useRef<ReactFlowInstance<Node, Edge> | null>(null)

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

      // Check if we dropped on a node handle (React Flow would have called onConnect)
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
    [onConnectionToEmpty]
  )

  // Sync selectedNodeId prop to React Flow selection
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: selectedNodeId ? node.id === selectedNodeId : false
      }))
    )
  }, [selectedNodeId, setNodes])

  return (
    <div
      className={`rf-canvas rf-canvas--${theme}`}
      aria-label="Board whiteboard"
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onEdgeContextMenu={handleEdgeContextMenu}
        onSelectionChange={handleSelectionChange}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance
        }}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Backspace', 'Delete']}
        selectionKeyCode={['Shift']}
        multiSelectionKeyCode={['Meta', 'Control']}
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
      >
        <CanvasControls onReady={onCanvasReady} />
        <Background
          color={theme === 'dark' ? '#334155' : '#d1d5db'}
          gap={24}
          size={1.5}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as RFNodeData | undefined
            return data?.accentColor ? `var(--accent-${data.accentColor})` : '#64748b'
          }}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  )
}
