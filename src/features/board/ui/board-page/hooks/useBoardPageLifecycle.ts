import { useEffect } from 'react'
import { useBoardStore } from '@/features/board/model/board-store'

interface UseBoardPageLifecycleInput {
  projectId?: string
  boardId?: string
  openProject: (projectId: string) => Promise<unknown>
  loadBoard: (projectId: string, boardId: string) => Promise<void>
  setSelectedNodeId: (nodeId?: string) => void
  setInspectorOpen: (open: boolean) => void
  setNodeMenuPos: (value: { x: number; y: number } | null) => void
  setEditingInternalsNodeId: (value: string | null) => void
}

export function useBoardPageLifecycle({
  projectId,
  boardId,
  openProject,
  loadBoard,
  setSelectedNodeId,
  setInspectorOpen,
  setNodeMenuPos,
  setEditingInternalsNodeId
}: UseBoardPageLifecycleInput): void {
  useEffect(() => {
    setSelectedNodeId(undefined)
    setNodeMenuPos(null)
    setEditingInternalsNodeId(null)
    setInspectorOpen(false)
  }, [projectId, boardId, setSelectedNodeId, setInspectorOpen, setNodeMenuPos, setEditingInternalsNodeId])

  useEffect(() => {
    return () => {
      void useBoardStore.getState().saveCurrentBoard()
    }
  }, [projectId, boardId])

  useEffect(() => {
    if (!projectId || !boardId) return

    void (async () => {
      await openProject(projectId)
      await loadBoard(projectId, boardId)
    })()
  }, [projectId, boardId, openProject, loadBoard])
}
