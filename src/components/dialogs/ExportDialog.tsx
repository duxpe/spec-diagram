interface ExportDialogProps {
  open: boolean
  payload: string
  onClose: () => void
  onCopy: () => void
}

export function ExportDialog({ open, payload, onClose, onCopy }: ExportDialogProps): JSX.Element | null {
  if (!open) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Export workspace JSON">
      <div className="dialog-card">
        <header className="dialog-card__header">
          <h2>Workspace JSON export</h2>
        </header>

        <textarea value={payload} readOnly rows={16} />

        <div className="dialog-card__actions">
          <button type="button" onClick={onCopy}>
            Copy
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
