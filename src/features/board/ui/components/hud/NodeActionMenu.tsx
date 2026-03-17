import { Copy, Trash2, ExternalLink } from 'lucide-react'

interface NodeActionMenuProps {
  position: { x: number; y: number }
  canShowSecondaryAction: boolean
  secondaryActionLabel: string
  onDuplicate: () => void
  onSecondaryAction: () => void
  onDelete: () => void
}

export function NodeActionMenu({
  position,
  canShowSecondaryAction,
  secondaryActionLabel,
  onDuplicate,
  onSecondaryAction,
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

      {canShowSecondaryAction && (
        <button
          type="button"
          className="node-action-menu__btn"
          onClick={onSecondaryAction}
          title={secondaryActionLabel}
          aria-label={secondaryActionLabel}
          data-ui-log={`Node action – ${secondaryActionLabel}`}
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
