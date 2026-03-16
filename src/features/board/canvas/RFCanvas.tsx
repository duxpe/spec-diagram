import { useEffect, useRef } from 'react'
import {
  Background,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { SemanticLevel } from '@/domain/models/board'
import type { ActiveTheme } from '@/domain/models/node-appearance'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { useCanvasInteractionHandlers } from '@/features/board/canvas/hooks/useCanvasInteractionHandlers'
import { useRFDomainSync } from '@/features/board/canvas/hooks/useRFDomainSync'
import type { RFNodeData } from '@/features/board/canvas/reactflow-adapter'
import { RelationEdge } from './edges/RelationEdge'
import { SemanticNode as SemanticNodeComponent } from './nodes/SemanticNode'
import { CanvasControls } from './components/CanvasControls'
import './styles/reactflow.css'

export interface ZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
}

interface RFCanvasProps {
  persistenceKey: string
  projectId: string
  boardId: string
  level: SemanticLevel
  theme: ActiveTheme
  nodes: SemanticNode[]
  relations: Relation[]
  selectedNodeId?: string
  onSelectNode: (nodeId?: string) => void
  onCanvasChange: (boardId: string, nodes: SemanticNode[], relations: Relation[]) => boolean | void
  onCanvasReady?: (controls: ZoomControls) => void
  onNodeContextMenu?: (nodeId: string, screenX: number, screenY: number) => void
  onPendingConnect?: (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  onEdgeContextMenu?: (edgeId: string, screenX: number, screenY: number) => void
  onConnectionToEmpty?: (
    sourceNodeId: string,
    screenX: number,
    screenY: number,
    canvasX: number,
    canvasY: number
  ) => void
}

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

export function RFCanvas({
  projectId,
  boardId,
  level,
  theme,
  nodes: semanticNodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onCanvasChange,
  onCanvasReady,
  onNodeContextMenu,
  onPendingConnect,
  onEdgeContextMenu,
  onConnectionToEmpty
}: RFCanvasProps): JSX.Element {
  const { nodes, edges, setNodes, handleNodesChange, handleEdgesChange } = useRFDomainSync({
    projectId,
    boardId,
    level,
    semanticNodes,
    relations,
    onCanvasChange,
    onNodeContextMenu
  })

  const reactFlowInstanceRef = useRef<ReactFlowInstance<Node, Edge> | null>(null)

  const {
    handleConnect,
    handleSelectionChange,
    handlePaneClick,
    handleEdgeContextMenu,
    handleConnectStart,
    handleConnectEnd
  } = useCanvasInteractionHandlers({
    onPendingConnect,
    onSelectNode,
    onEdgeContextMenu,
    onConnectionToEmpty,
    reactFlowInstanceRef
  })

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
        <Background color={theme === 'dark' ? '#334155' : '#d1d5db'} gap={24} size={1.5} />
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
