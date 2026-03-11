import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RFCanvas, type ZoomControls } from '@/board/reactflow/RFCanvas'
import { ExportDialog } from '@/components/dialogs/ExportDialog'
import { ImportDialog } from '@/components/dialogs/ImportDialog'
import { FloatingHeader, FloatingToolbar, FloatingInspector } from '@/components/hud'
import { NodeActionMenu } from '@/components/hud/NodeActionMenu'
import { NodeInspector } from '@/components/inspector/NodeInspector'
import { BoardLayout } from '@/components/layout/BoardLayout'
import { RelationPanel } from '@/components/panels/RelationPanel'
import { useBoardAutosave } from '@/features/autosave/useBoardAutosave'
import { ExportPromptType, PromptExportBundle } from '@/domain/models/export'
import { SemanticNodeType } from '@/domain/models/semantic-node'
import {
  buildPromptZipFileName,
  createPromptZipBlob
} from '@/domain/services/prompt-export-service'
import { useBoardStore } from '@/state/board-store'
import { useUiStore } from '@/state/ui-store'
import { useWorkspaceStore } from '@/state/workspace-store'

export function BoardPage(): JSX.Element {
  const navigate = useNavigate()
  const params = useParams<{ projectId: string; boardId: string }>()
  const workspaceId = params.projectId
  const boardId = params.boardId

  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace)
  const refreshCurrentWorkspace = useWorkspaceStore((state) => state.refreshCurrentWorkspace)
  const exportWorkspace = useWorkspaceStore((state) => state.exportWorkspace)
  const generateWorkspacePromptBundle = useWorkspaceStore(
    (state) => state.generateWorkspacePromptBundle
  )
  const importWorkspace = useWorkspaceStore((state) => state.importWorkspace)

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
  const saveCurrentBoard = useBoardStore((state) => state.saveCurrentBoard)
  const openOrCreateChildBoard = useBoardStore((state) => state.openOrCreateChildBoard)
  const boardError = useBoardStore((state) => state.error)
  const boardLoading = useBoardStore((state) => state.loading)

  const selectedNodeId = useUiStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useUiStore((state) => state.setSelectedNodeId)
  const isExportDialogOpen = useUiStore((state) => state.isExportDialogOpen)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const isImportDialogOpen = useUiStore((state) => state.isImportDialogOpen)
  const setImportDialogOpen = useUiStore((state) => state.setImportDialogOpen)
  const themeMode = useUiStore((state) => state.themeMode)
  const setThemeMode = useUiStore((state) => state.setThemeMode)
  const activeTheme = useUiStore((state) => state.resolveActiveTheme())

  const [exportJsonPayload, setExportJsonPayload] = useState('')
  const [isExportJsonLoading, setIsExportJsonLoading] = useState(false)
  const [promptBundle, setPromptBundle] = useState<PromptExportBundle>()
  const [isPromptExportLoading, setIsPromptExportLoading] = useState(false)
  const [nodeMenuPos, setNodeMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [pendingRelation, setPendingRelation] = useState<{
    sourceNodeId: string
    targetNodeId: string
  } | null>(null)
  const zoomControlsRef = useRef<ZoomControls | null>(null)

  useBoardAutosave()

  useEffect(() => {
    setSelectedNodeId(undefined)
    setNodeMenuPos(null)
  }, [workspaceId, boardId, setSelectedNodeId])

  useEffect(() => {
    return () => {
      void useBoardStore.getState().saveCurrentBoard()
    }
  }, [workspaceId, boardId])

  useEffect(() => {
    if (!workspaceId || !boardId) return

    void (async () => {
      await openWorkspace(workspaceId)
      await loadBoard(workspaceId, boardId)
    })()
  }, [workspaceId, boardId, openWorkspace, loadBoard])

  useEffect(() => {
    const handleSave = (event: KeyboardEvent): void => {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'
      if (!isSave) return

      event.preventDefault()
      void saveCurrentBoard()
    }

    window.addEventListener('keydown', handleSave)
    return () => window.removeEventListener('keydown', handleSave)
  }, [saveCurrentBoard])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  )

  if (!workspaceId || !boardId) {
    return <p className="error-text">Missing project or board in route.</p>
  }

  const handleCreateNode = (type: SemanticNodeType): void => {
    createNode(type)
  }

  const handleOpenDetail = async (nodeId: string): Promise<void> => {
    try {
      await saveCurrentBoard()
      const childBoard = await openOrCreateChildBoard(nodeId)
      await refreshCurrentWorkspace()
      navigate(`/project/${workspaceId}/board/${childBoard.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to open detail board')
    }
  }

  const handleOpenExport = (): void => {
    setExportJsonPayload('')
    setPromptBundle(undefined)
    setIsExportJsonLoading(false)
    setIsPromptExportLoading(false)
    setExportDialogOpen(true)
  }

  const handleRequestJsonExport = async (): Promise<void> => {
    if (isExportJsonLoading || exportJsonPayload) return

    setIsExportJsonLoading(true)
    try {
      const payload = await exportWorkspace(workspaceId)
      setExportJsonPayload(payload)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to export workspace')
    } finally {
      setIsExportJsonLoading(false)
    }
  }

  const handleGeneratePromptBundle = async (exportType: ExportPromptType): Promise<void> => {
    setIsPromptExportLoading(true)
    try {
      const bundle = await generateWorkspacePromptBundle(workspaceId, exportType)
      setPromptBundle(bundle)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to generate prompt export')
    } finally {
      setIsPromptExportLoading(false)
    }
  }

  const handleDownloadPromptZip = async (): Promise<void> => {
    if (!promptBundle) return

    try {
      const blob = await createPromptZipBlob(promptBundle)
      const fileName = buildPromptZipFileName(promptBundle)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to download prompt ZIP')
    }
  }

  const handleImportWorkspace = async (jsonInput: string): Promise<void> => {
    try {
      const importedWorkspace = await importWorkspace(jsonInput)
      setImportDialogOpen(false)
      navigate(`/project/${importedWorkspace.id}/board/${importedWorkspace.rootBoardId}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to import workspace')
    }
  }

  const handleBackToParent = async (): Promise<void> => {
    if (!currentBoard?.parentBoardId) return
    await saveCurrentBoard()
    navigate(`/project/${workspaceId}/board/${currentBoard.parentBoardId}`)
  }

  const handleDeleteSelectedNode = (): void => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
      setSelectedNodeId(undefined)
      setNodeMenuPos(null)
    }
  }

  const handleNodeClick = (nodeId: string, screenX: number, screenY: number): void => {
    setSelectedNodeId(nodeId)
    setNodeMenuPos({ x: screenX, y: screenY })
  }

  const handleCloseNodeMenu = (): void => {
    setNodeMenuPos(null)
  }

  return (
    <>
      <BoardLayout>
        {boardLoading ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-glass)',
            zIndex: 50
          }}>
            <p style={{ color: 'var(--muted)' }}>Loading board...</p>
          </div>
        ) : null}

        <RFCanvas
          key={`${workspaceId}:${boardId}`}
          persistenceKey={`ws-${workspaceId}-board-${boardId}`}
          workspaceId={workspaceId}
          boardId={boardId}
          level={currentBoard?.level ?? 'N1'}
          nodes={nodes}
          relations={relations}
          selectedNodeId={selectedNodeId}
          onSelectNode={(nodeId) => {
            setSelectedNodeId(nodeId)
            if (!nodeId) setNodeMenuPos(null)
          }}
          onCanvasChange={(sourceBoardId, nextNodes, nextRelations) =>
            applyCanvasState(sourceBoardId, nextNodes, nextRelations)
          }
          theme={activeTheme}
          onCanvasReady={(ctrl) => { zoomControlsRef.current = ctrl }}
          onNodeClick={handleNodeClick}
          onPendingConnect={(sourceNodeId, targetNodeId) =>
            setPendingRelation({ sourceNodeId, targetNodeId })
          }
        />

        {boardError ? (
          <p className="error-text" style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'var(--surface-strong)',
            borderRadius: 8,
            zIndex: 100
          }}>
            {boardError}
          </p>
        ) : null}
      </BoardLayout>

      {/* Floating HUD Components */}
      <FloatingHeader
        workspaceName={currentWorkspace?.name ?? 'Project'}
        boardName={currentBoard?.name ?? 'Loading...'}
        level={currentBoard?.level ?? 'N1'}
        parentBoardId={currentBoard?.parentBoardId}
        themeMode={themeMode}
        activeTheme={activeTheme}
        onBackToParent={() => void handleBackToParent()}
        onThemeModeChange={setThemeMode}
      />

      <FloatingToolbar
        level={currentBoard?.level ?? 'N1'}
        onCreateNode={handleCreateNode}
        onSave={() => void saveCurrentBoard()}
        onOpenExport={handleOpenExport}
        onOpenImport={() => setImportDialogOpen(true)}
        onZoomIn={() => zoomControlsRef.current?.zoomIn()}
        onZoomOut={() => zoomControlsRef.current?.zoomOut()}
        onFitView={() => zoomControlsRef.current?.fitView()}
      />

      {selectedNode ? (
        <FloatingInspector
          node={selectedNode}
          onClose={() => {
            setSelectedNodeId(undefined)
            setNodeMenuPos(null)
          }}
        >
          <NodeInspector
            node={selectedNode}
            parentContext={parentContext}
            onUpdateNode={updateNode}
            onOpenDetail={(nodeId) => void handleOpenDetail(nodeId)}
          />
        </FloatingInspector>
      ) : null}

      {/* Contextual Node Action Menu */}
      {selectedNodeId && nodeMenuPos ? (
        <NodeActionMenu
          position={nodeMenuPos}
          canOpenDetail={currentBoard?.level !== 'N3'}
          onEdit={handleCloseNodeMenu}
          onDuplicate={handleCloseNodeMenu}
          onOpenDetail={() => {
            handleCloseNodeMenu()
            void handleOpenDetail(selectedNodeId)
          }}
          onDelete={handleDeleteSelectedNode}
        />
      ) : null}

      {/* Relation type picker — opened when user drags edge between nodes */}
      {pendingRelation ? (
        <div className="dialog-backdrop" onClick={() => setPendingRelation(null)}>
          <div
            className="dialog-card"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-card__header">
              <h2>Create Relation</h2>
            </div>
            <RelationPanel
              level={currentBoard?.level ?? 'N1'}
              nodes={nodes}
              preselectedSourceId={pendingRelation.sourceNodeId}
              preselectedTargetId={pendingRelation.targetNodeId}
              onCreateRelation={(sourceNodeId, targetNodeId, type) => {
                createRelation(sourceNodeId, targetNodeId, type)
                setPendingRelation(null)
              }}
            />
            <div className="dialog-card__actions">
              <button type="button" onClick={() => setPendingRelation(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dialogs */}
      <ExportDialog
        open={isExportDialogOpen}
        jsonPayload={exportJsonPayload}
        jsonLoading={isExportJsonLoading}
        promptBundle={promptBundle}
        promptLoading={isPromptExportLoading}
        onRequestJson={() => void handleRequestJsonExport()}
        onGeneratePrompts={(type) => void handleGeneratePromptBundle(type)}
        onDownloadPromptZip={() => void handleDownloadPromptZip()}
        onClose={() => setExportDialogOpen(false)}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportWorkspace}
      />
    </>
  )
}
