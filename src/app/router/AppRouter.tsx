import { Navigate, Route, Routes } from 'react-router-dom'
import { WorkspacePage } from '@/pages/workspace/WorkspacePage'
import { BoardPage } from '@/pages/board/BoardPage'
import { useAppStore } from '@/state/app-store'
import { useWorkspaceStore } from '@/state/workspace-store'

function LandingRoute(): JSX.Element {
  const loading = useWorkspaceStore((state) => state.loading)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const boards = useWorkspaceStore((state) => state.boards)
  const lastBoardId = useAppStore((state) => state.lastBoardId)

  if (loading) {
    return <p>Loading...</p>
  }

  if (!currentWorkspace) {
    return <Navigate to="/workspaces" replace />
  }

  const boardIds = boards.map((board) => board.id)
  const targetBoardId =
    lastBoardId && boardIds.includes(lastBoardId) ? lastBoardId : currentWorkspace.rootBoardId

  return <Navigate to={`/workspace/${currentWorkspace.id}/board/${targetBoardId}`} replace />
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/workspaces" element={<WorkspacePage />} />
      <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
      <Route path="/workspace/:workspaceId/board/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/workspaces" replace />} />
    </Routes>
  )
}
