import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

interface TLComponentsProps {
  persistenceKey: string
}

export function TLComponents({ persistenceKey }: TLComponentsProps): JSX.Element {
  return (
    <div className="tldraw-host" aria-label="Board whiteboard">
      <Tldraw persistenceKey={persistenceKey} />
    </div>
  )
}
