import { useEffect } from 'react'
import { useBoardStore } from '@/features/board/model/board-store'

const AUTOSAVE_DEBOUNCE_MS = 800

export function useBoardAutosave(): void {
  const dirty = useBoardStore((state) => state.dirty)
  const saveCurrentBoard = useBoardStore((state) => state.saveCurrentBoard)

  useEffect(() => {
    if (!dirty) return

    const timeoutId = window.setTimeout(() => {
      void saveCurrentBoard()
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dirty, saveCurrentBoard])
}
