import type { Dispatch, SetStateAction } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { ListInput } from '@/shared/ui/inputs/ListInput'
import {
  EMPTY_ENDPOINT,
  HTTP_METHODS,
  type EndpointRow,
  type NoteTarget
} from '@/features/board/ui/components/dialogs/n3-internals-editor/types'
import { moveItem } from '@/features/board/ui/components/dialogs/n3-internals-editor/utils'

interface ContractInternalsSectionProps {
  contractKind: string
  onContractKindChange: (value: string) => void
  contractConsumer: string
  onContractConsumerChange: (value: string) => void
  contractProvider: string
  onContractProviderChange: (value: string) => void
  contractInputSummary: string[]
  setContractInputSummary: Dispatch<SetStateAction<string[]>>
  contractOutputSummary: string[]
  setContractOutputSummary: Dispatch<SetStateAction<string[]>>
  contractConstraints: string[]
  setContractConstraints: Dispatch<SetStateAction<string[]>>
  contractErrorCases: string[]
  setContractErrorCases: Dispatch<SetStateAction<string[]>>
  endpoints: EndpointRow[]
  setEndpoints: Dispatch<SetStateAction<EndpointRow[]>>
  makeLocalId: () => string
  contractKinds: readonly string[]
  onOpenNoteEditor: (target: NoteTarget) => void
}

export function ContractInternalsSection({
  contractKind,
  onContractKindChange,
  contractConsumer,
  onContractConsumerChange,
  contractProvider,
  onContractProviderChange,
  contractInputSummary,
  setContractInputSummary,
  contractOutputSummary,
  setContractOutputSummary,
  contractConstraints,
  setContractConstraints,
  contractErrorCases,
  setContractErrorCases,
  endpoints,
  setEndpoints,
  makeLocalId,
  contractKinds,
  onOpenNoteEditor
}: ContractInternalsSectionProps): JSX.Element {
  return (
    <section className="n3-internals-dialog__content">
      <div className="n3-contract-form">
        <div className="n3-contract-form__grid">
          <label>
            Contract kind
            <select value={contractKind} onChange={(event) => onContractKindChange(event.target.value)}>
              {contractKinds.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Consumer
            <input value={contractConsumer} onChange={(event) => onContractConsumerChange(event.target.value)} />
          </label>
          <label>
            Provider
            <input value={contractProvider} onChange={(event) => onContractProviderChange(event.target.value)} />
          </label>
        </div>

        <div className="n3-contract-form__grid n3-contract-form__grid--two">
          <ListInput
            id="contract-input-summary"
            label="Input summary"
            items={contractInputSummary}
            onChange={(items) => setContractInputSummary(items ?? [])}
          />
          <ListInput
            id="contract-output-summary"
            label="Output summary"
            items={contractOutputSummary}
            onChange={(items) => setContractOutputSummary(items ?? [])}
          />
        </div>

        <div className="n3-contract-form__grid n3-contract-form__grid--two">
          <ListInput
            id="contract-constraints"
            label="Constraints"
            items={contractConstraints}
            onChange={(items) => setContractConstraints(items ?? [])}
          />
          <ListInput
            id="contract-error-cases"
            label="Error cases"
            items={contractErrorCases}
            onChange={(items) => setContractErrorCases(items ?? [])}
          />
        </div>

        {endpoints.length === 0 ? <p className="n3-internals-dialog__empty">No endpoints yet. Add rows for contract internals.</p> : null}
        <table className="n3-table" aria-label="API endpoints table">
          <thead>
            <tr>
              <th>HTTP method</th>
              <th>URL</th>
              <th>Request format</th>
              <th>Response format</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((row, index) => (
              <tr key={row.localId}>
                <td>
                  <select
                    value={row.httpMethod}
                    onChange={(event) =>
                      setEndpoints((prev) =>
                        prev.map((entry) =>
                          entry.localId === row.localId
                            ? { ...entry, httpMethod: event.target.value as EndpointRow['httpMethod'] }
                            : entry
                        )
                      )
                    }
                  >
                    {HTTP_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    value={row.url}
                    onChange={(event) =>
                      setEndpoints((prev) =>
                        prev.map((entry) =>
                          entry.localId === row.localId ? { ...entry, url: event.target.value } : entry
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={row.requestFormat}
                    onChange={(event) =>
                      setEndpoints((prev) =>
                        prev.map((entry) =>
                          entry.localId === row.localId
                            ? { ...entry, requestFormat: event.target.value }
                            : entry
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={row.responseFormat}
                    onChange={(event) =>
                      setEndpoints((prev) =>
                        prev.map((entry) =>
                          entry.localId === row.localId
                            ? { ...entry, responseFormat: event.target.value }
                            : entry
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onOpenNoteEditor({ scope: 'endpoint', localId: row.localId })}
                    data-ui-log={`Internals editor – ${row.note ? 'Edit' : 'Add'} endpoint note`}
                  >
                    {row.note ? 'Edit note' : 'Add note'}
                  </button>
                </td>
                <td>
                  <div className="n3-table__actions">
                    <button
                      type="button"
                      onClick={() => setEndpoints((prev) => moveItem(prev, index, 'up'))}
                      aria-label="Move endpoint up"
                      data-ui-log="Internals editor – Move endpoint up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndpoints((prev) => moveItem(prev, index, 'down'))}
                      aria-label="Move endpoint down"
                      data-ui-log="Internals editor – Move endpoint down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndpoints((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                      aria-label="Delete endpoint"
                      data-ui-log="Internals editor – Delete endpoint"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          className="n3-table__add"
          onClick={() => setEndpoints((prev) => [...prev, { ...EMPTY_ENDPOINT, localId: makeLocalId() }])}
          data-ui-log="Internals editor – Add endpoint"
        >
          <Plus size={14} /> Add endpoint
        </button>
      </div>
    </section>
  )
}
