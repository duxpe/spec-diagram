import { X } from 'lucide-react'
import { SemanticNode } from '@/domain/models/semantic-node'

interface FloatingInspectorProps {
  node?: SemanticNode
  parentContext?: {
    immediate: {
      level: 'N1' | 'N2'
      boardName: string
      nodeTitle: string
    }
    ancestor?: {
      level: 'N1' | 'N2'
      boardName: string
      nodeTitle: string
    }
  }
  onClose: () => void
  children: React.ReactNode
  hidden?: boolean
}

export function FloatingInspector({
  node,
  onClose,
  children,
  hidden = false
}: FloatingInspectorProps): JSX.Element | null {
  if (!node) {
    return null
  }

  return (
    <aside
      className={`floating-inspector${hidden ? ' floating-inspector--hidden' : ''}`}
      aria-label="Node inspector"
      aria-hidden={hidden}
    >
      <div className="floating-inspector__header">
        <h2 className="floating-inspector__title">
          {node.title}
        </h2>
        <button
          type="button"
          className="floating-inspector__close"
          onClick={onClose}
          title="Close inspector"
          aria-label="Close inspector"
        >
          <X size={18} />
        </button>
      </div>
      <div className="floating-inspector__content">
        {children}
      </div>
    </aside>
  )
}
