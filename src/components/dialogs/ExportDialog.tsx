import { useEffect, useMemo, useState } from 'react'
import { ExportPromptType, PromptExportBundle } from '@/domain/models/export'

interface ExportDialogProps {
  open: boolean
  jsonPayload: string
  jsonLoading: boolean
  promptBundle?: PromptExportBundle
  promptLoading: boolean
  onClose: () => void
  onRequestJson: () => void
  onGeneratePrompts: (type: ExportPromptType) => void
  onDownloadPromptZip: () => void
}

export function ExportDialog({
  open,
  jsonPayload,
  jsonLoading,
  promptBundle,
  promptLoading,
  onClose,
  onRequestJson,
  onGeneratePrompts,
  onDownloadPromptZip
}: ExportDialogProps): JSX.Element | null {
  const [tab, setTab] = useState<'json' | 'prompts'>('json')
  const [promptType, setPromptType] = useState<ExportPromptType>('spec_prompt')

  useEffect(() => {
    if (!open) return
    setTab('json')
  }, [open])

  useEffect(() => {
    if (!open || tab !== 'json' || jsonPayload || jsonLoading) return
    onRequestJson()
  }, [jsonLoading, jsonPayload, onRequestJson, open, tab])

  const promptItems = useMemo(() => {
    if (!promptBundle || promptBundle.exportType !== promptType) return []
    return promptBundle.items
  }, [promptBundle, promptType])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Export workspace data">
      <div className="dialog-card dialog-card--export">
        <header className="dialog-card__header">
          <h2>Export</h2>
        </header>

        <div className="dialog-tabs" role="tablist" aria-label="Export tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'json'}
            className={tab === 'json' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
            onClick={() => setTab('json')}
            data-ui-log="Export dialog – Select JSON tab"
          >
            JSON
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'prompts'}
            className={tab === 'prompts' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
            onClick={() => setTab('prompts')}
            data-ui-log="Export dialog – Select prompts tab"
          >
            Prompts (Markdown)
          </button>
        </div>

        {tab === 'json' ? (
          <section className="dialog-export-panel" aria-label="JSON export panel">
            {jsonLoading ? <p>Loading JSON export...</p> : null}
            <textarea
              value={jsonPayload}
              readOnly
              rows={16}
              placeholder="Workspace JSON export will appear here."
            />
          </section>
        ) : (
          <section className="dialog-export-panel" aria-label="Prompt export panel">
            <div className="dialog-export-panel__controls">
              <label htmlFor="prompt-type">Prompt type</label>
              <select
                id="prompt-type"
                value={promptType}
                onChange={(event) => setPromptType(event.target.value as ExportPromptType)}
              >
                <option value="spec_prompt">spec_prompt</option>
                <option value="task_prompt">task_prompt</option>
              </select>
              <button
                type="button"
                onClick={() => onGeneratePrompts(promptType)}
                disabled={promptLoading}
                data-ui-log="Export dialog – Generate prompts"
              >
                {promptLoading ? 'Generating...' : 'Generate prompts'}
              </button>
              <button
                type="button"
                onClick={onDownloadPromptZip}
                disabled={promptLoading || promptItems.length === 0}
                data-ui-log="Export dialog – Download prompt ZIP"
              >
                Download ZIP
              </button>
            </div>

            {promptItems.length === 0 ? (
              <p>No prompts generated for this type yet.</p>
            ) : (
              <div className="prompt-preview-list">
                {promptItems.map((item) => (
                  <article key={item.rootNodeId} className="prompt-preview-card">
                    <h3>{item.rootNodeTitle}</h3>
                    <p>
                      {item.rootNodeType} · {item.filename}
                    </p>
                    <textarea value={item.markdown} readOnly rows={12} />
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="dialog-card__actions">
          <button type="button" onClick={onClose} data-ui-log="Export dialog – Close">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
