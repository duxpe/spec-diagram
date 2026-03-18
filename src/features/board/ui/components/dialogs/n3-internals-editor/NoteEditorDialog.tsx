import { FilePenLine } from 'lucide-react'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'

interface NoteEditorDialogProps {
  open: boolean
  draftNote: string
  onDraftNoteChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}

export function NoteEditorDialog({
  open,
  draftNote,
  onDraftNoteChange,
  onClose,
  onSave
}: NoteEditorDialogProps): JSX.Element | null {
  useEscapeKey(onClose, open)

  if (!open) return null

  return (
    <div className="dialog-backdrop n3-note-backdrop" onClick={onClose}>
      <div className="dialog-card n3-note-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="dialog-card__header">
          <h2><FilePenLine size={16} /> Edit note</h2>
        </header>
        <textarea
          rows={6}
          value={draftNote}
          onChange={(event) => onDraftNoteChange(event.target.value)}
          placeholder="Add implementation notes for this row"
        />
        <div className="dialog-card__actions">
          <button
            type="button"
            onClick={onClose}
            data-ui-log="Internals editor – Cancel note"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn--primary"
            onClick={onSave}
            data-ui-log="Internals editor – Save note"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  )
}
