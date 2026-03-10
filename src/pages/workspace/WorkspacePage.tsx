import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkspaceListPanel } from '@/components/panels/WorkspaceListPanel'
import { WorkspaceImportPanel } from '@/components/panels/WorkspaceImportPanel'
import { WorkspaceToolbar } from '@/components/toolbar/WorkspaceToolbar'
import { useWorkspaceStore } from '@/state/workspace-store'

export function WorkspacePage(): JSX.Element {
  const navigate = useNavigate()
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace)
  const importWorkspace = useWorkspaceStore((state) => state.importWorkspace)
  const error = useWorkspaceStore((state) => state.error)

  useEffect(() => {
    if (!workspaceId) return
    void openWorkspace(workspaceId)
  }, [workspaceId, openWorkspace])

  useEffect(() => {
    if (!workspaceId || !currentWorkspace || currentWorkspace.id !== workspaceId) return
    navigate(`/workspace/${currentWorkspace.id}/board/${currentWorkspace.rootBoardId}`, {
      replace: true
    })
  }, [workspaceId, currentWorkspace, navigate])

  const goToWorkspaceRoot = (nextWorkspaceId: string, rootBoardId: string): void => {
    navigate(`/workspace/${nextWorkspaceId}/board/${rootBoardId}`)
  }

  const handleCreateWorkspace = async (name: string, description?: string): Promise<void> => {
    const workspace = await createWorkspace(name, description)
    goToWorkspaceRoot(workspace.id, workspace.rootBoardId)
  }

  const handleOpenWorkspace = async (workspaceIdToOpen: string): Promise<void> => {
    await openWorkspace(workspaceIdToOpen)
    const selectedWorkspace = useWorkspaceStore
      .getState()
      .workspaces.find((workspace) => workspace.id === workspaceIdToOpen)

    if (selectedWorkspace) {
      goToWorkspaceRoot(selectedWorkspace.id, selectedWorkspace.rootBoardId)
    }
  }

  const handleImportWorkspace = async (jsonInput: string): Promise<void> => {
    try {
      const importedWorkspace = await importWorkspace(jsonInput)
      goToWorkspaceRoot(importedWorkspace.id, importedWorkspace.rootBoardId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to import workspace')
    }
  }

  return (
    <div className="workspace-page">
      <header className="workspace-page__header">
        <h1>System Designer Specs Generator</h1>
        <p>Workspace setup, local persistence and board navigation</p>
      </header>

      <WorkspaceToolbar onCreateWorkspace={handleCreateWorkspace} />

      <section className="workspace-page__content">
        <WorkspaceListPanel
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace?.id}
          onOpenWorkspace={(workspaceIdToOpen) => {
            void handleOpenWorkspace(workspaceIdToOpen)
          }}
        />
        <WorkspaceImportPanel
          onImport={async (jsonInput) => {
            await handleImportWorkspace(jsonInput)
          }}
        />
      </section>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}
