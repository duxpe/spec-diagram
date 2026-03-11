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
    return <Navigate to="/projects" replace />
  }

  const boardIds = boards.map((board) => board.id)
  const targetBoardId =
    lastBoardId && boardIds.includes(lastBoardId) ? lastBoardId : currentWorkspace.rootBoardId

  return <Navigate to={`/project/${currentWorkspace.id}/board/${targetBoardId}`} replace />
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/projects" element={<WorkspacePage />} />
      <Route path="/project/:projectId" element={<WorkspacePage />} />
      <Route path="/project/:projectId/board/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
