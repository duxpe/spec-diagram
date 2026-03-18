import { BoardLayout } from '@/features/board/ui/components/layout/BoardLayout'
import { RFCanvas, type ZoomControls } from '@/features/board/canvas/RFCanvas'
import type { ActiveTheme } from '@/domain/models/node-appearance'
import type { Relation } from '@/domain/models/relation'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { SemanticLevel } from '@/domain/models/board'

interface BoardCanvasLayerProps {
  boardLoading: boolean
  boardError?: string
  projectId: string
  boardId: string
  level: SemanticLevel
  activeTheme: ActiveTheme
  nodes: SemanticNode[]
  relations: Relation[]
  selectedNodeId?: string
  onSelectNode: (nodeId?: string) => void
  onCanvasChange: (sourceBoardId: string, nextNodes: SemanticNode[], nextRelations: Relation[]) => boolean
  onCanvasReady: (controls: ZoomControls) => void
  onNodeContextMenu: (nodeId: string, screenX: number, screenY: number) => void
  onPendingConnect: (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ) => void
  onEdgeContextMenu: (edgeId: string, screenX: number, screenY: number) => void
  onConnectionToEmpty: (
    sourceNodeId: string,
    screenX: number,
    screenY: number,
    canvasX: number,
    canvasY: number
  ) => void
}

export function BoardCanvasLayer({
  boardLoading,
  boardError,
  projectId,
  boardId,
  level,
  activeTheme,
  nodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onCanvasChange,
  onCanvasReady,
  onNodeContextMenu,
  onPendingConnect,
  onEdgeContextMenu,
  onConnectionToEmpty
}: BoardCanvasLayerProps): JSX.Element {
  return (
    <BoardLayout>
      {boardLoading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-glass)',
            zIndex: 50
          }}
        >
          <p style={{ color: 'var(--muted)' }}>Loading board...</p>
        </div>
      ) : null}

      <RFCanvas
        key={`${projectId}:${boardId}`}
        persistenceKey={`ws-${projectId}-board-${boardId}`}
        projectId={projectId}
        boardId={boardId}
        level={level}
        nodes={nodes}
        relations={relations}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        onCanvasChange={onCanvasChange}
        theme={activeTheme}
        onCanvasReady={onCanvasReady}
        onNodeContextMenu={onNodeContextMenu}
        onPendingConnect={onPendingConnect}
        onEdgeContextMenu={onEdgeContextMenu}
        onConnectionToEmpty={onConnectionToEmpty}
      />

      {boardError ? (
        <p
          className="error-text"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'var(--surface-strong)',
            borderRadius: 8,
            zIndex: 100
          }}
        >
          {boardError}
        </p>
      ) : null}
    </BoardLayout>
  )
}
