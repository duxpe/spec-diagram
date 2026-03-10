import { ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useUiStore } from '@/state/ui-store'
import { useWorkspaceStore } from '@/state/workspace-store'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  const bootstrap = useWorkspaceStore((state) => state.bootstrap)
  const themeMode = useUiStore((state) => state.themeMode)
  const resolveActiveTheme = useUiStore((state) => state.resolveActiveTheme)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const applyTheme = (): void => {
      const activeTheme = resolveActiveTheme()
      document.documentElement.dataset.theme = activeTheme
      document.documentElement.dataset.themeMode = themeMode
    }

    applyTheme()

    if (themeMode !== 'system' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (): void => applyTheme()

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [themeMode, resolveActiveTheme])

  return <BrowserRouter>{children}</BrowserRouter>
}
