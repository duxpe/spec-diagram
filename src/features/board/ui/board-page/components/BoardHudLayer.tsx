import { FloatingHeader, FloatingInspector, FloatingToolbar } from '@/features/board/ui/components/hud'
import type { CreateNodeRequest } from '@/features/board/ui/components/hud/FloatingToolbar'
import { NodeInspector } from '@/features/board/ui/components/inspector/NodeInspector'
import type { ThemeMode, ActiveTheme } from '@/domain/models/node-appearance'
import type { SemanticNode } from '@/domain/models/semantic-node'
import type { SemanticLevel } from '@/domain/models/board'
import type { ArchitecturePattern } from '@/domain/models/project'
import type { InspectorParentContext } from '@/features/board/ui/components/inspector/node-inspector/types'

interface BoardHudLayerProps {
  projectName: string
  boardName: string
  level: SemanticLevel
  parentBoardId?: string
  patternLabel?: string
  themeMode: ThemeMode
  activeTheme: ActiveTheme
  onBackToParent: () => void
  onThemeModeChange: (mode: ThemeMode) => void
  architecturePattern?: ArchitecturePattern
  onCreateNode: (request: CreateNodeRequest) => void
  onSave: () => void
  onOpenExport: () => void
  onOpenImport: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  selectedNode?: SemanticNode
  isInspectorOpen: boolean
  appearanceDialogNodeId?: string
  parentContext?: InspectorParentContext
  onCloseInspector: () => void
  onUpdateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'projectId' | 'boardId'>>) => void
  onOpenDetail: (nodeId: string) => void
  onEditInternals: (nodeId: string) => void
}

export function BoardHudLayer({
  projectName,
  boardName,
  level,
  parentBoardId,
  patternLabel,
  themeMode,
  activeTheme,
  onBackToParent,
  onThemeModeChange,
  architecturePattern,
  onCreateNode,
  onSave,
  onOpenExport,
  onOpenImport,
  onZoomIn,
  onZoomOut,
  onFitView,
  selectedNode,
  isInspectorOpen,
  appearanceDialogNodeId,
  parentContext,
  onCloseInspector,
  onUpdateNode,
  onOpenDetail,
  onEditInternals
}: BoardHudLayerProps): JSX.Element {
  return (
    <>
      <FloatingHeader
        projectName={projectName}
        boardName={boardName}
        level={level}
        parentBoardId={parentBoardId}
        patternLabel={patternLabel}
        themeMode={themeMode}
        activeTheme={activeTheme}
        onBackToParent={onBackToParent}
        onThemeModeChange={onThemeModeChange}
      />

      <FloatingToolbar
        level={level}
        architecturePattern={architecturePattern}
        onCreateNode={onCreateNode}
        onSave={onSave}
        onOpenExport={onOpenExport}
        onOpenImport={onOpenImport}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitView={onFitView}
      />

      {selectedNode && isInspectorOpen ? (
        <FloatingInspector node={selectedNode} hidden={!!appearanceDialogNodeId} onClose={onCloseInspector}>
          <NodeInspector
            node={selectedNode}
            parentContext={parentContext}
            onUpdateNode={onUpdateNode}
            onOpenDetail={onOpenDetail}
            onEditInternals={onEditInternals}
          />
        </FloatingInspector>
      ) : null}
    </>
  )
}
