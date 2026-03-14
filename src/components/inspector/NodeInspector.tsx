import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Palette, X } from 'lucide-react'
import { Icon } from '@iconify/react'
import { GenericNodeIcon } from '@/components/icons/semantic-icons'
import { ListInput } from '@/components/inputs/ListInput'
import { NodeAppearance, VisualProvider } from '@/domain/models/node-appearance'
import { SemanticNode } from '@/domain/models/semantic-node'
import { nodeAppearanceSchema } from '@/domain/schemas/node-appearance.schema'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { canOpenDetail } from '@/domain/semantics/semantic-catalog'
import {
  createResetAppearance,
  getAccentOptions,
  getCloudServiceById,
  getCloudServiceOptions,
  getGenericIconOptions,
  getProviderLabel,
  getProviderOptions,
  getShapeOptions,
  resolveNodeVisual
} from '@/domain/semantics/node-visual-catalog'
import {
  applyMeaningToNodeData,
  buildNodeMeaning,
  getDefaultNodeMeaningDraft,
  getNodeMeaningFields,
  type NodeMeaningDraft
} from '@/domain/semantics/meaning-capture'
import { useUiStore } from '@/state/ui-store'

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
  onEditInternals?: (nodeId: string) => void
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function parseListText(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function FieldError({ message }: { message?: string }): JSX.Element | null {
  if (!message) return null
  return <p className="field-error">{message}</p>
}

interface InspectorSectionProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}

function InspectorSection({
  title,
  summary,
  defaultOpen = false,
  children
}: InspectorSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'
  const panelId = `inspector-section-${slug}`

  return (
    <section className="inspector-section">
      <button
        type="button"
        className="inspector-section__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${panelId}-panel`}
        data-ui-log={`Inspector section – Toggle ${title}`}
      >
        <div className="inspector-section__toggle-main">
          <span className="inspector-section__title">{title}</span>
          {summary ? <span className="inspector-section__summary">{summary}</span> : null}
        </div>
        <span className="inspector-section__indicator" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        id={`${panelId}-panel`}
        className={`inspector-section__panel ${isOpen ? 'is-open' : ''}`}
      >
        {children}
      </div>
    </section>
  )
}

