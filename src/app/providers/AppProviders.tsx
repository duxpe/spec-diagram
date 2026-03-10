import { ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useWorkspaceStore } from '@/state/workspace-store'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  const bootstrap = useWorkspaceStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return <BrowserRouter>{children}</BrowserRouter>
}
