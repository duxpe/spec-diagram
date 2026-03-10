import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { SemanticNode } from '@/domain/models/semantic-node'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { canOpenDetail } from '@/domain/semantics/semantic-catalog'

interface NodeInspectorProps {
  node?: SemanticNode
  parentContext?: {
    immediate: {
      level: 'N1' | 'N2'
      boardName: string
      nodeTitle: string
    }
    ancestor?: {
      level: 'N1' | 'N2'
      boardName: string
      nodeTitle: string
    }
  }
  onUpdateNode: (id: string, patch: Partial<Omit<SemanticNode, 'id' | 'workspaceId' | 'boardId'>>) => void
  onOpenDetail: (nodeId: string) => void
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asListText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value.filter((item): item is string => typeof item === 'string').join('\n')
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function parseListText(value: string): string[] | undefined {
  const items = value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return items.length > 0 ? items : undefined
}

function FieldError({ message }: { message?: string }): JSX.Element | null {
  if (!message) return null
  return <p className="field-error">{message}</p>
}

export function NodeInspector({
  node,
  parentContext,
  onUpdateNode,
  onOpenDetail
}: NodeInspectorProps): JSX.Element {
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftData, setDraftData] = useState<Record<string, unknown>>({})
  const [titleError, setTitleError] = useState<string>()
  const [payloadErrors, setPayloadErrors] = useState<Array<{ field: string; message: string }>>([])

  useEffect(() => {
    if (!node) {
      setDraftTitle('')
      setDraftDescription('')
      setDraftData({})
      setTitleError(undefined)
      setPayloadErrors([])
      return
    }

    setDraftTitle(node.title)
    setDraftDescription(node.description ?? '')
    setDraftData(node.data)
    setTitleError(undefined)
    const validatesTypedPayload = node.level === 'N1' || node.level === 'N2' || node.level === 'N3'
    setPayloadErrors(validatesTypedPayload ? getPayloadIssuesForNodeType(node.type, node.data) : [])
  }, [node])

  const fieldErrorByName = useMemo(() => {
    const map = new Map<string, string>()

    for (const issue of payloadErrors) {
      const key = issue.field.split('.')[0] ?? issue.field
      if (!map.has(key)) {
        map.set(key, issue.message)
      }
    }

    return map
  }, [payloadErrors])

  if (!node) {
    return <div className="panel">Select a node to edit properties.</div>
  }

  const roundedWidth = Math.round(node.width)
  const roundedHeight = Math.round(node.height)

  const syncNodeData = (patch: Record<string, unknown>): void => {
    const nextData = { ...draftData, ...patch }
    setDraftData(nextData)

    const issues = getPayloadIssuesForNodeType(node.type, nextData)
    setPayloadErrors(issues)
    if (issues.length > 0) return

    onUpdateNode(node.id, { data: nextData })
  }

  const handleFieldChange = (
    field: 'title' | 'description',
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    if (field === 'title') {
      const nextTitle = event.target.value
      setDraftTitle(nextTitle)

      if (nextTitle.trim().length === 0) {
        setTitleError('Title is required')
        return
      }

      setTitleError(undefined)
      onUpdateNode(node.id, { title: nextTitle })
      return
    }

    const nextDescription = event.target.value
    setDraftDescription(nextDescription)
    onUpdateNode(node.id, { description: nextDescription || undefined })
  }