export function NodeInspector({
  node,
  parentContext,
  onUpdateNode,
  onOpenDetail,
  onEditInternals
}: NodeInspectorProps): JSX.Element {
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMeaning, setDraftMeaning] = useState<NodeMeaningDraft>(
    getDefaultNodeMeaningDraft('N1', 'system', '')
  )
  const [draftData, setDraftData] = useState<Record<string, unknown>>({})
  const [draftAppearance, setDraftAppearance] = useState<NodeAppearance>({})
  const [iconSearch, setIconSearch] = useState('')
  const [iconProviderTab, setIconProviderTab] = useState<VisualProvider>('none')
  const [appearanceTab, setAppearanceTab] = useState<'visual' | 'icon' | 'extras'>('visual')
  const [titleError, setTitleError] = useState<string>()
  const [payloadErrors, setPayloadErrors] = useState<Array<{ field: string; message: string }>>([])
  const [appearanceError, setAppearanceError] = useState<string>()
  const [isAppearanceDialogOpen, setIsAppearanceDialogOpen] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const appearanceDialogNodeId = useUiStore((state) => state.appearanceDialogNodeId)
  const setAppearanceDialogNodeId = useUiStore((state) => state.setAppearanceDialogNodeId)

  useEffect(() => {
    if (!node) {
      setDraftTitle('')
      setDraftMeaning(getDefaultNodeMeaningDraft('N1', 'system', ''))
      setDraftData({})
      setDraftAppearance({})
      setIconSearch('')
      setIconProviderTab('none')
      setTitleError(undefined)
      setPayloadErrors([])
      setAppearanceError(undefined)
      return
    }

    setDraftTitle(node.title)
    setDraftMeaning(
      getDefaultNodeMeaningDraft(node.level, node.type, node.title, node.patternRole, node.meaning)
    )
    setDraftData(node.data)
    setDraftAppearance(node.appearance ?? {})
    setIconProviderTab(node.appearance?.provider ?? 'none')
    setTitleError(undefined)
    const validatesTypedPayload = node.level === 'N1' || node.level === 'N2' || node.level === 'N3'
    setPayloadErrors(validatesTypedPayload ? getPayloadIssuesForNodeType(node.type, node.data) : [])
    setAppearanceError(undefined)
  }, [node])

  const openAppearanceDialog = useCallback((): void => {
    if (!node) return
    setAppearanceDialogNodeId(node.id)
  }, [node, setAppearanceDialogNodeId])

  const closeAppearanceDialog = useCallback((): void => {
    setAppearanceDialogNodeId(undefined)
  }, [setAppearanceDialogNodeId])

  useEffect(() => {
    if (!node) {
      setIsAppearanceDialogOpen(false)
      closeAppearanceDialog()
      return
    }

    setIsAppearanceDialogOpen(appearanceDialogNodeId === node.id)
  }, [appearanceDialogNodeId, node, closeAppearanceDialog])

  useEffect(() => {
    if (isAppearanceDialogOpen) {
      setAppearanceTab('visual')
    }
  }, [isAppearanceDialogOpen])

  useEffect(() => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    setPortalContainer(container)

    return () => {
      document.body.removeChild(container)
    }
  }, [])

  useEffect(() => {
    if (!isAppearanceDialogOpen) return

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeAppearanceDialog()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isAppearanceDialogOpen, closeAppearanceDialog])

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
    return <div className="node-inspector">Select a node to edit properties.</div>
  }

  const roundedWidth = Math.round(node.width)
  const roundedHeight = Math.round(node.height)
  const meaningFields = getNodeMeaningFields(node.level, node.type)
  const resolvedVisual = resolveNodeVisual({ type: node.type, appearance: draftAppearance })
  const sizeSummary = `${roundedWidth} × ${roundedHeight} px`
  const providerServiceOptions = getCloudServiceOptions(resolvedVisual.provider)
  const genericIconOptions = getGenericIconOptions()
  const cloudIconOptions = iconProviderTab === 'none' ? [] : getCloudServiceOptions(iconProviderTab)

  const filteredGenericIcons = genericIconOptions.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.trim().toLowerCase())
  )
  const filteredCloudIcons = cloudIconOptions.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.trim().toLowerCase())
  )

  const appearanceProviderSummary = resolvedVisual.providerService
    ? `${getProviderLabel(resolvedVisual.provider)} / ${
        getCloudServiceById(resolvedVisual.providerService)?.label ?? 'Custom'
      }`
    : `${getProviderLabel(resolvedVisual.provider)} / Generic icon`

  const syncNodeData = (patch: Record<string, unknown>): void => {
    const nextData = { ...draftData, ...patch }
    setDraftData(nextData)

    const issues = getPayloadIssuesForNodeType(node.type, nextData)
    setPayloadErrors(issues)
    if (issues.length > 0) return

    onUpdateNode(node.id, { data: nextData })
  }

  const syncNodeMeaning = (patch: Partial<NodeMeaningDraft>): void => {
    const nextDraft = { ...draftMeaning, ...patch }
    setDraftMeaning(nextDraft)
    const nextMeaning = buildNodeMeaning(nextDraft)
    const nextData = applyMeaningToNodeData(node.type, draftData, nextMeaning, nextDraft)
    setDraftData(nextData)

    const issues = getPayloadIssuesForNodeType(node.type, nextData)
    setPayloadErrors(issues)

    onUpdateNode(node.id, {
      meaning: nextMeaning,
      description: nextDraft.summary.trim() || nextMeaning.purpose || undefined,
      ...(issues.length === 0 ? { data: nextData } : {})
    })
  }

  const syncNodeAppearance = (patch: NodeAppearance): void => {
    const nextAppearance: NodeAppearance = {
      ...draftAppearance,
      ...patch
    }

    if (nextAppearance.provider !== 'aws' && nextAppearance.provider !== 'azure' && nextAppearance.provider !== 'gcp') {
      nextAppearance.providerService = undefined
    } else if (
      nextAppearance.providerService &&
      !getCloudServiceOptions(nextAppearance.provider).some(
        (service) => service.id === nextAppearance.providerService
      )
    ) {
      nextAppearance.providerService = undefined
    }

    const parsed = nodeAppearanceSchema.safeParse(nextAppearance)
    setDraftAppearance(nextAppearance)
    if (!parsed.success) {
      setAppearanceError(parsed.error.issues[0]?.message ?? 'Invalid appearance')
      return
    }

    setAppearanceError(undefined)
    onUpdateNode(node.id, { appearance: parsed.data })
  }

  const handleResetAppearance = (): void => {
    const resetValue = createResetAppearance()
    setDraftAppearance(resetValue)
    setAppearanceError(undefined)
    onUpdateNode(node.id, { appearance: undefined })
  }

  const handleTitleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const nextTitle = event.target.value
    setDraftTitle(nextTitle)

    if (nextTitle.trim().length === 0) {
      setTitleError('Title is required')
      return
    }

    setTitleError(undefined)
    onUpdateNode(node.id, { title: nextTitle })
  }

  const meaningCompletion = meaningFields.reduce((count, field) => {
    const value = draftMeaning[field.key]
    return typeof value === 'string' && value.trim().length > 0 ? count + 1 : count
  }, 0)

  const behaviorPrompts = (() => {
    switch (node.type) {
      case 'api_contract':
        return ['constraints', 'errorCases']
      case 'method':
        return ['preconditions', 'postconditions', 'errorCases', 'sideEffects']
      case 'attribute':
        return ['invariants']
      case 'class':
        return ['invariants']
      default:
        return []
    }
  })().filter((key) => {
    const value = draftData[key]
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'string') return value.trim().length === 0
    return value === undefined
  })

  const renderTypedDataForm = (): JSX.Element | null => {
    switch (node.type) {
      case 'system':
        return (
          <>
            <ListInput
              id="node-assumptions"
              label="Assumptions"
              items={asStringList(draftData.assumptions)}
              onChange={(items) => syncNodeData({ assumptions: items })}
            />
          </>
        )
      case 'container_service':
        return (
          <>
            <ListInput
              id="node-technologies"
              label="Technologies"
              items={asStringList(draftData.technologies)}
              onChange={(items) => syncNodeData({ technologies: items })}
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
            <ListInput
              id="node-class-stereotypes"
              label="Stereotypes"
              items={asStringList(draftData.stereotypes)}
              onChange={(items) => syncNodeData({ stereotypes: items })}
            />

            <ListInput
              id="node-class-exposes-methods"
              label="Exposes methods summary"
              items={asStringList(draftData.exposesMethodsSummary)}
              onChange={(items) => syncNodeData({ exposesMethodsSummary: items })}
            />

            <ListInput
              id="node-class-owns-attributes"
              label="Owns attributes summary"
              items={asStringList(draftData.ownsAttributesSummary)}
              onChange={(items) => syncNodeData({ ownsAttributesSummary: items })}
            />

            <ListInput
              id="node-class-invariants"
              label="Invariants"
              items={asStringList(draftData.invariants)}
              onChange={(items) => syncNodeData({ invariants: items })}
            />
          </>
        )
      case 'interface':
        return (
          <>
            <ListInput
              id="node-interface-operations"
              label="Exposed operations summary"
              items={asStringList(draftData.exposedOperationsSummary)}
              onChange={(items) => syncNodeData({ exposedOperationsSummary: items })}
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

            <ListInput
              id="node-contract-error-cases"
              label="Error cases"
              items={asStringList(draftData.errorCases)}
              onChange={(items) => syncNodeData({ errorCases: items })}
            />
          </>
        )
      case 'method':
        return (
          <>
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

            <ListInput
              id="node-method-side-effects"
              label="Side effects"
              items={asStringList(draftData.sideEffects)}
              onChange={(items) => syncNodeData({ sideEffects: items })}
            />

            <ListInput
              id="node-method-preconditions"
              label="Preconditions"
              items={asStringList(draftData.preconditions)}
              onChange={(items) => syncNodeData({ preconditions: items })}
            />

            <ListInput
              id="node-method-postconditions"
              label="Postconditions"
              items={asStringList(draftData.postconditions)}
              onChange={(items) => syncNodeData({ postconditions: items })}
            />

            <ListInput
              id="node-method-error-cases"
              label="Error cases"
              items={asStringList(draftData.errorCases)}
              onChange={(items) => syncNodeData({ errorCases: items })}
            />
          </>
        )
      case 'attribute':
        return (
          <>
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

            <ListInput
              id="node-attribute-invariants"
              label="Invariants"
              items={asStringList(draftData.invariants)}
              onChange={(items) => syncNodeData({ invariants: items })}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="node-inspector">
      <InspectorSection
        title="Meaning"
        summary={meaningFields.length > 0 ? `${meaningCompletion}/${meaningFields.length} captured` : 'Title only'}
        defaultOpen
      >
        <p className="node-inspector__type">Type: {node.level} · {node.type}</p>
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
          onChange={handleTitleChange}
        />
        <FieldError message={titleError} />

        {meaningFields.length > 0 ? (
          meaningFields.map((field) => {
            if (field.kind === 'list') {
              return (
                <ListInput
                  key={field.key}
                  id={`node-meaning-${field.key}`}
                  label={field.label}
                  items={parseListText(draftMeaning[field.key])}
                  placeholder={field.placeholder}
                  onChange={(items) =>
                    syncNodeMeaning({ [field.key]: (items ?? []).join('\n') })
                  }
                />
              )
            }

            return (
              <div key={field.key}>
                <label htmlFor={`node-meaning-${field.key}`}>{field.label}</label>
                {field.kind === 'textarea' ? (
                  <textarea
                    id={`node-meaning-${field.key}`}
                    rows={field.key === 'purpose' ? 3 : 2}
                    value={draftMeaning[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => syncNodeMeaning({ [field.key]: event.target.value })}
                  />
                ) : (
                  <input
                    id={`node-meaning-${field.key}`}
                    type="text"
                    value={draftMeaning[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => syncNodeMeaning({ [field.key]: event.target.value })}
                  />
                )}
              </div>
            )
          })
        ) : (
          <p className="node-inspector__helper">
            This node stays lightweight. Add the actual note text in technical details.
          </p>
        )}
      </InspectorSection>

      <InspectorSection title="Technical details" summary="Structured implementation fields">
        {renderTypedDataForm()}
      </InspectorSection>

      <InspectorSection
        title="Behavior and rules"
        summary={behaviorPrompts.length > 0 ? `${behaviorPrompts.length} prompts` : 'Covered'}
      >
        {behaviorPrompts.length > 0 ? (
          <div className="node-inspector__prompts">
            {behaviorPrompts.map((prompt) => (
              <span key={prompt} className="node-inspector__prompt-chip">
                Add {prompt.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
            ))}
          </div>
        ) : (
          <p className="node-inspector__helper">Behavior signals are already captured for this node.</p>
        )}
      </InspectorSection>

      <div className="node-appearance-summary">
        <div className="node-appearance-summary__preview" aria-hidden="true">
          <span className="node-appearance-summary__preview-icon">
            <GenericNodeIcon iconId={resolvedVisual.icon} size={18} />
          </span>
        </div>
        <div className="node-appearance-summary__details">
          <p className="node-appearance-summary__title">Aparência</p>
          <p className="node-appearance-summary__provider">{appearanceProviderSummary}</p>
        </div>
        <button
          type="button"
          className="node-appearance-summary__button node-appearance-summary__trigger"
          onClick={openAppearanceDialog}
          aria-label="Editar Aparência"
          data-ui-log="Inspector – Open appearance dialog"
        >
          <Palette size={18} />
        </button>
      </div>

      <InspectorSection title="Advanced / notes" summary={sizeSummary}>
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
      </InspectorSection>


      {node.level === 'N2' && ['class', 'interface', 'api_contract'].includes(node.type) && onEditInternals ? (
        <button
          type="button"
          onClick={() => onEditInternals(node.id)}
          data-ui-log="Inspector – Edit internals"
        >
          Edit internals
        </button>
      ) : null}

      {canOpenDetail(node) ? (
        <button type="button" onClick={() => onOpenDetail(node.id)} data-ui-log="Inspector – Open detail board">
          Open detail
        </button>
      ) : null}

      {portalContainer && isAppearanceDialogOpen && (
        createPortal(
          <div className="dialog-backdrop" onClick={closeAppearanceDialog}>
            <div
              className="dialog-card node-appearance-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Aparência"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="dialog-card__header node-appearance-dialog__header">
                <div className="node-appearance-dialog__header-main">
                  <span className="node-appearance__preview" aria-hidden="true">
                    <span className="node-appearance__preview-icon">
                      <GenericNodeIcon iconId={resolvedVisual.icon} size={18} />
                    </span>
                    <span>
                      {getProviderLabel(resolvedVisual.provider)}
                      {resolvedVisual.providerService
                        ? ` / ${getCloudServiceById(resolvedVisual.providerService)?.label ?? 'Custom'}`
                        : ' / Generic'}
                    </span>
                  </span>
                  <div>
                    <h2>Aparência</h2>
                    <p className="node-appearance__provider-summary">{appearanceProviderSummary}</p>
                  </div>
                </div>
                <div className="node-appearance-dialog__header-actions">
                  <button type="button" onClick={handleResetAppearance} data-ui-log="Inspector – Reset appearance">
                    Reset visual
                  </button>
                  <button
                    type="button"
                    className="node-appearance-dialog__close"
                    onClick={closeAppearanceDialog}
                    aria-label="Close appearance dialog"
                    data-ui-log="Inspector – Close appearance dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="node-appearance node-appearance--dialog">
                <nav className="node-appearance-tablist" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={appearanceTab === 'visual'}
                  className={appearanceTab === 'visual' ? 'is-active' : undefined}
                  onClick={() => setAppearanceTab('visual')}
                  data-ui-log="Inspector appearance – Select Visual tab"
                >
                  Visual
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appearanceTab === 'icon'}
                  className={appearanceTab === 'icon' ? 'is-active' : undefined}
                  onClick={() => setAppearanceTab('icon')}
                  data-ui-log="Inspector appearance – Select Icon tab"
                >
                  Icon
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appearanceTab === 'extras'}
                  className={appearanceTab === 'extras' ? 'is-active' : undefined}
                  onClick={() => setAppearanceTab('extras')}
                  data-ui-log="Inspector appearance – Select Badge tab"
                >
                  Badge
                  </button>
                </nav>
                <div className="node-appearance-tabpanels">
                  <section
                    role="tabpanel"
                    aria-hidden={appearanceTab !== 'visual'}
                    hidden={appearanceTab !== 'visual'}
                    className="node-appearance-tabpanel"
                  >
                    <label htmlFor="node-shape-variant">Shape</label>
                    <select
                      id="node-shape-variant"
                      value={resolvedVisual.shapeVariant}
                      onChange={(event) =>
                        syncNodeAppearance({ shapeVariant: event.target.value as NodeAppearance['shapeVariant'] })
                      }
                    >
                      {getShapeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="node-accent-color">Accent</label>
                    <select
                      id="node-accent-color"
                      value={resolvedVisual.accentColor}
                      onChange={(event) =>
                        syncNodeAppearance({ accentColor: event.target.value as NodeAppearance['accentColor'] })
                      }
                    >
                      {getAccentOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="node-provider-visual">Provider visual</label>
                    <select
                      id="node-provider-visual"
                      value={resolvedVisual.provider}
                      onChange={(event) => {
                        const provider = event.target.value as VisualProvider
                        setIconProviderTab(provider)
                        syncNodeAppearance({ provider, providerService: undefined })
                      }}
                    >
                      {getProviderOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="node-provider-service">Cloud service</label>
                    <select
                      id="node-provider-service"
                      value={resolvedVisual.providerService ?? ''}
                      onChange={(event) =>
                        syncNodeAppearance({
                          providerService: event.target.value
                            ? (event.target.value as NodeAppearance['providerService'])
                            : undefined
                        })
                      }
                      disabled={resolvedVisual.provider === 'none'}
                    >
                      <option value="">Generic icon</option>
                      {providerServiceOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section
                    role="tabpanel"
                    aria-hidden={appearanceTab !== 'icon'}
                    hidden={appearanceTab !== 'icon'}
                    className="node-appearance-tabpanel"
                  >
                    <label htmlFor="node-icon-search">Icon search</label>
                    <input
                      id="node-icon-search"
                      type="search"
                      value={iconSearch}
                      placeholder="Search icons"
                      onChange={(event) => setIconSearch(event.target.value)}
                    />

                    <div className="icon-picker-tabs" role="tablist" aria-label="Icon providers">
                      <button
                        type="button"
                        className={iconProviderTab === 'none' ? 'active' : undefined}
                        onClick={() => setIconProviderTab('none')}
                        data-ui-log="Inspector appearance – Icon provider Generic"
                      >
                        Generic
                      </button>
                      <button
                        type="button"
                        className={iconProviderTab === 'aws' ? 'active' : undefined}
                        onClick={() => setIconProviderTab('aws')}
                        data-ui-log="Inspector appearance – Icon provider AWS"
                      >
                        AWS
                      </button>
                      <button
                        type="button"
                        className={iconProviderTab === 'azure' ? 'active' : undefined}
                        onClick={() => setIconProviderTab('azure')}
                        data-ui-log="Inspector appearance – Icon provider Azure"
                      >
                        Azure
                      </button>
                      <button
                        type="button"
                        className={iconProviderTab === 'gcp' ? 'active' : undefined}
                        onClick={() => setIconProviderTab('gcp')}
                        data-ui-log="Inspector appearance – Icon provider GCP"
                      >
                        GCP
                      </button>
                    </div>

                    {iconProviderTab === 'none' ? (
                      <div className="icon-picker-grid">
                        {filteredGenericIcons.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`icon-picker-card ${resolvedVisual.icon === option.id ? 'selected' : ''}`}
                            onClick={() => syncNodeAppearance({ icon: option.id })}
                            data-ui-log={`Inspector appearance – Choose icon ${option.label}`}
                          >
                            <GenericNodeIcon iconId={option.id} size={16} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="icon-picker-grid">
                        {filteredCloudIcons.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`icon-picker-card ${
                              resolvedVisual.providerService === option.id ? 'selected' : ''
                            }`}
                            onClick={() =>
                              syncNodeAppearance({
                                provider: option.provider,
                                providerService: option.id
                              })
                            }
                            data-ui-log={`Inspector appearance – Choose icon ${option.label}`}
                          >
                            <Icon icon={option.icon} width={16} height={16} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    role="tabpanel"
                    aria-hidden={appearanceTab !== 'extras'}
                    hidden={appearanceTab !== 'extras'}
                    className="node-appearance-tabpanel"
                  >
                    <label htmlFor="node-show-provider-badge">
                      <input
                        id="node-show-provider-badge"
                        type="checkbox"
                        checked={resolvedVisual.showProviderBadge}
                        onChange={(event) => syncNodeAppearance({ showProviderBadge: event.target.checked })}
                      />
                      {' '}Show provider badge
                    </label>
                  </section>
                </div>

                <FieldError message={appearanceError} />
              </div>
            </div>
          </div>,
          portalContainer
        )
      )}
    </div>
  )
}
