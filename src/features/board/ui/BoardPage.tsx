import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { RelationType } from '@/domain/models/relation'
import type { ExportPromptType } from '@/domain/models/export'
import { PATTERN_CATALOG } from '@/domain/semantics/pattern-catalog'
import { useBoardAutosave } from '@/features/board/model/useBoardAutosave'
import { useBoardStore } from '@/features/board/model/board-store'
import { useUiStore } from '@/features/board/model/ui-store'
import { useProjectStore } from '@/features/project/model/project-store'
import { BoardCanvasLayer } from '@/features/board/ui/board-page/components/BoardCanvasLayer'
import { BoardDialogs } from '@/features/board/ui/board-page/components/BoardDialogs'
import { BoardHudLayer } from '@/features/board/ui/board-page/components/BoardHudLayer'
import { BoardTransientOverlays } from '@/features/board/ui/board-page/components/BoardTransientOverlays'
import { useBoardPageLifecycle } from '@/features/board/ui/board-page/hooks/useBoardPageLifecycle'
import { useKeyboardSave } from '@/features/board/ui/board-page/hooks/useKeyboardSave'
import { useNodeCreationFlow } from '@/features/board/ui/board-page/hooks/useNodeCreationFlow'
import { useTransferActions } from '@/features/board/ui/board-page/hooks/useTransferActions'
import type {
  ConnectionSuggestionState,
  PendingRelationState
} from '@/features/board/ui/board-page/types'
import type { ZoomControls } from '@/features/board/canvas/RFCanvas'

