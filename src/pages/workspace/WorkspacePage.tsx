import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
import { PatternSelectionDialog } from '@/components/dialogs/PatternSelectionDialog'
import { WorkspaceListPanel } from '@/components/panels/WorkspaceListPanel'
import { WorkspaceImportPanel } from '@/components/panels/WorkspaceImportPanel'
import { ArchitecturePattern, Workspace } from '@/domain/models/workspace'
import { useWorkspaceStore } from '@/state/workspace-store'

export function WorkspacePage(): JSX.Element {
  const navigate = useNavigate()
  const { projectId: workspaceId } = useParams<{ projectId: string }>()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace)
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace)
  const importWorkspace = useWorkspaceStore((state) => state.importWorkspace)
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace)
  const error = useWorkspaceStore((state) => state.error)

  const [searchTerm, setSearchTerm] = useState('')

  const [isPatternDialogOpen, setPatternDialogOpen] = useState(false)
  const [workspaceBeingEdited, setWorkspaceBeingEdited] = useState<Workspace | null>(null)
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
    pattern: ArchitecturePattern,
    brief?: Workspace['brief']
  ): Promise<void> => {
    const workspace = await createWorkspace(name, description, pattern, brief)
    setPatternDialogOpen(false)
    goToWorkspaceRoot(workspace.id, workspace.rootBoardId)
  }

  const handleUpdateWorkspace = async (
    workspaceIdToUpdate: string,
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern,
    brief?: Workspace['brief']
  ): Promise<void> => {
    await updateWorkspace(workspaceIdToUpdate, {
      name,
      description,
      architecturePattern: pattern,
      brief
    })
    setWorkspaceBeingEdited(null)
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredWorkspaces = normalizedSearchTerm
    ? workspaces.filter((workspace) => {
        const searchable = [workspace.name, workspace.description, workspace.brief?.goal, workspace.brief?.context]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchable.includes(normalizedSearchTerm)
      })
    : workspaces

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value)
  }

  return (
    <div className="projects-screen">
      <div className="projects-screen__content">
        <section className="projects-hero">
          <div className="projects-hero__copy">
            <p className="projects-hero__eyebrow">System Designer Specs Generator Tool</p>
            <h1>SysDs-SG</h1>
            <p>
              Design systems visually, specify only what you need, and export structured
              prompts to generate specs in any LLM you want.
            </p>
          </div>
          <div className="projects-hero__actions">
              <label className="projects-hero__search">
                <span className="projects-hero__search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  type="search"
                  placeholder="Search projects"
                  aria-label="Search projects"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
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
            workspaces={filteredWorkspaces}
            currentWorkspaceId={currentWorkspace?.id}
            onOpenWorkspace={(workspaceIdToOpen) => {
              void handleOpenWorkspace(workspaceIdToOpen)
            }}
            onEditWorkspace={(workspace) => {
              setWorkspaceBeingEdited(workspace)
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
        onSubmit={(name, description, pattern, brief) => {
          void handleCreateWorkspace(name, description, pattern, brief)
        }}
      />
      <PatternSelectionDialog
        open={Boolean(workspaceBeingEdited)}
        mode="edit"
        initialWorkspace={workspaceBeingEdited ?? undefined}
        onClose={() => setWorkspaceBeingEdited(null)}
        onSubmit={(name, description, pattern, brief) => {
          if (!workspaceBeingEdited) return
          void handleUpdateWorkspace(workspaceBeingEdited.id, name, description, pattern, brief)
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
