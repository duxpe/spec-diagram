import { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { ArchitecturePattern, Workspace } from '@/domain/models/workspace'

interface WorkspaceListPanelProps {
  workspaces: Workspace[]
  currentWorkspaceId?: string
  onOpenWorkspace: (workspaceId: string) => void
  onRemoveWorkspace: (workspaceId: string, workspaceName: string) => void
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

export function WorkspaceListPanel({
  workspaces,
  currentWorkspaceId,
  onOpenWorkspace,
  onRemoveWorkspace
}: WorkspaceListPanelProps): JSX.Element {
  if (workspaces.length === 0) {
    return (
      <div className="projects-gallery__empty">
        <p>No projects yet. Create a new project or import one to get started.</p>
      </div>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, workspaceId: string): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenWorkspace(workspaceId)
    }
  }

  return (
    <ul className="projects-gallery__list">
      {workspaces.map((workspace) => {
        const active = workspace.id === currentWorkspaceId
        const boardCount = workspace.boardIds.length
        const boardLabel = boardCount === 1 ? '1 board' : `${boardCount} boards`

        return (
          <li key={workspace.id}>
            <article
              className={`project-card ${active ? 'project-card--active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onOpenWorkspace(workspace.id)}
              onKeyDown={(event) => handleKeyDown(event, workspace.id)}
            >
              <div className="project-card__top">
                <div className="project-card__title">
                  <strong>{workspace.name}</strong>
                  <span className="project-card__pattern">
                    {getPatternLabel(workspace.architecturePattern)}
                  </span>
                </div>
                <button
                  type="button"
                  className="project-card__remove"
                  aria-label={`Delete ${workspace.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveWorkspace(workspace.id, workspace.name)
                  }}
                  data-ui-log={`Workspace list – Delete project ${workspace.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="project-card__description">
                {workspace.description ?? 'No description provided yet.'}
              </p>
              <div className="project-card__footer">
                <span className="project-card__meta">
                  <span className="project-card__meta-icon" aria-hidden="true">
                    ■
                  </span>
                  <span>{boardCount > 0 ? boardLabel : 'No boards yet'}</span>
                </span>
                <span className="project-card__meta-date">Updated {formatUpdatedAt(workspace.updatedAt)}</span>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
