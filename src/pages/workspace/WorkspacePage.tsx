import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
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
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace)
  const error = useWorkspaceStore((state) => state.error)

  const [isPatternDialogOpen, setPatternDialogOpen] = useState(false)
  const [workspacePendingDeletion, setWorkspacePendingDeletion] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)

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

  const requestWorkspaceDeletion = (workspaceIdToRemove: string, workspaceName: string): void => {
    setWorkspacePendingDeletion({ id: workspaceIdToRemove, name: workspaceName })
  }

  const cancelWorkspaceDeletion = (): void => {
    if (isDeletingWorkspace) return
    setWorkspacePendingDeletion(null)
  }

  const confirmWorkspaceDeletion = async (): Promise<void> => {
    if (!workspacePendingDeletion) return

    setIsDeletingWorkspace(true)
    try {
      await deleteWorkspace(workspacePendingDeletion.id)
    } finally {
      setIsDeletingWorkspace(false)
      setWorkspacePendingDeletion(null)
    }
  }

  return (
    <div className="projects-screen">
      <div className="projects-screen__content">
        <section className="projects-hero">
          <div className="projects-hero__copy">
            <p className="projects-hero__eyebrow">System Design S.Architecture Planning</p>
            <h1>SysDs-SG</h1>
            <p>
              Design systems visually, break them into technical layers, and export structured
              prompts for specs and implementation tasks.
            </p>
          </div>
          <div className="projects-hero__actions">
            <label className="projects-hero__search">
              <span className="projects-hero__search-icon" aria-hidden="true">
                ⌕
              </span>
              <input type="search" placeholder="Search projects" aria-label="Search projects" />
            </label>
            <button
              type="button"
              className="btn--primary projects-hero__action"
              onClick={() => setPatternDialogOpen(true)}
              data-ui-log="Workspace page – New project"
            >
              <span aria-hidden="true">+</span>
              New project
            </button>
          </div>
        </section>

        <section className="projects-gallery">
          <div className="projects-gallery__heading">
            <div>
              <h2>Projects</h2>
              <p>Select or manage projects</p>
            </div>
          </div>

          <WorkspaceListPanel
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspace?.id}
            onOpenWorkspace={(workspaceIdToOpen) => {
              void handleOpenWorkspace(workspaceIdToOpen)
            }}
            onRemoveWorkspace={(workspaceIdToRemove, workspaceName) => {
              requestWorkspaceDeletion(workspaceIdToRemove, workspaceName)
            }}
          />

          <div className="projects-gallery__actions">
            <WorkspaceImportPanel
              onImport={async (jsonInput) => {
                await handleImportWorkspace(jsonInput)
              }}
            />
            <span className="projects-gallery__import-note">Import from file (JSON)</span>
          </div>
        </section>

        {error ? <div className="projects-error">{error}</div> : null}
      </div>

      <PatternSelectionDialog
        open={isPatternDialogOpen}
        onClose={() => setPatternDialogOpen(false)}
        onCreate={(name, description, pattern) => {
          void handleCreateWorkspace(name, description, pattern)
        }}
      />
      <ConfirmationDialog
        open={Boolean(workspacePendingDeletion)}
        title={
          workspacePendingDeletion
            ? `Delete project "${workspacePendingDeletion.name}"`
            : 'Delete project'
        }
        description="Deleting this workspace will remove all its boards and cannot be undone."
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        isConfirming={isDeletingWorkspace}
        onClose={cancelWorkspaceDeletion}
        onConfirm={() => {
          void confirmWorkspaceDeletion()
        }}
      />
    </div>
  )
}
