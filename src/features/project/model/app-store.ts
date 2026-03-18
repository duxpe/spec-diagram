import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AppState {
  lastProjectId?: string
  lastBoardId?: string
  setLastContext: (projectId?: string, boardId?: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastProjectId: undefined,
      lastBoardId: undefined,
      setLastContext: (projectId, boardId) => {
        set({ lastProjectId: projectId, lastBoardId: boardId })
      }
    }),
    {
      name: 'designer-app-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
