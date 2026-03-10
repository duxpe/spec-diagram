import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AppState {
  lastWorkspaceId?: string
  lastBoardId?: string
  setLastContext: (workspaceId?: string, boardId?: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastWorkspaceId: undefined,
      lastBoardId: undefined,
      setLastContext: (workspaceId, boardId) => {
        set({ lastWorkspaceId: workspaceId, lastBoardId: boardId })
      }
    }),
    {
      name: 'designer-app-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
