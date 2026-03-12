import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ArrowUp, ArrowDown, Plus, FilePenLine, Trash2 } from 'lucide-react'
import type { SemanticNode } from '@/domain/models/semantic-node'
import {
  getPayloadIssuesForNodeType,
  type N3AttributeInternal,
  type N3ContractEndpointInternal,
  type N3MethodInternal
} from '@/domain/schemas/semantic-node-payload.schema'

interface N3InternalsEditorDialogProps {
  open: boolean
  node?: SemanticNode
  onClose: () => void
  onSave: (dataPatch: Record<string, unknown>) => void
}

type InternalsNodeType = 'class' | 'interface' | 'api_contract'
type ClassTab = 'methods' | 'attributes'

type MethodRow = N3MethodInternal & { localId: string }
type AttributeRow = N3AttributeInternal & { localId: string }
type EndpointRow = N3ContractEndpointInternal & { localId: string }

type NoteTarget =
  | { scope: 'method'; localId: string }
  | { scope: 'attribute'; localId: string }
  | { scope: 'endpoint'; localId: string }

const EMPTY_METHOD: Omit<MethodRow, 'localId'> = {
  returnType: '',
  name: '',
  parameters: '',
  note: undefined
}

const EMPTY_ATTRIBUTE: Omit<AttributeRow, 'localId'> = {
  type: '',
  name: '',
  defaultValue: undefined,
  note: undefined
}

const EMPTY_ENDPOINT: Omit<EndpointRow, 'localId'> = {
  httpMethod: 'GET',
  url: '',
  requestFormat: '',
  responseFormat: '',
  note: undefined
}

const CONTRACT_KINDS = ['http', 'event', 'message', 'rpc', 'other'] as const
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= items.length) return items

  const clone = [...items]
  const [item] = clone.splice(index, 1)
  if (!item) return items
  clone.splice(target, 0, item)
  return clone
}

function sanitizeOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toMethodRows(value: unknown, nextId: () => string): MethodRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      localId: nextId(),
      returnType: asString(entry.returnType),
      name: asString(entry.name),
      parameters: asString(entry.parameters),
      note: sanitizeOptional(asString(entry.note))
    }))
}

function toAttributeRows(value: unknown, nextId: () => string): AttributeRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      localId: nextId(),
      type: asString(entry.type),
      name: asString(entry.name),
      defaultValue: sanitizeOptional(asString(entry.defaultValue)),
      note: sanitizeOptional(asString(entry.note))
    }))
}

function toEndpointRows(value: unknown, nextId: () => string): EndpointRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => {
      const method = asString(entry.httpMethod).toUpperCase()
      return {
        localId: nextId(),
        httpMethod: (HTTP_METHODS.includes(method as EndpointRow['httpMethod'])
          ? method
          : 'GET') as EndpointRow['httpMethod'],
        url: asString(entry.url),
        requestFormat: asString(entry.requestFormat),
        responseFormat: asString(entry.responseFormat),
        note: sanitizeOptional(asString(entry.note))
      }
    })
}

