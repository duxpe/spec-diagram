import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PatternSelectionDialog } from '@/components/dialogs/PatternSelectionDialog'
import { WorkspaceListPanel } from '@/components/panels/WorkspaceListPanel'
import { WorkspaceImportPanel } from '@/components/panels/WorkspaceImportPanel'
import { ArchitecturePattern } from '@/domain/models/workspace'
import { useWorkspaceStore } from '@/state/workspace-store'

export function WorkspacePage(): JSX.Element {
  const navigate = useNavigate()
  const { projectId: workspaceId } = useParams<{ projectId: string }>()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace)
  const importWorkspace = useWorkspaceStore((state) => state.importWorkspace)
  const error = useWorkspaceStore((state) => state.error)

  const [isPatternDialogOpen, setPatternDialogOpen] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    void openWorkspace(workspaceId)
  }, [workspaceId, openWorkspace])

  useEffect(() => {
    if (!workspaceId || !currentWorkspace || currentWorkspace.id !== workspaceId) return
    navigate(`/project/${currentWorkspace.id}/board/${currentWorkspace.rootBoardId}`, {
      replace: true
    })
  }, [workspaceId, currentWorkspace, navigate])

  const goToWorkspaceRoot = (nextWorkspaceId: string, rootBoardId: string): void => {
    navigate(`/project/${nextWorkspaceId}/board/${rootBoardId}`)
  }

  const handleCreateWorkspace = async (
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern
  ): Promise<void> => {
    const workspace = await createWorkspace(name, description, pattern)
    setPatternDialogOpen(false)
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
        <h1>SysDs-SG</h1>
        <p>Project setup, local persistence and board navigation</p>
      </header>

      <div className="workspace-toolbar">
        <button
          type="button"
          className="btn--primary"
          onClick={() => setPatternDialogOpen(true)}
        >
          New project
        </button>
      </div>

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

      <PatternSelectionDialog
        open={isPatternDialogOpen}
        onClose={() => setPatternDialogOpen(false)}
        onCreate={(name, description, pattern) => {
          void handleCreateWorkspace(name, description, pattern)
        }}
      />
    </div>
  )
}
