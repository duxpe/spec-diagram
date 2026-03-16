import { useEffect } from 'react'

export function useKeyboardSave(saveCurrentBoard: () => Promise<boolean>): void {
  useEffect(() => {
    const handleSave = (event: KeyboardEvent): void => {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'
      if (!isSave) return

      event.preventDefault()
      void saveCurrentBoard()
    }

    window.addEventListener('keydown', handleSave)
    return () => window.removeEventListener('keydown', handleSave)
  }, [saveCurrentBoard])
}
