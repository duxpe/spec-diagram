import { useEffect } from 'react'
import { useBoardStore } from '@/features/board/model/board-store'
import { flushCurrentBoardSnapshot } from '@/infrastructure/db/recovery-subscriptions'

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

  useEffect(() => {
    if (!dirty) return

    const flush = (): void => {
      flushCurrentBoardSnapshot()
      void saveCurrentBoard()
    }

    const handlePageHide = (): void => {
      flush()
    }

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }

    const handleBeforeUnload = (): void => {
      flush()
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [dirty, saveCurrentBoard])
}
