import { Copy, Trash2, ExternalLink } from 'lucide-react'

interface NodeActionMenuProps {
  position: { x: number; y: number }
  canOpenDetail: boolean
  onDuplicate: () => void
  onOpenDetail: () => void
  onDelete: () => void
}

export function NodeActionMenu({
  position,
  canOpenDetail,
  onDuplicate,
  onOpenDetail,
  onDelete
}: NodeActionMenuProps): JSX.Element {
  return (
    <div
      className="node-action-menu"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <button
        type="button"
        className="node-action-menu__btn"
        onClick={onDuplicate}
        title="Duplicate"
        aria-label="Duplicate node"
        data-ui-log="Node action – Duplicate node"
      >
        <Copy size={18} />
      </button>

      {canOpenDetail && (
        <button
          type="button"
          className="node-action-menu__btn"
          onClick={onOpenDetail}
          title="Open detail board"
          aria-label="Open detail board"
          data-ui-log="Node action – Open detail board"
        >
          <ExternalLink size={18} />
        </button>
      )}

      <button
        type="button"
        className="node-action-menu__btn node-action-menu__btn--danger"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete node"
        data-ui-log="Node action – Delete node"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
