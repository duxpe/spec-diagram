import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { NodeAppearance } from '@/domain/models/node-appearance'
import { nodeAppearanceSchema } from '@/domain/schemas/node-appearance.schema'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import {
  createResetAppearance,
  getCloudServiceById,
  getCloudServiceOptions,
  getProviderLabel,
  resolveNodeVisual
} from '@/domain/semantics/node-visual-catalog'
import {
  applyMeaningToNodeData,
  buildNodeMeaning,
  getDefaultNodeMeaningDraft,
  getNodeMeaningFields,
  type NodeMeaningDraft
} from '@/domain/semantics/meaning-capture'
import { useUiStore } from '@/features/board/model/ui-store'
import { AdvancedSection } from '@/features/board/ui/components/inspector/node-inspector/AdvancedSection'
import { AppearanceDialog } from '@/features/board/ui/components/inspector/node-inspector/AppearanceDialog'
import { AppearanceSummary } from '@/features/board/ui/components/inspector/node-inspector/AppearanceSummary'
import {
  FieldError,
  InspectorSection
} from '@/features/board/ui/components/inspector/node-inspector/InspectorPrimitives'
import { InspectorActions } from '@/features/board/ui/components/inspector/node-inspector/InspectorActions'
import { MeaningSection } from '@/features/board/ui/components/inspector/node-inspector/MeaningSection'
import { TechnicalDetailsForm } from '@/features/board/ui/components/inspector/node-inspector/TechnicalDetailsForm'
import type { NodeInspectorProps } from '@/features/board/ui/components/inspector/node-inspector/types'
import { getBehaviorPrompts } from '@/features/board/ui/components/inspector/node-inspector/utils'
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
  const [iconProviderTab, setIconProviderTab] = useState<'none' | 'aws' | 'azure' | 'gcp'>('none')
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
    const validatesTypedPayload = node.level === 'N1' || node.level === 'N2'
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
    if (
      nextAppearance.provider !== 'aws' &&
      nextAppearance.provider !== 'azure' &&
      nextAppearance.provider !== 'gcp'
    ) {
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
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
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
  const behaviorPrompts = getBehaviorPrompts(node.type, draftData)
  return (
    <div className="node-inspector">
      <MeaningSection
        node={node}
        parentContext={parentContext}
        draftTitle={draftTitle}
        titleError={titleError}
        onTitleChange={handleTitleChange}
        meaningFields={meaningFields}
        meaningCompletion={meaningCompletion}
        draftMeaning={draftMeaning}
        syncNodeMeaning={syncNodeMeaning}
      />
      <InspectorSection title="Technical details" summary="Structured implementation fields">
        <TechnicalDetailsForm
          nodeType={node.type}
          draftData={draftData}
          fieldErrorByName={fieldErrorByName}
          syncNodeData={syncNodeData}
        />
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
      <AppearanceSummary
        iconId={resolvedVisual.icon}
        appearanceProviderSummary={appearanceProviderSummary}
        onOpenAppearanceDialog={openAppearanceDialog}
      />
      <AdvancedSection
        nodeId={node.id}
        roundedWidth={roundedWidth}
        roundedHeight={roundedHeight}
        onUpdateNode={onUpdateNode}
      />
      <InspectorActions node={node} onEditInternals={onEditInternals} onOpenDetail={onOpenDetail} />
      <AppearanceDialog
        open={isAppearanceDialogOpen}
        portalContainer={portalContainer}
        resolvedVisual={resolvedVisual}
        appearanceProviderSummary={appearanceProviderSummary}
        appearanceTab={appearanceTab}
        setAppearanceTab={setAppearanceTab}
        iconSearch={iconSearch}
        setIconSearch={setIconSearch}
        iconProviderTab={iconProviderTab}
        setIconProviderTab={setIconProviderTab}
        appearanceError={appearanceError}
        onClose={closeAppearanceDialog}
        onReset={handleResetAppearance}
        syncNodeAppearance={syncNodeAppearance}
      />
      <FieldError message={payloadErrors[0]?.message} />
    </div>
  )
}
