import type { Dispatch, SetStateAction } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import {
  EMPTY_ATTRIBUTE,
  EMPTY_METHOD,
  type AttributeRow,
  type ClassTab,
  type MethodRow,
  type NoteTarget
} from '@/features/board/ui/components/dialogs/n3-internals-editor/types'
import { moveItem, sanitizeOptional } from '@/features/board/ui/components/dialogs/n3-internals-editor/utils'

interface ClassInternalsSectionProps {
  activeClassTab: ClassTab
  setActiveClassTab: Dispatch<SetStateAction<ClassTab>>
  methods: MethodRow[]
  setMethods: Dispatch<SetStateAction<MethodRow[]>>
  attributes: AttributeRow[]
  setAttributes: Dispatch<SetStateAction<AttributeRow[]>>
  makeLocalId: () => string
  onOpenNoteEditor: (target: NoteTarget) => void
}

export function ClassInternalsSection({
  activeClassTab,
  setActiveClassTab,
  methods,
  setMethods,
  attributes,
  setAttributes,
  makeLocalId,
  onOpenNoteEditor
}: ClassInternalsSectionProps): JSX.Element {
  return (
    <>
      <div className="dialog-tabs" role="tablist" aria-label="Internals tabs">
        <button
          type="button"
          className={activeClassTab === 'methods' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
          onClick={() => setActiveClassTab('methods')}
          data-ui-log="Internals editor – Switch to methods tab"
        >
          Methods
        </button>
        <button
          type="button"
          className={activeClassTab === 'attributes' ? 'dialog-tabs__tab active' : 'dialog-tabs__tab'}
          onClick={() => setActiveClassTab('attributes')}
          data-ui-log="Internals editor – Switch to attributes tab"
        >
          Attributes
        </button>
      </div>

      <section className="n3-internals-dialog__content">
        {activeClassTab === 'methods' ? (
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
                      <button
                        type="button"
                        onClick={() => onOpenNoteEditor({ scope: 'method', localId: row.localId })}
                        data-ui-log={`Internals editor – ${row.note ? 'Edit' : 'Add'} method note`}
                      >
                        {row.note ? 'Edit note' : 'Add note'}
                      </button>
                    </td>
                    <td>
                      <div className="n3-table__actions">
                        <button
                          type="button"
                          onClick={() => setMethods((prev) => moveItem(prev, index, 'up'))}
                          aria-label="Move method up"
                          data-ui-log="Internals editor – Move method up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMethods((prev) => moveItem(prev, index, 'down'))}
                          aria-label="Move method down"
                          data-ui-log="Internals editor – Move method down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMethods((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                          aria-label="Delete method"
                          data-ui-log="Internals editor – Delete method"
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
              onClick={() => setMethods((prev) => [...prev, { ...EMPTY_METHOD, localId: makeLocalId() }])}
              data-ui-log="Internals editor – Add method"
            >
              <Plus size={14} /> Add method
            </button>
          </div>
        ) : null}

        {activeClassTab === 'attributes' ? (
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
                      <button
                        type="button"
                        onClick={() => onOpenNoteEditor({ scope: 'attribute', localId: row.localId })}
                        data-ui-log={`Internals editor – ${row.note ? 'Edit' : 'Add'} attribute note`}
                      >
                        {row.note ? 'Edit note' : 'Add note'}
                      </button>
                    </td>
                    <td>
                      <div className="n3-table__actions">
                        <button
                          type="button"
                          onClick={() => setAttributes((prev) => moveItem(prev, index, 'up'))}
                          aria-label="Move attribute up"
                          data-ui-log="Internals editor – Move attribute up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttributes((prev) => moveItem(prev, index, 'down'))}
                          aria-label="Move attribute down"
                          data-ui-log="Internals editor – Move attribute down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttributes((prev) => prev.filter((entry) => entry.localId !== row.localId))}
                          aria-label="Delete attribute"
                          data-ui-log="Internals editor – Delete attribute"
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
              onClick={() => setAttributes((prev) => [...prev, { ...EMPTY_ATTRIBUTE, localId: makeLocalId() }])}
              data-ui-log="Internals editor – Add attribute"
            >
              <Plus size={14} /> Add attribute
            </button>
          </div>
        ) : null}
      </section>
    </>
  )
}
