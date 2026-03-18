import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
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
    pattern: ArchitecturePattern | undefined,
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
    brief?: Project['brief']
  ): Promise<void> => {
    await updateProject(projectIdToUpdate, {
      name,
      description,
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
      {/* ---- Top nav ---- */}
      <header className="projects-nav">
        <Link to="/" className="projects-nav__logo">
          SpecDiagram
        </Link>
        <div className="projects-nav__actions">
          <ProjectImportPanel
            onImport={async (jsonInput) => {
              await handleImportProject(jsonInput)
            }}
          />
          <button
            type="button"
            className="btn--primary"
            onClick={() => setPatternDialogOpen(true)}
            data-ui-log="Project page – New project"
          >
            <Plus size={16} />
            New project
          </button>
        </div>
      </header>

      {/* ---- Page content ---- */}
      <main className="projects-main">
        {/* ---- Toolbar ---- */}
        <div className="projects-toolbar">
          <div className="projects-toolbar__heading">
            <h1>Projects</h1>
            {projects.length > 0 ? (
              <span className="projects-toolbar__count">{projects.length}</span>
            ) : null}
          </div>
          <div className="projects-toolbar__search">
            <input
              type="search"
              placeholder="Search projects..."
              aria-label="Search projects"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* ---- Project grid ---- */}
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

        {error ? <div className="projects-error">{error}</div> : null}
      </main>

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
        onSubmit={(name, description, _pattern, brief) => {
          if (!projectBeingEdited) return
          void handleUpdateProject(projectBeingEdited.id, name, description, brief)
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