export function N3InternalsEditorDialog({
  open,
  node,
  onClose,
  onSave
}: N3InternalsEditorDialogProps): JSX.Element | null {
  const localCounterRef = useRef(0)
  const makeLocalId = (): string => {
    localCounterRef.current += 1
    return `row_${localCounterRef.current}`
  }

  const [activeClassTab, setActiveClassTab] = useState<ClassTab>('methods')
  const [methods, setMethods] = useState<MethodRow[]>([])
  const [attributes, setAttributes] = useState<AttributeRow[]>([])
  const [endpoints, setEndpoints] = useState<EndpointRow[]>([])
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [payloadError, setPayloadError] = useState<string>()

  const [contractKind, setContractKind] = useState('http')
  const [contractConsumer, setContractConsumer] = useState('')
  const [contractProvider, setContractProvider] = useState('')
  const [contractInputSummary, setContractInputSummary] = useState('')
  const [contractOutputSummary, setContractOutputSummary] = useState('')
  const [contractConstraints, setContractConstraints] = useState('')
  const [contractErrorCases, setContractErrorCases] = useState('')

  const eligible =
    node &&
    node.level === 'N2' &&
    (node.type === 'class' || node.type === 'interface' || node.type === 'api_contract')
      ? node.type
      : null

  useEffect(() => {
    if (!open || !eligible || !node) return

    const data = node.data
    const internals =
      typeof data.internals === 'object' && data.internals !== null
        ? (data.internals as Record<string, unknown>)
        : {}

    setPayloadError(undefined)
    setNoteTarget(null)
    setDraftNote('')
    setMethods(toMethodRows(internals.methods, makeLocalId))
    setAttributes(toAttributeRows(internals.attributes, makeLocalId))
    setEndpoints(toEndpointRows(internals.endpoints, makeLocalId))

    if (node.type === 'api_contract') {
      setContractKind(asString(data.kind) || 'http')
      setContractConsumer(asString(data.consumer))
      setContractProvider(asString(data.provider))
      setContractInputSummary(asStringList(data.inputSummary).join('\n'))
      setContractOutputSummary(asStringList(data.outputSummary).join('\n'))
      setContractConstraints(asStringList(data.constraints).join('\n'))
      setContractErrorCases(asStringList(data.errorCases).join('\n'))
    }
  }, [open, eligible, node])

  const dialogTitle = useMemo(() => {
    if (!node) return 'Edit internals'
    return `Edit internals: ${node.title}`
  }, [node])

  if (!open || !eligible || !node) return null

  const openNoteEditor = (target: NoteTarget): void => {
    setNoteTarget(target)

    if (target.scope === 'method') {
      setDraftNote(methods.find((row) => row.localId === target.localId)?.note ?? '')
      return
    }

    if (target.scope === 'attribute') {
      setDraftNote(attributes.find((row) => row.localId === target.localId)?.note ?? '')
      return
    }

    setDraftNote(endpoints.find((row) => row.localId === target.localId)?.note ?? '')
  }

  const applyNote = (): void => {
    if (!noteTarget) return

    const note = sanitizeOptional(draftNote)
    if (noteTarget.scope === 'method') {
      setMethods((prev) =>
        prev.map((row) => (row.localId === noteTarget.localId ? { ...row, note } : row))
      )
    } else if (noteTarget.scope === 'attribute') {
      setAttributes((prev) =>
        prev.map((row) => (row.localId === noteTarget.localId ? { ...row, note } : row))
      )
    } else {
      setEndpoints((prev) =>
        prev.map((row) => (row.localId === noteTarget.localId ? { ...row, note } : row))
      )
    }

    setNoteTarget(null)
    setDraftNote('')
  }

  const buildPayload = (): Record<string, unknown> => {
    if (eligible === 'api_contract') {
      return {
        kind: CONTRACT_KINDS.includes(contractKind as (typeof CONTRACT_KINDS)[number])
          ? contractKind
          : 'http',
        consumer: sanitizeOptional(contractConsumer),
        provider: sanitizeOptional(contractProvider),
        inputSummary: parseLines(contractInputSummary),
        outputSummary: parseLines(contractOutputSummary),
        constraints: parseLines(contractConstraints),
        errorCases: parseLines(contractErrorCases),
        internals: {
          endpoints: endpoints.map((row) => ({
            httpMethod: row.httpMethod,
            url: row.url,
            requestFormat: row.requestFormat,
            responseFormat: row.responseFormat,
            note: row.note
          }))
        }
      }
    }

    return {
      ...node.data,
      internals: {
        methods: methods.map((row) => ({
          returnType: row.returnType,
          name: row.name,
          parameters: row.parameters,
          note: row.note
        })),
        attributes: attributes.map((row) => ({
          type: row.type,
          name: row.name,
          defaultValue: row.defaultValue,
          note: row.note
        }))
      }
    }
  }

  const handleSave = (): void => {
    const nextData = buildPayload()
    const issues = getPayloadIssuesForNodeType(node.type, nextData)

    if (issues.length > 0) {
      setPayloadError(issues[0]?.message ?? 'Invalid data')
      return
    }

    setPayloadError(undefined)
    onSave(nextData)
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Edit internals" onClick={onClose}>
      <div className="dialog-card n3-internals-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="dialog-card__header n3-internals-dialog__header">
          <div>
            <h2>{dialogTitle}</h2>
            <p className="n3-internals-dialog__subtitle">Structured N3 editing attached to this N2 element.</p>
          </div>
          <button type="button" className="n3-internals-dialog__close" onClick={onClose} aria-label="Close internals editor">
            <X size={18} />
          </button>
        </header>

        {eligible !== 'api_contract' ? (
          <div className="dialog-tabs" role="tablist" aria-label="Internals tabs">
            <button
              type="button"
              className={activeClassTab === 'methods' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
              onClick={() => setActiveClassTab('methods')}
            >
              Methods
            </button>
            <button
              type="button"
              className={activeClassTab === 'attributes' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
              onClick={() => setActiveClassTab('attributes')}
            >
              Attributes
            </button>
          </div>
        ) : null}

        <section className="n3-internals-dialog__content">
          {eligible !== 'api_contract' && activeClassTab === 'methods' ? (
            <div>
              {methods.length === 0 ? <p className="n3-internals-dialog__empty">No methods yet. Add a row to capture behavior.</p> : null}
              <table className="n3-table" aria-label="Methods table">
                <thead>
                  <tr>
                    <th>Return type</th>
                    <th>Name</th>
                    <th>Parameters / Signature</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((row, index) => (
                    <tr key={row.localId}>
                      <td>
                        <input
                          value={row.returnType}
                          onChange={(event) =>
                            setMethods((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId ? { ...entry, returnType: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={row.name}
                          onChange={(event) =>
                            setMethods((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId ? { ...entry, name: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={row.parameters}
                          onChange={(event) =>
                            setMethods((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId ? { ...entry, parameters: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => openNoteEditor({ scope: 'method', localId: row.localId })}>
                          {row.note ? 'Edit note' : 'Add note'}
                        </button>
                      </td>
                      <td>
                        <div className="n3-table__actions">
                          <button type="button" onClick={() => setMethods((prev) => moveItem(prev, index, 'up'))} aria-label="Move method up">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => setMethods((prev) => moveItem(prev, index, 'down'))} aria-label="Move method down">
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMethods((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                            aria-label="Delete method"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="n3-table__add" onClick={() => setMethods((prev) => [...prev, { ...EMPTY_METHOD, localId: makeLocalId() }])}>
                <Plus size={14} /> Add method
              </button>
            </div>
          ) : null}

          {eligible !== 'api_contract' && activeClassTab === 'attributes' ? (
            <div>
              {attributes.length === 0 ? <p className="n3-internals-dialog__empty">No attributes yet. Add a row to define state structure.</p> : null}
              <table className="n3-table" aria-label="Attributes table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Default value</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((row, index) => (
                    <tr key={row.localId}>
                      <td>
                        <input
                          value={row.type}
                          onChange={(event) =>
                            setAttributes((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId ? { ...entry, type: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={row.name}
                          onChange={(event) =>
                            setAttributes((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId ? { ...entry, name: event.target.value } : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={row.defaultValue ?? ''}
                          onChange={(event) =>
                            setAttributes((prev) =>
                              prev.map((entry) =>
                                entry.localId === row.localId
                                  ? { ...entry, defaultValue: sanitizeOptional(event.target.value) }
                                  : entry
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => openNoteEditor({ scope: 'attribute', localId: row.localId })}>
                          {row.note ? 'Edit note' : 'Add note'}
                        </button>
                      </td>
                      <td>
                        <div className="n3-table__actions">
                          <button type="button" onClick={() => setAttributes((prev) => moveItem(prev, index, 'up'))} aria-label="Move attribute up">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => setAttributes((prev) => moveItem(prev, index, 'down'))} aria-label="Move attribute down">
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttributes((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                            aria-label="Delete attribute"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="n3-table__add" onClick={() => setAttributes((prev) => [...prev, { ...EMPTY_ATTRIBUTE, localId: makeLocalId() }])}>
                <Plus size={14} /> Add attribute
              </button>
            </div>
          ) : null}

          {eligible === 'api_contract' ? (
            <div className="n3-contract-form">
              <div className="n3-contract-form__grid">
                <label>
                  Contract kind
                  <select value={contractKind} onChange={(event) => setContractKind(event.target.value)}>
                    {CONTRACT_KINDS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Consumer
                  <input value={contractConsumer} onChange={(event) => setContractConsumer(event.target.value)} />
                </label>
                <label>
                  Provider
                  <input value={contractProvider} onChange={(event) => setContractProvider(event.target.value)} />
                </label>
              </div>

              <div className="n3-contract-form__grid n3-contract-form__grid--two">
                <label>
                  Input summary (one per line)
                  <textarea rows={3} value={contractInputSummary} onChange={(event) => setContractInputSummary(event.target.value)} />
                </label>
                <label>
                  Output summary (one per line)
                  <textarea rows={3} value={contractOutputSummary} onChange={(event) => setContractOutputSummary(event.target.value)} />
                </label>
              </div>

              <div className="n3-contract-form__grid n3-contract-form__grid--two">
                <label>
                  Constraints (one per line)
                  <textarea rows={2} value={contractConstraints} onChange={(event) => setContractConstraints(event.target.value)} />
                </label>
                <label>
                  Error cases (one per line)
                  <textarea rows={2} value={contractErrorCases} onChange={(event) => setContractErrorCases(event.target.value)} />
                </label>
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
                        <button type="button" onClick={() => openNoteEditor({ scope: 'endpoint', localId: row.localId })}>
                          {row.note ? 'Edit note' : 'Add note'}
                        </button>
                      </td>
                      <td>
                        <div className="n3-table__actions">
                          <button type="button" onClick={() => setEndpoints((prev) => moveItem(prev, index, 'up'))} aria-label="Move endpoint up">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => setEndpoints((prev) => moveItem(prev, index, 'down'))} aria-label="Move endpoint down">
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEndpoints((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                            aria-label="Delete endpoint"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button type="button" className="n3-table__add" onClick={() => setEndpoints((prev) => [...prev, { ...EMPTY_ENDPOINT, localId: makeLocalId() }])}>
                <Plus size={14} /> Add endpoint
              </button>
            </div>
          ) : null}
        </section>

        {payloadError ? <p className="error-text n3-internals-dialog__error">{payloadError}</p> : null}

        <div className="dialog-card__actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>

      {noteTarget ? (
        <div className="dialog-backdrop n3-note-backdrop" onClick={() => setNoteTarget(null)}>
          <div className="dialog-card n3-note-dialog" onClick={(event) => event.stopPropagation()}>
            <header className="dialog-card__header">
              <h2><FilePenLine size={16} /> Edit note</h2>
            </header>
            <textarea
              rows={6}
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="Add implementation notes for this row"
            />
            <div className="dialog-card__actions">
              <button type="button" onClick={() => setNoteTarget(null)}>Cancel</button>
              <button type="button" className="btn--primary" onClick={applyNote}>Save note</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
