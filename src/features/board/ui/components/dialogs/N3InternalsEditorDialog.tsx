import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import type { SemanticNode } from '@/domain/models/semantic-node'
import { getPayloadIssuesForNodeType } from '@/domain/schemas/semantic-node-payload.schema'
import { ClassInternalsSection } from '@/features/board/ui/components/dialogs/n3-internals-editor/ClassInternalsSection'
import { ContractInternalsSection } from '@/features/board/ui/components/dialogs/n3-internals-editor/ContractInternalsSection'
import { NoteEditorDialog } from '@/features/board/ui/components/dialogs/n3-internals-editor/NoteEditorDialog'
import {
  CONTRACT_KINDS,
  type AttributeRow,
  type ClassTab,
  type EndpointRow,
  type InternalsNodeType,
  type MethodRow,
  type NoteTarget
} from '@/features/board/ui/components/dialogs/n3-internals-editor/types'
import {
  asString,
  asStringList,
  buildPayloadForSave,
  sanitizeOptional,
  toAttributeRows,
  toEndpointRows,
  toMethodRows
} from '@/features/board/ui/components/dialogs/n3-internals-editor/utils'

interface N3InternalsEditorDialogProps {
  open: boolean
  node?: SemanticNode
  onClose: () => void
  onSave: (dataPatch: Record<string, unknown>) => void
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
  const [contractInputSummary, setContractInputSummary] = useState<string[]>([])
  const [contractOutputSummary, setContractOutputSummary] = useState<string[]>([])
  const [contractConstraints, setContractConstraints] = useState<string[]>([])
  const [contractErrorCases, setContractErrorCases] = useState<string[]>([])

  const eligible: InternalsNodeType | null =
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
      setContractInputSummary(asStringList(data.inputSummary))
      setContractOutputSummary(asStringList(data.outputSummary))
      setContractConstraints(asStringList(data.constraints))
      setContractErrorCases(asStringList(data.errorCases))
    }
  }, [open, eligible, node])

  const dialogTitle = useMemo(() => {
    if (!node) return 'Edit internals'
    return `Edit internals: ${node.title}`
  }, [node])

  useEscapeKey(onClose, open && Boolean(eligible) && Boolean(node))

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

  const handleSave = (): void => {
    const nextData = buildPayloadForSave({
      eligible,
      nodeData: node.data,
      contractKind,
      contractConsumer,
      contractProvider,
      contractInputSummary,
      contractOutputSummary,
      contractConstraints,
      contractErrorCases,
      methods,
      attributes,
      endpoints
    })
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
            <p className="n3-internals-dialog__subtitle">Structured code-level details for this component.</p>
          </div>
          <button
            type="button"
            className="n3-internals-dialog__close"
            onClick={onClose}
            aria-label="Close internals editor"
            data-ui-log="Internals editor – Close dialog"
          >
            <X size={18} />
          </button>
        </header>

        {eligible === 'api_contract' ? (
          <ContractInternalsSection
            contractKind={contractKind}
            onContractKindChange={setContractKind}
            contractConsumer={contractConsumer}
            onContractConsumerChange={setContractConsumer}
            contractProvider={contractProvider}
            onContractProviderChange={setContractProvider}
            contractInputSummary={contractInputSummary}
            setContractInputSummary={setContractInputSummary}
            contractOutputSummary={contractOutputSummary}
            setContractOutputSummary={setContractOutputSummary}
            contractConstraints={contractConstraints}
            setContractConstraints={setContractConstraints}
            contractErrorCases={contractErrorCases}
            setContractErrorCases={setContractErrorCases}
            endpoints={endpoints}
            setEndpoints={setEndpoints}
            makeLocalId={makeLocalId}
            contractKinds={CONTRACT_KINDS}
            onOpenNoteEditor={openNoteEditor}
          />
        ) : (
          <ClassInternalsSection
            activeClassTab={activeClassTab}
            setActiveClassTab={setActiveClassTab}
            methods={methods}
            setMethods={setMethods}
            attributes={attributes}
            setAttributes={setAttributes}
            makeLocalId={makeLocalId}
            onOpenNoteEditor={openNoteEditor}
          />
        )}

        {payloadError ? <p className="error-text n3-internals-dialog__error">{payloadError}</p> : null}

        <div className="dialog-card__actions">
          <button type="button" onClick={onClose} data-ui-log="Internals editor – Cancel">
            Cancel
          </button>
          <button
            type="button"
            className="btn--primary"
            onClick={handleSave}
            data-ui-log="Internals editor – Save"
          >
            Save
          </button>
        </div>
      </div>

      <NoteEditorDialog
        open={!!noteTarget}
        draftNote={draftNote}
        onDraftNoteChange={setDraftNote}
        onClose={() => setNoteTarget(null)}
        onSave={applyNote}
      />
    </div>
  )
}
