import { FormEvent, useState } from 'react'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (jsonInput: string) => Promise<void>
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps): JSX.Element | null {
  const [value, setValue] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  if (!open) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!value.trim()) return

    setIsImporting(true)
    try {
      await onImport(value)
      setValue('')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Import workspace JSON">
      <div className="dialog-card">
        <header className="dialog-card__header">
          <h2>Workspace JSON import</h2>
        </header>

        <form className="dialog-import-form" onSubmit={handleSubmit}>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={16}
            placeholder="Paste workspace JSON here"
          />

          <div className="dialog-card__actions">
            <button
              type="submit"
              disabled={isImporting || !value.trim()}
              data-ui-log="Import dialog – Import workspace"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <button type="button" onClick={onClose} data-ui-log="Import dialog – Close">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
