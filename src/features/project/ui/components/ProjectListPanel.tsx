import { KeyboardEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { ArchitecturePattern, Project } from '@/domain/models/project'

interface ProjectListPanelProps {
  projects: Project[]
  currentProjectId?: string
  onOpenProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onRemoveProject: (projectId: string, projectName: string) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const PATTERN_LABELS: Record<ArchitecturePattern, string> = {
  hexagonal: 'Hexagonal',
  layered_n_tier: 'Layered N-Tier',
  microservices: 'Microservices',
  microkernel: 'Microkernel',
  mvc: 'MVC',
  space_based: 'Space-Based',
  client_server: 'Client-Server',
  master_slave: 'Master-Slave'
}

const formatUpdatedAt = (value: string): string => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return 'Unknown date'
  return dateFormatter.format(parsed)
}

const getPatternLabel = (pattern?: ArchitecturePattern): string => {
  if (!pattern) return 'Custom system'
  return PATTERN_LABELS[pattern] ?? 'Custom system'
}

const getProjectSummary = (project: Project): string =>
  project.brief?.goal ?? project.description ?? 'No project framing provided yet.'

export function ProjectListPanel({
  projects,
  currentProjectId,
  onOpenProject,
  onEditProject,
  onRemoveProject
}: ProjectListPanelProps): JSX.Element {
  if (projects.length === 0) {
    return (
      <div className="projects-gallery__empty">
        <p>No projects yet. Create a new project or import one to get started.</p>
      </div>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, projectId: string): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenProject(projectId)
    }
  }

  return (
    <ul className="projects-gallery__list">
      {projects.map((project) => {
        const active = project.id === currentProjectId

        return (
          <li key={project.id}>
            <article
              className={`project-card ${active ? 'project-card--active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onOpenProject(project.id)}
              onKeyDown={(event) => handleKeyDown(event, project.id)}
            >
              <div className="project-card__top">
                <div className="project-card__title">
                  <strong>{project.name}</strong>
                  <span className="project-card__pattern">
                    {getPatternLabel(project.architecturePattern)}
                  </span>
                </div>
                <div className="project-card__actions">
                  <button
                    type="button"
                    className="project-card__action project-card__action--edit"
                    aria-label={`Edit ${project.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEditProject(project)
                    }}
                    data-ui-log={`Project list – Edit project ${project.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="project-card__action project-card__action--delete"
                    aria-label={`Delete ${project.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemoveProject(project.id, project.name)
                    }}
                    data-ui-log={`Project list – Delete project ${project.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="project-card__description">
                {getProjectSummary(project)}
              </p>
              <div className="project-card__footer">
                <span className="project-card__meta-date">Updated {formatUpdatedAt(project.updatedAt)}</span>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
