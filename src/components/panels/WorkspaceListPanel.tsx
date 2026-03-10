import { Workspace } from '@/domain/models/workspace'

interface WorkspaceListPanelProps {
  workspaces: Workspace[]
  currentWorkspaceId?: string
  onOpenWorkspace: (workspaceId: string) => void
}

export function WorkspaceListPanel({
  workspaces,
  currentWorkspaceId,
  onOpenWorkspace
}: WorkspaceListPanelProps): JSX.Element {
  return (
    <div className="panel workspace-list">
      <h2>Workspaces</h2>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <button
              type="button"
              className={workspace.id === currentWorkspaceId ? 'active' : ''}
              onClick={() => onOpenWorkspace(workspace.id)}
            >
              <strong>{workspace.name}</strong>
              <span>{workspace.description ?? 'No description'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
