import { useEffect } from 'react'

export function useEscapeKey(callback: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return

    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') callback()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [callback, enabled])
}
