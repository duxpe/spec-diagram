import { ReactNode } from 'react'

interface AppShellProps {
  header?: ReactNode
  sidebar?: ReactNode
  inspector?: ReactNode
  children: ReactNode
}

export function AppShell({ header, sidebar, inspector, children }: AppShellProps): JSX.Element {
  return (
    <div className="app-shell">
      {header ? <header className="app-shell__header">{header}</header> : null}
      {sidebar ? <aside className="app-shell__sidebar">{sidebar}</aside> : null}
      <main className="app-shell__main">{children}</main>
      {inspector ? <aside className="app-shell__inspector">{inspector}</aside> : null}
    </div>
  )
}
