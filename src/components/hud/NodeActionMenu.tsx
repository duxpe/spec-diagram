import { Copy, Trash2, ExternalLink, Rows3 } from 'lucide-react'

interface NodeActionMenuProps {
  position: { x: number; y: number }
  canOpenDetail: boolean
  canEditInternals?: boolean
  onEditInternals?: () => void
  onDuplicate: () => void
  onOpenDetail: () => void
  onDelete: () => void
}

export function NodeActionMenu({
  position,
  canOpenDetail,
  canEditInternals,
  onEditInternals,
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

      {canEditInternals && onEditInternals ? (
        <button
          type="button"
          className="node-action-menu__btn"
          onClick={onEditInternals}
          title="Edit internals"
          aria-label="Edit internals"
          data-ui-log="Node action – Edit internals"
        >
          <Rows3 size={18} />
        </button>
      ) : null}

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
