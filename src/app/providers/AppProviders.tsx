import { ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useUiStore } from '@/state/ui-store'
import { useWorkspaceStore } from '@/state/workspace-store'
import { isUiLoggingEnabled, logUiEvent } from '@/utils/ui-logger'

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

  useEffect(() => {
    if (!isUiLoggingEnabled()) return

    const handleButtonClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const actionable = target.closest<HTMLElement>('[data-ui-log]')
      if (!actionable) return

      const labelText =
        actionable.getAttribute('data-ui-log') ??
        actionable.getAttribute('aria-label') ??
        actionable.getAttribute('title') ??
        actionable.textContent?.trim()?.replace(/\s+/g, ' ')

      const actionName = labelText || 'UI action'
      const datasetEntries = Object.entries(actionable.dataset)
      const dataset = datasetEntries.length > 0 ? Object.fromEntries(datasetEntries) : undefined

      logUiEvent(`Button used: ${actionName}`, {
        tag: actionable.tagName.toLowerCase(),
        ...(dataset ? { dataset } : {})
      })
    }

    document.addEventListener('click', handleButtonClick)
    return () => document.removeEventListener('click', handleButtonClick)
  }, [])

  return <BrowserRouter>{children}</BrowserRouter>
}