export function BoardPage(): JSX.Element {
  const navigate = useNavigate()
  const params = useParams<{ projectId: string; boardId: string }>()
  const projectId = params.projectId
  const boardId = params.boardId

  const currentProject = useProjectStore((state) => state.currentProject)
  const openProject = useProjectStore((state) => state.openProject)
  const refreshCurrentProject = useProjectStore((state) => state.refreshCurrentProject)
  const exportProject = useProjectStore((state) => state.exportProject)
  const generateProjectPromptBundle = useProjectStore((state) => state.generateProjectPromptBundle)
  const importProject = useProjectStore((state) => state.importProject)

  const loadBoard = useBoardStore((state) => state.loadBoard)
  const currentBoard = useBoardStore((state) => state.currentBoard)
  const parentContext = useBoardStore((state) => state.parentContext)
  const nodes = useBoardStore((state) => state.nodes)
  const relations = useBoardStore((state) => state.relations)
  const createNode = useBoardStore((state) => state.createNode)
  const updateNode = useBoardStore((state) => state.updateNode)
  const deleteNode = useBoardStore((state) => state.deleteNode)
  const applyCanvasState = useBoardStore((state) => state.applyCanvasState)
  const createRelation = useBoardStore((state) => state.createRelation)
  const updateRelation = useBoardStore((state) => state.updateRelation)
  const reverseRelation = useBoardStore((state) => state.reverseRelation)
  const deleteRelation = useBoardStore((state) => state.deleteRelation)
  const saveCurrentBoard = useBoardStore((state) => state.saveCurrentBoard)
  const openOrCreateChildBoard = useBoardStore((state) => state.openOrCreateChildBoard)
  const boardError = useBoardStore((state) => state.error)
  const boardLoading = useBoardStore((state) => state.loading)

  const selectedNodeId = useUiStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useUiStore((state) => state.setSelectedNodeId)
  const isInspectorOpen = useUiStore((state) => state.isInspectorOpen)
  const setInspectorOpen = useUiStore((state) => state.setInspectorOpen)
  const appearanceDialogNodeId = useUiStore((state) => state.appearanceDialogNodeId)
  const isExportDialogOpen = useUiStore((state) => state.isExportDialogOpen)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const isImportDialogOpen = useUiStore((state) => state.isImportDialogOpen)
  const setImportDialogOpen = useUiStore((state) => state.setImportDialogOpen)
  const themeMode = useUiStore((state) => state.themeMode)
  const setThemeMode = useUiStore((state) => state.setThemeMode)
  const activeTheme = useUiStore((state) => state.resolveActiveTheme())

  const [nodeMenuPos, setNodeMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [pendingRelation, setPendingRelation] = useState<PendingRelationState | null>(null)
  const [edgeMenuState, setEdgeMenuState] = useState<{ edgeId: string; x: number; y: number } | null>(null)
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null)
  const [connectionSuggestionState, setConnectionSuggestionState] = useState<ConnectionSuggestionState | null>(null)
  const [editingInternalsNodeId, setEditingInternalsNodeId] = useState<string | null>(null)
  const zoomControlsRef = useRef<ZoomControls | null>(null)

  useBoardAutosave()

  useBoardPageLifecycle({
    projectId,
    boardId,
    openProject,
    loadBoard,
    setSelectedNodeId,
    setInspectorOpen,
    setNodeMenuPos,
    setEditingInternalsNodeId
  })

  useKeyboardSave(saveCurrentBoard)

  const handleNodeSelect = useCallback(
    (nodeId?: string): void => {
      setSelectedNodeId(nodeId)
      setInspectorOpen(!!nodeId)
      setNodeMenuPos(null)
    },
    [setSelectedNodeId, setInspectorOpen, setNodeMenuPos]
  )

  const nodeCreation = useNodeCreationFlow({
    currentBoardId: currentBoard?.id,
    boardId: boardId ?? '',
    createNode,
    createRelation,
    onNodeSelect: handleNodeSelect,
    setConnectionSuggestionState
  })

  const transfer = useTransferActions({
    projectId: projectId ?? '',
    exportProject,
    generateProjectPromptBundle: (id, type: ExportPromptType) => generateProjectPromptBundle(id, type),
    importProject,
    onImportSuccess: (nextProjectId, rootBoardId) => {
      navigate(`/project/${nextProjectId}/board/${rootBoardId}`)
    },
    setImportDialogOpen,
    setExportDialogOpen
  })

  useEffect(() => {
    if (appearanceDialogNodeId) {
      setNodeMenuPos(null)
    }
  }, [appearanceDialogNodeId])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  )

  const editingInternalsNode = useMemo(
    () => nodes.find((node) => node.id === editingInternalsNodeId),
    [nodes, editingInternalsNodeId]
  )

  if (!projectId || !boardId) {
    return <p className="error-text">Missing project or board in route.</p>
  }

  const handleOpenDetail = async (nodeId: string): Promise<void> => {
    try {
      const saved = await saveCurrentBoard()
      if (!saved) return
      const childBoard = await openOrCreateChildBoard(nodeId)
      await refreshCurrentProject()
      navigate(`/project/${projectId}/board/${childBoard.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to open detail board')
    }
  }

  const handleBackToParent = async (): Promise<void> => {
    if (!currentBoard?.parentBoardId) return
    const saved = await saveCurrentBoard()
    if (!saved) return
    navigate(`/project/${projectId}/board/${currentBoard.parentBoardId}`)
  }

  return (
    <>
      <BoardCanvasLayer
        boardLoading={boardLoading}
        boardError={boardError}
        projectId={projectId}
        boardId={boardId}
        level={currentBoard?.level ?? 'N1'}
        activeTheme={activeTheme}
        nodes={nodes}
        relations={relations}
        selectedNodeId={selectedNodeId}
        onSelectNode={handleNodeSelect}
        onCanvasChange={applyCanvasState}
        onCanvasReady={(ctrl) => {
          zoomControlsRef.current = ctrl
        }}
        onNodeContextMenu={(nodeId, screenX, screenY) => {
          handleNodeSelect(nodeId)
          setNodeMenuPos({ x: screenX, y: screenY })
        }}
        onPendingConnect={(sourceNodeId, targetNodeId, sourceHandleId, targetHandleId) =>
          setPendingRelation({ sourceNodeId, targetNodeId, sourceHandleId, targetHandleId })
        }
        onEdgeContextMenu={(edgeId, screenX, screenY) => {
          setEdgeMenuState({ edgeId, x: screenX, y: screenY })
        }}
        onConnectionToEmpty={(sourceNodeId, screenX, screenY, canvasX, canvasY) =>
          setConnectionSuggestionState({ sourceNodeId, screenX, screenY, canvasX, canvasY })
        }
      />

      <BoardHudLayer
        projectName={currentProject?.name ?? 'Project'}
        boardName={currentBoard?.name ?? 'Loading...'}
        level={currentBoard?.level ?? 'N1'}
        parentBoardId={currentBoard?.parentBoardId}
        patternLabel={
          currentProject?.architecturePattern
            ? PATTERN_CATALOG[currentProject.architecturePattern]?.name
            : undefined
        }
        themeMode={themeMode}
        activeTheme={activeTheme}
        onBackToParent={() => void handleBackToParent()}
        onThemeModeChange={setThemeMode}
        architecturePattern={currentProject?.architecturePattern}
        onCreateNode={nodeCreation.handleCreateNode}
        onSave={() => void saveCurrentBoard()}
        onOpenExport={transfer.handleOpenExport}
        onOpenImport={() => setImportDialogOpen(true)}
        onZoomIn={() => zoomControlsRef.current?.zoomIn()}
        onZoomOut={() => zoomControlsRef.current?.zoomOut()}
        onFitView={() => zoomControlsRef.current?.fitView()}
        selectedNode={selectedNode}
        isInspectorOpen={isInspectorOpen}
        appearanceDialogNodeId={appearanceDialogNodeId}
        parentContext={parentContext}
        onCloseInspector={() => {
          handleNodeSelect(undefined)
          setNodeMenuPos(null)
        }}
        onUpdateNode={updateNode}
        onOpenDetail={(nodeId) => void handleOpenDetail(nodeId)}
        onEditInternals={(nodeId) => setEditingInternalsNodeId(nodeId)}
      />

      <BoardTransientOverlays
        selectedNodeId={selectedNodeId}
        selectedNode={selectedNode}
        nodeMenuPos={nodeMenuPos}
        appearanceDialogNodeId={appearanceDialogNodeId}
        onCloseNodeMenu={() => setNodeMenuPos(null)}
        onDeleteSelectedNode={() => {
          if (selectedNodeId) {
            deleteNode(selectedNodeId)
            handleNodeSelect(undefined)
          }
        }}
        onOpenSelectedDetail={() => {
          if (selectedNodeId) {
            void handleOpenDetail(selectedNodeId)
          }
        }}
        edgeMenuState={edgeMenuState}
        setEdgeMenuState={setEdgeMenuState}
        editingRelationId={editingRelationId}
        setEditingRelationId={setEditingRelationId}
        relations={relations}
        nodes={nodes}
        currentBoardLevel={currentBoard?.level ?? 'N1'}
        architecturePattern={currentProject?.architecturePattern}
        updateRelation={updateRelation}
        reverseRelation={reverseRelation}
        deleteRelation={deleteRelation}
        connectionSuggestionState={connectionSuggestionState}
        setConnectionSuggestionState={setConnectionSuggestionState}
        createNode={createNode}
        createRelation={createRelation}
        handleNodeSelect={handleNodeSelect}
        setPendingNodeCreation={nodeCreation.setPendingNodeCreation}
        pendingRelation={pendingRelation}
        setPendingRelation={setPendingRelation}
      />

      <BoardDialogs
        isExportDialogOpen={isExportDialogOpen}
        exportJsonPayload={transfer.exportJsonPayload}
        isExportJsonLoading={transfer.isExportJsonLoading}
        promptBundle={transfer.promptBundle}
        isPromptExportLoading={transfer.isPromptExportLoading}
        onRequestJsonExport={transfer.handleRequestJsonExport}
        onGeneratePromptBundle={transfer.handleGeneratePromptBundle}
        onDownloadPromptZip={transfer.handleDownloadPromptZip}
        setExportDialogOpen={setExportDialogOpen}
        isImportDialogOpen={isImportDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        onImportProject={transfer.handleImportProject}
        pendingNodeCreation={nodeCreation.pendingNodeCreation}
        setPendingNodeCreation={nodeCreation.setPendingNodeCreation}
        currentBoardLevel={currentBoard?.level}
        connectionSuggestionState={connectionSuggestionState}
        setConnectionSuggestionState={setConnectionSuggestionState}
        completeNodeCreation={nodeCreation.completeNodeCreation}
        editingInternalsNode={editingInternalsNode}
        setEditingInternalsNodeId={setEditingInternalsNodeId}
        onSaveInternals={(nodeId, dataPatch) => {
          updateNode(nodeId, { data: dataPatch })
        }}
      />
    </>
  )
}
