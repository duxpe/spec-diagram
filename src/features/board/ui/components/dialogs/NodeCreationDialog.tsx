import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { SemanticLevel } from '@/domain/models/board'
import type { SemanticNodeType } from '@/domain/models/semantic-node'
import { buildNodeMeaning, getDefaultNodeMeaningDraft, getNodeMeaningFields, type NodeMeaningDraft } from '@/domain/semantics/meaning-capture'

interface NodeCreationDialogProps {
  open: boolean
  level: SemanticLevel
  type: SemanticNodeType
  defaultTitle: string
  patternRole?: string
  onClose: () => void
  onCreate: (payload: {
    title: string
    description?: string
    meaning: ReturnType<typeof buildNodeMeaning>
    meaningDraft: NodeMeaningDraft
  }) => void
}

export function NodeCreationDialog({
  open,
  level,
  type,
  defaultTitle,
  patternRole,
  onClose,
  onCreate
}: NodeCreationDialogProps): JSX.Element | null {
  const [draft, setDraft] = useState<NodeMeaningDraft>(() =>
    getDefaultNodeMeaningDraft(level, type, defaultTitle, patternRole)
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fields = useMemo(() => getNodeMeaningFields(level, type), [level, type])

  useEffect(() => {
    setDraft(getDefaultNodeMeaningDraft(level, type, defaultTitle, patternRole))
    setShowAdvanced(false)
  }, [defaultTitle, level, patternRole, type])

  if (!open) return null

  const reset = (): void => {
    setDraft(getDefaultNodeMeaningDraft(level, type, defaultTitle, patternRole))
    setShowAdvanced(false)
  }

  const handleClose = (): void => {
    reset()
    onClose()
  }

  const missingRequired = fields.some((field) => {
    if (!field.required) return false
    const value = draft[field.key]
    return typeof value === 'string' ? value.trim().length === 0 : false
  }) || draft.title.trim().length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (missingRequired) return

    const meaning = buildNodeMeaning(draft)
    onCreate({
      title: draft.title.trim(),
      description: draft.summary.trim() || meaning.purpose,
      meaning,
      meaningDraft: draft
    })
    reset()
  }

  const handleDefineLater = (): void => {
    const deferredDraft = {
      ...draft,
      title: draft.title.trim() || defaultTitle
    }

    onCreate({
      title: deferredDraft.title,
      description: undefined,
      meaning: buildNodeMeaning(deferredDraft),
      meaningDraft: deferredDraft
    })
    reset()
  }

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div
        className="dialog-card node-creation-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-card__header">
          <h2>Create {type.replace(/_/g, ' ')}</h2>
          <p className="pattern-dialog__subtitle">
            Capture the meaning now. Technical details can wait for the inspector.
          </p>
        </div>

        <form className="node-creation-dialog__form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              autoFocus
              required
            />
          </label>

          {fields.filter((field) => !field.advanced).map((field) => (
            <label key={field.key}>
              {field.label}
              {field.kind === 'textarea' || field.kind === 'list' ? (
                <textarea
                  rows={field.key === 'purpose' ? 3 : 2}
                  value={draft[field.key]}
                  placeholder={field.kind === 'list' ? `${field.placeholder} (one per line)` : field.placeholder}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              ) : (
                <input
                  type="text"
                  value={draft[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              )}
            </label>
          ))}

          {fields.some((field) => field.advanced) ? (
            <>
              <button
                type="button"
                className="node-creation-dialog__advanced-toggle"
                onClick={() => setShowAdvanced((value) => !value)}
              >
                {showAdvanced ? 'Hide advanced notes' : 'Add optional details'}
              </button>
              {showAdvanced ? (
                <div className="node-creation-dialog__advanced">
                  {fields.filter((field) => field.advanced).map((field) => (
                    <label key={field.key}>
                      {field.label}
                      {field.kind === 'textarea' || field.kind === 'list' ? (
                        <textarea
                          rows={2}
                          value={draft[field.key]}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          value={draft[field.key]}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          <div className="dialog-card__actions">
            <button type="button" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" onClick={handleDefineLater}>
              Define details later
            </button>
            <button type="submit" className="btn--primary" disabled={missingRequired}>
              Create node
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
