import { useEscapeKey } from '@/shared/hooks/useEscapeKey'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onClose,
  onConfirm
}: ConfirmationDialogProps): JSX.Element | null {
  useEscapeKey(onClose, open)

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="dialog-card confirmation-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="dialog-card__header">
          <h2>{title}</h2>
        </header>
        <p className="confirmation-dialog__description">{description}</p>

        <div className="dialog-card__actions">
          <button type="button" onClick={onClose} disabled={isConfirming} data-ui-log="Confirmation dialog – Cancel">
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirmation-dialog__confirm"
            onClick={onConfirm}
            disabled={isConfirming}
            data-ui-log="Confirmation dialog – Confirm"
          >
            {isConfirming ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
