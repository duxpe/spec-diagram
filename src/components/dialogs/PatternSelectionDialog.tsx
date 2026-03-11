import { FormEvent, useState } from 'react'
import { ArchitecturePattern } from '@/domain/models/workspace'
import { PATTERN_CATALOG, PatternDefinition } from '@/domain/semantics/pattern-catalog'

interface PatternSelectionDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string | undefined, pattern: ArchitecturePattern) => void
}

const PATTERNS: PatternDefinition[] = Object.values(PATTERN_CATALOG)

export function PatternSelectionDialog({
  open,
  onClose,
  onCreate
}: PatternSelectionDialogProps): JSX.Element | null {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPattern, setSelectedPattern] = useState<ArchitecturePattern | null>(null)

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || !selectedPattern) return

    onCreate(trimmedName, description.trim() || undefined, selectedPattern)
    setName('')
    setDescription('')
    setSelectedPattern(null)
  }

  const handleClose = (): void => {
    setName('')
    setDescription('')
    setSelectedPattern(null)
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div
        className="dialog-card pattern-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-card__header">
          <h2>Choose the architectural pattern for this project</h2>
          <p className="pattern-dialog__subtitle">
            This choice defines the suggested blocks and connections on the main board.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pattern-dialog__form-fields">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pattern-dialog__grid">
            {PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                className={`pattern-card${selectedPattern === pattern.id ? ' pattern-card--selected' : ''}`}
                onClick={() => setSelectedPattern(pattern.id)}
              >
                <span className="pattern-card__name">{pattern.name}</span>
                <span className="pattern-card__desc">{pattern.description}</span>
              </button>
            ))}
          </div>

          <div className="dialog-card__actions">
            <button type="button" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn--primary"
              disabled={!name.trim() || !selectedPattern}
            >
              Create project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
