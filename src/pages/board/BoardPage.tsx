import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RFCanvas } from '@/board/reactflow/RFCanvas'
import { ExportDialog } from '@/components/dialogs/ExportDialog'
import { ImportDialog } from '@/components/dialogs/ImportDialog'
import { NodeInspector } from '@/components/inspector/NodeInspector'
import { AppShell } from '@/components/layout/AppShell'
import { RelationPanel } from '@/components/panels/RelationPanel'
import { BoardToolbar } from '@/components/toolbar/BoardToolbar'
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
  const params = useParams<{ workspaceId: string; boardId: string }>()
  const workspaceId = params.workspaceId
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

  useBoardAutosave()

  useEffect(() => {
    setSelectedNodeId(undefined)
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
    return <p className="error-text">Missing workspace or board in route.</p>
  }

  const handleCreateNode = (type: SemanticNodeType): void => {
    createNode(type)
  }

  const handleOpenDetail = async (nodeId: string): Promise<void> => {
    try {
      await saveCurrentBoard()
      const childBoard = await openOrCreateChildBoard(nodeId)
      await refreshCurrentWorkspace()
      navigate(`/workspace/${workspaceId}/board/${childBoard.id}`)
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
      navigate(`/workspace/${importedWorkspace.id}/board/${importedWorkspace.rootBoardId}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to import workspace')
    }
  }

  const handleBackToParent = async (): Promise<void> => {
    if (!currentBoard?.parentBoardId) return
    await saveCurrentBoard()
    navigate(`/workspace/${workspaceId}/board/${currentBoard.parentBoardId}`)
  }

  return (
    <>
      <AppShell
        header={
          <div className="board-header">
            <div>
              <h1>{currentWorkspace?.name ?? 'Workspace'}</h1>
              <p>
                Board: {currentBoard?.name ?? 'Loading...'} ({currentBoard?.level ?? '...'})
              </p>
              {parentContext ? (
                <>
                  <p>
                    Parent ({parentContext.immediate.level}): {parentContext.immediate.boardName} /{' '}
                    {parentContext.immediate.nodeTitle}
                  </p>
                  {parentContext.ancestor ? (
                    <p>
                      Ancestor ({parentContext.ancestor.level}): {parentContext.ancestor.boardName} /{' '}
                      {parentContext.ancestor.nodeTitle}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="board-header__actions">
              <Link to="/workspaces">Workspaces</Link>
              <label className="theme-toggle" htmlFor="theme-mode">
                Theme
              </label>
              <select
                id="theme-mode"
                className="theme-toggle__select"
                value={themeMode}
                onChange={(event) =>
                  setThemeMode(event.target.value as 'system' | 'light' | 'dark')
                }
                aria-label="Theme mode"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <span className="theme-toggle__status">Active: {activeTheme}</span>
              {currentBoard?.parentBoardId ? (
                <button type="button" onClick={() => void handleBackToParent()}>
                  Back to parent
                </button>
              ) : null}
            </div>
          </div>
        }
        sidebar={
          <div className="stack">
            <BoardToolbar
              level={currentBoard?.level ?? 'N1'}
              onCreateNode={handleCreateNode}
              onSave={() => {
                void saveCurrentBoard()
              }}
              onOpenExport={() => {
                handleOpenExport()
              }}
              onOpenImport={() => {
                setImportDialogOpen(true)
              }}
            />
            <RelationPanel
              level={currentBoard?.level ?? 'N1'}
              nodes={nodes}
              onCreateRelation={(sourceNodeId, targetNodeId, type) => {
                createRelation(sourceNodeId, targetNodeId, type)
              }}
            />
          </div>
        }
        inspector={
          <NodeInspector
            node={selectedNode}
            parentContext={parentContext}
            onUpdateNode={updateNode}
            onOpenDetail={(nodeId) => {
              void handleOpenDetail(nodeId)
            }}
          />
        }
      >
        {boardLoading ? <p>Loading board...</p> : null}

        <div className="board-stage">
          <RFCanvas
            key={`${workspaceId}:${boardId}`}
            persistenceKey={`ws-${workspaceId}-board-${boardId}`}
            workspaceId={workspaceId}
            boardId={boardId}
            level={currentBoard?.level ?? 'N1'}
            nodes={nodes}
            relations={relations}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onCanvasChange={(sourceBoardId, nextNodes, nextRelations) =>
              applyCanvasState(sourceBoardId, nextNodes, nextRelations)
            }
            theme={activeTheme}
          />
        </div>

        {boardError ? <p className="error-text">{boardError}</p> : null}
      </AppShell>

      <ExportDialog
        open={isExportDialogOpen}
        jsonPayload={exportJsonPayload}
        jsonLoading={isExportJsonLoading}
        promptBundle={promptBundle}
        promptLoading={isPromptExportLoading}
        onRequestJson={() => {
          void handleRequestJsonExport()
        }}
        onGeneratePrompts={(type) => {
          void handleGeneratePromptBundle(type)
        }}
        onDownloadPromptZip={() => {
          void handleDownloadPromptZip()
        }}
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
