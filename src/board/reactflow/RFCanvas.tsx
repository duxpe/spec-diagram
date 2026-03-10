import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type OnSelectionChangeParams,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
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
  onCanvasChange: (boardId: string, nodes: SemanticNode[], relations: Relation[]) => void
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
  onCanvasChange
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

  // Sync domain state changes to React Flow (domain -> RF)
  useEffect(() => {
    // Skip if we're currently applying changes back to domain
    if (isApplyingDomainRef.current) return

    const nodeById = new Map(semanticNodes.map((n) => [n.id, n]))
    const rfNodes = toRFNodes(semanticNodes) as Node[]
    const rfEdges = toRFEdges(relations, nodeById) as Edge[]

    setNodes(rfNodes)
    setEdges(rfEdges)
  }, [semanticNodes, relations, setNodes, setEdges])

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
        // Re-check refs after RAF
        if (isApplyingDomainRef.current) return
        const latestCheck = latestPropsRef.current
        if (`${latestCheck.workspaceId}:${latestCheck.boardId}` !== mountedBoardIdentity.current) return

        // Get current RF state and map back to domain
        setNodes((currentNodes) => {
          setEdges((currentEdges) => {
            isApplyingDomainRef.current = true

            const mapped = fromRFChanges(currentNodes, currentEdges, {
              workspaceId: latestCheck.workspaceId,
              boardId: latestCheck.boardId,
              level: latestCheck.level,
              existingNodes: latestCheck.nodes,
              existingRelations: latestCheck.relations
            })

            onCanvasChange(latestCheck.boardId, mapped.nodes, mapped.relations)

            isApplyingDomainRef.current = false
            return currentEdges
          })
          return currentNodes
        })
      })
    },
    [onNodesChange, setNodes, setEdges, onCanvasChange]
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
        if (isApplyingDomainRef.current) return
        const latestCheck = latestPropsRef.current
        if (`${latestCheck.workspaceId}:${latestCheck.boardId}` !== mountedBoardIdentity.current) return

        setNodes((currentNodes) => {
          setEdges((currentEdges) => {
            isApplyingDomainRef.current = true

            const mapped = fromRFChanges(currentNodes, currentEdges, {
              workspaceId: latestCheck.workspaceId,
              boardId: latestCheck.boardId,
              level: latestCheck.level,
              existingNodes: latestCheck.nodes,
              existingRelations: latestCheck.relations
            })

            onCanvasChange(latestCheck.boardId, mapped.nodes, mapped.relations)

            isApplyingDomainRef.current = false
            return currentEdges
          })
          return currentNodes
        })
      })
    },
    [onEdgesChange, setNodes, setEdges, onCanvasChange]
  )

  // Handle new connections (edge creation)
  const handleConnect = useCallback(
    (_connection: Connection) => {
      // Note: Edge creation is handled by the RelationPanel, not here
      // This is a no-op to prevent default behavior
    },
    []
  )

  // Handle selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length === 1) {
        const semanticId = getSemanticNodeIdFromRFNode(selectedNodes[0])
        onSelectNode(semanticId)
      } else if (selectedNodes.length === 0) {
        onSelectNode(undefined)
      }
      // Multi-selection: keep current selection
    },
    [onSelectNode]
  )

  // Sync selectedNodeId prop to React Flow selection
  useEffect(() => {
    if (!selectedNodeId) {
      // Clear selection in RF - handled by React Flow internally
      return
    }

    // React Flow handles selection state internally via the `selected` prop on nodes
    // We update the nodes to reflect the selection
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId
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
        onSelectionChange={handleSelectionChange}
        defaultEdgeOptions={defaultEdgeOptions}
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
        <Background color={theme === 'dark' ? '#334155' : '#cbd5e1'} gap={20} />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-left"
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