  const renderTypedDataForm = (): JSX.Element | null => {
    switch (node.type) {
      case 'system':
        return (
          <>
            <label htmlFor="node-goal">Goal</label>
            <input
              id="node-goal"
              type="text"
              value={asString(draftData.goal)}
              onChange={(event) => syncNodeData({ goal: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('goal')} />

            <label htmlFor="node-primary-responsibilities">Primary responsibilities</label>
            <textarea
              id="node-primary-responsibilities"
              rows={3}
              value={asListText(draftData.primaryResponsibilities)}
              onChange={(event) =>
                syncNodeData({ primaryResponsibilities: parseListText(event.target.value) ?? [] })
              }
            />
            <FieldError message={fieldErrorByName.get('primaryResponsibilities')} />

            <label htmlFor="node-business-context">Business context</label>
            <textarea
              id="node-business-context"
              rows={2}
              value={asString(draftData.businessContext)}
              onChange={(event) =>
                syncNodeData({ businessContext: event.target.value.trim() ? event.target.value : undefined })
              }
            />

            <label htmlFor="node-boundaries">Boundaries (one per line)</label>
            <textarea
              id="node-boundaries"
              rows={2}
              value={asListText(draftData.boundaries)}
              onChange={(event) => syncNodeData({ boundaries: parseListText(event.target.value) })}
            />

            <label htmlFor="node-assumptions">Assumptions (one per line)</label>
            <textarea
              id="node-assumptions"
              rows={2}
              value={asListText(draftData.assumptions)}
              onChange={(event) => syncNodeData({ assumptions: parseListText(event.target.value) })}
            />
          </>
        )
      case 'container_service':
        return (
          <>
            <label htmlFor="node-responsibility">Responsibility</label>
            <input
              id="node-responsibility"
              type="text"
              value={asString(draftData.responsibility)}
              onChange={(event) => syncNodeData({ responsibility: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('responsibility')} />

            <label htmlFor="node-technologies">Technologies (one per line)</label>
            <textarea
              id="node-technologies"
              rows={2}
              value={asListText(draftData.technologies)}
              onChange={(event) => syncNodeData({ technologies: parseListText(event.target.value) })}
            />

            <label htmlFor="node-inputs">Inputs (one per line)</label>
            <textarea
              id="node-inputs"
              rows={2}
              value={asListText(draftData.inputs)}
              onChange={(event) => syncNodeData({ inputs: parseListText(event.target.value) })}
            />

            <label htmlFor="node-outputs">Outputs (one per line)</label>
            <textarea
              id="node-outputs"
              rows={2}
              value={asListText(draftData.outputs)}
              onChange={(event) => syncNodeData({ outputs: parseListText(event.target.value) })}
            />

            <label htmlFor="node-owned-by">Owned by</label>
            <input
              id="node-owned-by"
              type="text"
              value={asString(draftData.ownedBy)}
              onChange={(event) =>
                syncNodeData({ ownedBy: event.target.value.trim() ? event.target.value : undefined })
              }
            />
          </>
        )
      case 'database':
        return (
          <>
            <label htmlFor="node-purpose">Purpose</label>
            <input
              id="node-purpose"
              type="text"
              value={asString(draftData.purpose)}
              onChange={(event) => syncNodeData({ purpose: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('purpose')} />

            <label htmlFor="node-storage-model">Storage model</label>
            <select
              id="node-storage-model"
              value={asString(draftData.storageModel, 'relational')}
              onChange={(event) => syncNodeData({ storageModel: event.target.value })}
            >
              <option value="relational">relational</option>
              <option value="document">document</option>
              <option value="key_value">key_value</option>
              <option value="graph">graph</option>
              <option value="event_store">event_store</option>
              <option value="other">other</option>
            </select>
          </>
        )
      case 'external_system':
        return (
          <>
            <label htmlFor="node-purpose">Purpose</label>
            <input
              id="node-purpose"
              type="text"
              value={asString(draftData.purpose)}
              onChange={(event) => syncNodeData({ purpose: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('purpose')} />

            <label htmlFor="node-interaction-type">Interaction type</label>
            <select
              id="node-interaction-type"
              value={asString(draftData.interactionType, 'unknown')}
              onChange={(event) => syncNodeData({ interactionType: event.target.value })}
            >
              <option value="sync">sync</option>
              <option value="async">async</option>
              <option value="batch">batch</option>
              <option value="manual">manual</option>
              <option value="unknown">unknown</option>
            </select>
          </>
        )
      case 'port':
        return (
          <>
            <label htmlFor="node-direction">Direction</label>
            <select
              id="node-direction"
              value={asString(draftData.direction, 'inbound')}
              onChange={(event) => syncNodeData({ direction: event.target.value })}
            >
              <option value="inbound">inbound</option>
              <option value="outbound">outbound</option>
            </select>
            <FieldError message={fieldErrorByName.get('direction')} />

            <label htmlFor="node-responsibility">Responsibility</label>
            <input
              id="node-responsibility"
              type="text"
              value={asString(draftData.responsibility)}
              onChange={(event) => syncNodeData({ responsibility: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('responsibility')} />

            <label htmlFor="node-protocol">Protocol</label>
            <input
              id="node-protocol"
              type="text"
              value={asString(draftData.protocol)}
              onChange={(event) =>
                syncNodeData({ protocol: event.target.value.trim() ? event.target.value : undefined })
              }
            />
          </>
        )
      case 'adapter':
        return (
          <>
            <label htmlFor="node-responsibility">Responsibility</label>
            <input
              id="node-responsibility"
              type="text"
              value={asString(draftData.responsibility)}
              onChange={(event) => syncNodeData({ responsibility: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('responsibility')} />

            <label htmlFor="node-technology">Technology</label>
            <input
              id="node-technology"
              type="text"
              value={asString(draftData.technology)}
              onChange={(event) =>
                syncNodeData({ technology: event.target.value.trim() ? event.target.value : undefined })
              }
            />

            <label htmlFor="node-external-dependency">External dependency</label>
            <input
              id="node-external-dependency"
              type="text"
              value={asString(draftData.externalDependency)}
              onChange={(event) =>
                syncNodeData({
                  externalDependency: event.target.value.trim() ? event.target.value : undefined
                })
              }
            />
          </>
        )
      case 'decision':
        return (
          <>
            <label htmlFor="node-decision">Decision</label>
            <textarea
              id="node-decision"
              rows={2}
              value={asString(draftData.decision)}
              onChange={(event) => syncNodeData({ decision: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('decision')} />

            <label htmlFor="node-status">Status</label>
            <select
              id="node-status"
              value={asString(draftData.status, 'proposed')}
              onChange={(event) => syncNodeData({ status: event.target.value })}
            >
              <option value="proposed">proposed</option>
              <option value="accepted">accepted</option>
              <option value="deprecated">deprecated</option>
            </select>

            <label htmlFor="node-rationale">Rationale</label>
            <textarea
              id="node-rationale"
              rows={2}
              value={asString(draftData.rationale)}
              onChange={(event) =>
                syncNodeData({ rationale: event.target.value.trim() ? event.target.value : undefined })
              }
            />
          </>
        )
      case 'free_note_input':
        return (
          <>
            <label htmlFor="node-expected-inputs">Expected inputs text</label>
            <textarea
              id="node-expected-inputs"
              rows={3}
              value={asString(draftData.expectedInputsText)}
              onChange={(event) => syncNodeData({ expectedInputsText: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('expectedInputsText')} />
          </>
        )
      case 'free_note_output':
        return (
          <>
            <label htmlFor="node-expected-outputs">Expected outputs text</label>
            <textarea
              id="node-expected-outputs"
              rows={3}
              value={asString(draftData.expectedOutputsText)}
              onChange={(event) => syncNodeData({ expectedOutputsText: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('expectedOutputsText')} />
          </>
        )
      case 'class':
        return (
          <>
            <label htmlFor="node-class-responsibility">Responsibility</label>
            <input
              id="node-class-responsibility"
              type="text"
              value={asString(draftData.responsibility)}
              onChange={(event) => syncNodeData({ responsibility: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('responsibility')} />

            <label htmlFor="node-class-stereotypes">Stereotypes (one per line)</label>
            <textarea
              id="node-class-stereotypes"
              rows={2}
              value={asListText(draftData.stereotypes)}
              onChange={(event) => syncNodeData({ stereotypes: parseListText(event.target.value) })}
            />

            <label htmlFor="node-class-exposes-methods">Exposes methods summary (one per line)</label>
            <textarea
              id="node-class-exposes-methods"
              rows={3}
              value={asListText(draftData.exposesMethodsSummary)}
              onChange={(event) =>
                syncNodeData({ exposesMethodsSummary: parseListText(event.target.value) })
              }
            />

            <label htmlFor="node-class-owns-attributes">Owns attributes summary (one per line)</label>
            <textarea
              id="node-class-owns-attributes"
              rows={3}
              value={asListText(draftData.ownsAttributesSummary)}
              onChange={(event) =>
                syncNodeData({ ownsAttributesSummary: parseListText(event.target.value) })
              }
            />

            <label htmlFor="node-class-invariants">Invariants (one per line)</label>
            <textarea
              id="node-class-invariants"
              rows={2}
              value={asListText(draftData.invariants)}
              onChange={(event) => syncNodeData({ invariants: parseListText(event.target.value) })}
            />
          </>
        )
      case 'interface':
        return (
          <>
            <label htmlFor="node-interface-purpose">Purpose</label>
            <input
              id="node-interface-purpose"
              type="text"
              value={asString(draftData.purpose)}
              onChange={(event) => syncNodeData({ purpose: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('purpose')} />

            <label htmlFor="node-interface-operations">
              Exposed operations summary (one per line)
            </label>
            <textarea
              id="node-interface-operations"
              rows={3}
              value={asListText(draftData.exposedOperationsSummary)}
              onChange={(event) =>
                syncNodeData({ exposedOperationsSummary: parseListText(event.target.value) })
              }
            />

            <label htmlFor="node-interface-notes">Notes (one per line)</label>
            <textarea
              id="node-interface-notes"
              rows={2}
              value={asListText(draftData.notes)}
              onChange={(event) => syncNodeData({ notes: parseListText(event.target.value) })}
            />
          </>
        )
      case 'api_contract':
        return (
          <>
            <label htmlFor="node-contract-kind">Contract kind</label>
            <select
              id="node-contract-kind"
              value={asString(draftData.kind, 'http')}
              onChange={(event) => syncNodeData({ kind: event.target.value })}
            >
              <option value="http">http</option>
              <option value="event">event</option>
              <option value="message">message</option>
              <option value="rpc">rpc</option>
              <option value="other">other</option>
            </select>
            <FieldError message={fieldErrorByName.get('kind')} />

            <label htmlFor="node-contract-consumer">Consumer</label>
            <input
              id="node-contract-consumer"
              type="text"
              value={asString(draftData.consumer)}
              onChange={(event) =>
                syncNodeData({ consumer: event.target.value.trim() ? event.target.value : undefined })
              }
            />

            <label htmlFor="node-contract-provider">Provider</label>
            <input
              id="node-contract-provider"
              type="text"
              value={asString(draftData.provider)}
              onChange={(event) =>
                syncNodeData({ provider: event.target.value.trim() ? event.target.value : undefined })
              }
            />

            <label htmlFor="node-contract-input-summary">Input summary (one per line)</label>
            <textarea
              id="node-contract-input-summary"
              rows={3}
              value={asListText(draftData.inputSummary)}
              onChange={(event) =>
                syncNodeData({ inputSummary: parseListText(event.target.value) ?? [] })
              }
            />
            <FieldError message={fieldErrorByName.get('inputSummary')} />

            <label htmlFor="node-contract-output-summary">Output summary (one per line)</label>
            <textarea
              id="node-contract-output-summary"
              rows={3}
              value={asListText(draftData.outputSummary)}
              onChange={(event) =>
                syncNodeData({ outputSummary: parseListText(event.target.value) ?? [] })
              }
            />
            <FieldError message={fieldErrorByName.get('outputSummary')} />

            <label htmlFor="node-contract-constraints">Constraints (one per line)</label>
            <textarea
              id="node-contract-constraints"
              rows={2}
              value={asListText(draftData.constraints)}
              onChange={(event) => syncNodeData({ constraints: parseListText(event.target.value) })}
            />

            <label htmlFor="node-contract-error-cases">Error cases (one per line)</label>
            <textarea
              id="node-contract-error-cases"
              rows={2}
              value={asListText(draftData.errorCases)}
              onChange={(event) => syncNodeData({ errorCases: parseListText(event.target.value) })}
            />
          </>
        )
      case 'method':
        return (
          <>
            <label htmlFor="node-method-signature">Signature</label>
            <input
              id="node-method-signature"
              type="text"
              value={asString(draftData.signature)}
              onChange={(event) => syncNodeData({ signature: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('signature')} />

            <label htmlFor="node-method-purpose">Purpose</label>
            <textarea
              id="node-method-purpose"
              rows={2}
              value={asString(draftData.purpose)}
              onChange={(event) => syncNodeData({ purpose: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('purpose')} />

            <label htmlFor="node-method-visibility">Visibility</label>
            <select
              id="node-method-visibility"
              value={asString(draftData.visibility, 'public')}
              onChange={(event) => syncNodeData({ visibility: event.target.value })}
            >
              <option value="public">public</option>
              <option value="protected">protected</option>
              <option value="private">private</option>
              <option value="internal">internal</option>
            </select>
            <FieldError message={fieldErrorByName.get('visibility')} />

            <label htmlFor="node-method-async">
              <input
                id="node-method-async"
                type="checkbox"
                checked={asBoolean(draftData.async)}
                onChange={(event) => syncNodeData({ async: event.target.checked })}
              />
              {' '}Async method
            </label>

            <label htmlFor="node-method-inputs">Inputs (one per line)</label>
            <textarea
              id="node-method-inputs"
              rows={2}
              value={asListText(draftData.inputs)}
              onChange={(event) => syncNodeData({ inputs: parseListText(event.target.value) })}
            />

            <label htmlFor="node-method-outputs">Outputs (one per line)</label>
            <textarea
              id="node-method-outputs"
              rows={2}
              value={asListText(draftData.outputs)}
              onChange={(event) => syncNodeData({ outputs: parseListText(event.target.value) })}
            />

            <label htmlFor="node-method-side-effects">Side effects (one per line)</label>
            <textarea
              id="node-method-side-effects"
              rows={2}
              value={asListText(draftData.sideEffects)}
              onChange={(event) => syncNodeData({ sideEffects: parseListText(event.target.value) })}
            />

            <label htmlFor="node-method-preconditions">Preconditions (one per line)</label>
            <textarea
              id="node-method-preconditions"
              rows={2}
              value={asListText(draftData.preconditions)}
              onChange={(event) => syncNodeData({ preconditions: parseListText(event.target.value) })}
            />

            <label htmlFor="node-method-postconditions">Postconditions (one per line)</label>
            <textarea
              id="node-method-postconditions"
              rows={2}
              value={asListText(draftData.postconditions)}
              onChange={(event) => syncNodeData({ postconditions: parseListText(event.target.value) })}
            />

            <label htmlFor="node-method-error-cases">Error cases (one per line)</label>
            <textarea
              id="node-method-error-cases"
              rows={2}
              value={asListText(draftData.errorCases)}
              onChange={(event) => syncNodeData({ errorCases: parseListText(event.target.value) })}
            />
          </>
        )
      case 'attribute':
        return (
          <>
            <label htmlFor="node-attribute-type-signature">Type signature</label>
            <input
              id="node-attribute-type-signature"
              type="text"
              value={asString(draftData.typeSignature)}
              onChange={(event) => syncNodeData({ typeSignature: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('typeSignature')} />

            <label htmlFor="node-attribute-purpose">Purpose</label>
            <textarea
              id="node-attribute-purpose"
              rows={2}
              value={asString(draftData.purpose)}
              onChange={(event) => syncNodeData({ purpose: event.target.value })}
            />
            <FieldError message={fieldErrorByName.get('purpose')} />

            <label htmlFor="node-attribute-visibility">Visibility</label>
            <select
              id="node-attribute-visibility"
              value={asString(draftData.visibility, 'private')}
              onChange={(event) => syncNodeData({ visibility: event.target.value })}
            >
              <option value="public">public</option>
              <option value="protected">protected</option>
              <option value="private">private</option>
              <option value="internal">internal</option>
            </select>
            <FieldError message={fieldErrorByName.get('visibility')} />

            <label htmlFor="node-attribute-required">
              <input
                id="node-attribute-required"
                type="checkbox"
                checked={asBoolean(draftData.required)}
                onChange={(event) => syncNodeData({ required: event.target.checked })}
              />
              {' '}Required
            </label>

            <label htmlFor="node-attribute-default-value">Default value</label>
            <input
              id="node-attribute-default-value"
              type="text"
              value={asString(draftData.defaultValue)}
              onChange={(event) =>
                syncNodeData({
                  defaultValue: event.target.value.trim() ? event.target.value : undefined
                })
              }
            />

            <label htmlFor="node-attribute-invariants">Invariants (one per line)</label>
            <textarea
              id="node-attribute-invariants"
              rows={2}
              value={asListText(draftData.invariants)}
              onChange={(event) => syncNodeData({ invariants: parseListText(event.target.value) })}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="panel node-inspector">
      <h2>Inspector</h2>
      <p className="node-inspector__type">Type: {node.type}</p>
      {parentContext ? (
        <>
          <p className="node-inspector__parent">
            Parent ({parentContext.immediate.level}): {parentContext.immediate.boardName} /{' '}
            {parentContext.immediate.nodeTitle}
          </p>
          {parentContext.ancestor ? (
            <p className="node-inspector__parent">
              Ancestor ({parentContext.ancestor.level}): {parentContext.ancestor.boardName} /{' '}
              {parentContext.ancestor.nodeTitle}
            </p>
          ) : null}
        </>
      ) : null}

      <label htmlFor="node-title">Title</label>
      <input
        id="node-title"
        type="text"
        value={draftTitle}
        onChange={(event) => handleFieldChange('title', event)}
      />
      <FieldError message={titleError} />

      <label htmlFor="node-description">Description</label>
      <textarea
        id="node-description"
        value={draftDescription}
        onChange={(event) => handleFieldChange('description', event)}
      />

      {renderTypedDataForm()}

      <label htmlFor="node-width">Width</label>
      <input
        id="node-width"
        type="number"
        value={roundedWidth}
        min={120}
        onChange={(event) => {
          const rawWidth = Number(event.target.value)
          if (!Number.isFinite(rawWidth) || rawWidth <= 0) return

          const width = Math.round(rawWidth)
          if (width === roundedWidth) return

          onUpdateNode(node.id, { width })
        }}
      />

      <label htmlFor="node-height">Height</label>
      <input
        id="node-height"
        type="number"
        value={roundedHeight}
        min={70}
        onChange={(event) => {
          const rawHeight = Number(event.target.value)
          if (!Number.isFinite(rawHeight) || rawHeight <= 0) return

          const height = Math.round(rawHeight)
          if (height === roundedHeight) return

          onUpdateNode(node.id, { height })
        }}
      />

      {canOpenDetail(node) ? (
        <button type="button" onClick={() => onOpenDetail(node.id)}>
          Open detail
        </button>
      ) : null}
    </div>
  )
}
