import { ReactNode } from 'react'

interface BoardLayoutProps {
  children: ReactNode
}

export function BoardLayout({ children }: BoardLayoutProps): JSX.Element {
  return (
    <div className="board-layout">
      <div className="board-layout__canvas">
        {children}
      </div>
    </div>
  )
}
