import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/shared/ui/dialogs/ConfirmationDialog'
import { PatternSelectionDialog } from '@/features/project/ui/components/PatternSelectionDialog'
import { ProjectListPanel } from '@/features/project/ui/components/ProjectListPanel'
import { ProjectImportPanel } from '@/features/transfer/ui/ProjectImportPanel'
import { ArchitecturePattern, Project } from '@/domain/models/project'
import { useProjectStore } from '@/features/project/model/project-store'

export function ProjectsPage(): JSX.Element {
  const navigate = useNavigate()
  const { projectId: projectId } = useParams<{ projectId: string }>()

  const projects = useProjectStore((state) => state.projects)
  const currentProject = useProjectStore((state) => state.currentProject)
  const createProject = useProjectStore((state) => state.createProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const openProject = useProjectStore((state) => state.openProject)
  const importProject = useProjectStore((state) => state.importProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const error = useProjectStore((state) => state.error)

  const [searchTerm, setSearchTerm] = useState('')

  const [isPatternDialogOpen, setPatternDialogOpen] = useState(false)
  const [projectBeingEdited, setProjectBeingEdited] = useState<Project | null>(null)
  const [projectPendingDeletion, setProjectPendingDeletion] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  useEffect(() => {
    if (!projectId) return
    void openProject(projectId)
  }, [projectId, openProject])

  useEffect(() => {
    if (!projectId || !currentProject || currentProject.id !== projectId) return
    navigate(`/project/${currentProject.id}/board/${currentProject.rootBoardId}`, {
      replace: true
    })
  }, [projectId, currentProject, navigate])

  const goToProjectRoot = (nextProjectId: string, rootBoardId: string): void => {
    navigate(`/project/${nextProjectId}/board/${rootBoardId}`)
  }

  const handleCreateProject = async (
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern,
    brief?: Project['brief']
  ): Promise<void> => {
    const project = await createProject(name, description, pattern, brief)
    setPatternDialogOpen(false)
    goToProjectRoot(project.id, project.rootBoardId)
  }

  const handleUpdateProject = async (
    projectIdToUpdate: string,
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern,
    brief?: Project['brief']
  ): Promise<void> => {
    await updateProject(projectIdToUpdate, {
      name,
      description,
      architecturePattern: pattern,
      brief
    })
    setProjectBeingEdited(null)
  }

  const handleOpenProject = async (projectIdToOpen: string): Promise<void> => {
    await openProject(projectIdToOpen)
    const selectedProject = useProjectStore
      .getState()
      .projects.find((project) => project.id === projectIdToOpen)

    if (selectedProject) {
      goToProjectRoot(selectedProject.id, selectedProject.rootBoardId)
    }
  }

  const handleImportProject = async (jsonInput: string): Promise<void> => {
    try {
      const importedProject = await importProject(jsonInput)
      goToProjectRoot(importedProject.id, importedProject.rootBoardId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to import project')
    }
  }

  const requestProjectDeletion = (projectIdToRemove: string, projectName: string): void => {
    setProjectPendingDeletion({ id: projectIdToRemove, name: projectName })
  }

  const cancelProjectDeletion = (): void => {
    if (isDeletingProject) return
    setProjectPendingDeletion(null)
  }

  const confirmProjectDeletion = async (): Promise<void> => {
    if (!projectPendingDeletion) return

    setIsDeletingProject(true)
    try {
      await deleteProject(projectPendingDeletion.id)
    } finally {
      setIsDeletingProject(false)
      setProjectPendingDeletion(null)
    }
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredProjects = normalizedSearchTerm
    ? projects.filter((project) => {
        const searchable = [project.name, project.description, project.brief?.goal, project.brief?.context]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchable.includes(normalizedSearchTerm)
      })
    : projects

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
              data-ui-log="Project page – New project"
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

          <ProjectListPanel
            projects={filteredProjects}
            currentProjectId={currentProject?.id}
            onOpenProject={(projectIdToOpen) => {
              void handleOpenProject(projectIdToOpen)
            }}
            onEditProject={(project) => {
              setProjectBeingEdited(project)
            }}
            onRemoveProject={(projectIdToRemove, projectName) => {
              requestProjectDeletion(projectIdToRemove, projectName)
            }}
          />

          <div className="projects-gallery__actions">
            <ProjectImportPanel
              onImport={async (jsonInput) => {
                await handleImportProject(jsonInput)
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
          void handleCreateProject(name, description, pattern, brief)
        }}
      />
      <PatternSelectionDialog
        open={Boolean(projectBeingEdited)}
        mode="edit"
        initialProject={projectBeingEdited ?? undefined}
        onClose={() => setProjectBeingEdited(null)}
        onSubmit={(name, description, pattern, brief) => {
          if (!projectBeingEdited) return
          void handleUpdateProject(projectBeingEdited.id, name, description, pattern, brief)
        }}
      />
      <ConfirmationDialog
        open={Boolean(projectPendingDeletion)}
        title={
          projectPendingDeletion
            ? `Delete project "${projectPendingDeletion.name}"`
            : 'Delete project'
        }
        description="Deleting this project will remove all its boards and cannot be undone."
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        isConfirming={isDeletingProject}
        onClose={cancelProjectDeletion}
        onConfirm={() => {
          void confirmProjectDeletion()
        }}
      />
    </div>
  )
}
