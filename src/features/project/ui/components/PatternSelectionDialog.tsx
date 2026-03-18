import { FormEvent, useEffect, useState } from 'react'
import { buildProjectBrief, getProjectBriefDraft } from '@/domain/semantics/meaning-capture'
import { ArchitecturePattern, Project } from '@/domain/models/project'
import { PATTERN_CATALOG, PatternDefinition } from '@/domain/semantics/pattern-catalog'
import { ListInput } from '@/shared/ui/inputs/ListInput'

interface PatternSelectionDialogProps {
  open: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  initialProject?: Project
  onSubmit: (
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern | undefined,
    brief?: Project['brief']
  ) => void
}

const PATTERNS: PatternDefinition[] = Object.values(PATTERN_CATALOG)

function parseListDraft(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function joinListDraft(items?: string[]): string {
  return items?.join('\n') ?? ''
}

function getPatternName(pattern?: ArchitecturePattern): string {
  if (!pattern) return 'Custom system'
  return PATTERN_CATALOG[pattern]?.name ?? 'Custom system'
}

export function PatternSelectionDialog({
  open,
  onClose,
  mode = 'create',
  initialProject,
  onSubmit
}: PatternSelectionDialogProps): JSX.Element | null {
  const isEditMode = mode === 'edit'
  const initialBrief = getProjectBriefDraft(initialProject?.brief)
  const [name, setName] = useState(initialProject?.name ?? '')
  const [description, setDescription] = useState(initialProject?.description ?? '')
  const [selectedPattern, setSelectedPattern] = useState<ArchitecturePattern | null>(
    initialProject?.architecturePattern ?? null
  )
  const [goal, setGoal] = useState(initialBrief.goal)
  const [context, setContext] = useState(initialBrief.context)
  const [scopeIn, setScopeIn] = useState(initialBrief.scopeIn)
  const [scopeOut, setScopeOut] = useState(initialBrief.scopeOut)
  const [constraints, setConstraints] = useState(initialBrief.constraints)
  const [nfrs, setNfrs] = useState(initialBrief.nfrs)
  const [globalDecisions, setGlobalDecisions] = useState(initialBrief.globalDecisions)
  const [step, setStep] = useState<1 | 2>(1)

  useEffect(() => {
    setName(initialProject?.name ?? '')
    setDescription(initialProject?.description ?? '')
    setSelectedPattern(initialProject?.architecturePattern ?? null)
    setGoal(initialBrief.goal)
    setContext(initialBrief.context)
    setScopeIn(initialBrief.scopeIn)
    setScopeOut(initialBrief.scopeOut)
    setConstraints(initialBrief.constraints)
    setNfrs(initialBrief.nfrs)
    setGlobalDecisions(initialBrief.globalDecisions)
    setStep(1)
  }, [
    initialBrief.constraints,
    initialBrief.context,
    initialBrief.globalDecisions,
    initialBrief.goal,
    initialBrief.nfrs,
    initialBrief.scopeIn,
    initialBrief.scopeOut,
    initialProject
  ])

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    const patternForSubmit = isEditMode
      ? initialProject?.architecturePattern
      : (selectedPattern ?? undefined)
    if (!isEditMode && !patternForSubmit) return

    onSubmit(
      trimmedName,
      description.trim() || undefined,
      patternForSubmit,
      buildProjectBrief({
        goal,
        context,
        scopeIn,
        scopeOut,
        constraints,
        nfrs,
        globalDecisions
      })
    )
    setName('')
    setDescription('')
    setSelectedPattern(null)
    setGoal('')
    setContext('')
    setScopeIn('')
    setScopeOut('')
    setConstraints('')
    setNfrs('')
    setGlobalDecisions('')
    setStep(1)
  }

  const handleClose = (): void => {
    setName(initialProject?.name ?? '')
    setDescription(initialProject?.description ?? '')
    setSelectedPattern(initialProject?.architecturePattern ?? null)
    setGoal(initialBrief.goal)
    setContext(initialBrief.context)
    setScopeIn(initialBrief.scopeIn)
    setScopeOut(initialBrief.scopeOut)
    setConstraints(initialBrief.constraints)
    setNfrs(initialBrief.nfrs)
    setGlobalDecisions(initialBrief.globalDecisions)
    setStep(1)
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div
        className="dialog-card pattern-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-card__header">
          <h2>
            {mode === 'edit'
              ? 'Edit project framing'
              : 'Choose the architectural pattern for this project'}
          </h2>
          <p className="pattern-dialog__subtitle">
            This choice defines the suggested blocks and connections on the main board.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="pattern-dialog__form-fields">
                <label>
                  Project Name
                  <input
                    type="text"
                    placeholder="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Project Description
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                {isEditMode ? (
                  <label>
                    Project Type
                    <input
                      type="text"
                      value={getPatternName(initialProject?.architecturePattern)}
                      readOnly
                      disabled
                      aria-label="Project type"
                    />
                  </label>
                ) : null}
              </div>

              <div className="pattern-dialog__brief">
                <label>
                  Project goal
                  <textarea
                    rows={2}
                    placeholder="What the project is trying to achieve"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  />
                </label>
                <label>
                  Context
                  <textarea
                    rows={2}
                    placeholder="Relevant product or business context"
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                  />
                </label>
                <ListInput
                  id="pattern-scope-in"
                  label="In scope"
                  items={parseListDraft(scopeIn)}
                  placeholder="Describe a scope item"
                  onChange={(items) => setScopeIn(joinListDraft(items))}
                />
                <ListInput
                  id="pattern-scope-out"
                  label="Out of scope"
                  items={parseListDraft(scopeOut)}
                  placeholder="Describe an exclusion"
                  onChange={(items) => setScopeOut(joinListDraft(items))}
                />
                <ListInput
                  id="pattern-constraints"
                  label="Constraints"
                  items={parseListDraft(constraints)}
                  placeholder="Describe a constraint"
                  onChange={(items) => setConstraints(joinListDraft(items))}
                />
                <ListInput
                  id="pattern-nfrs"
                  label="Priority NFRs"
                  items={parseListDraft(nfrs)}
                  placeholder="Describe a non-functional priority"
                  onChange={(items) => setNfrs(joinListDraft(items))}
                />
                <ListInput
                  id="pattern-global-decisions"
                  label="Global decisions"
                  items={parseListDraft(globalDecisions)}
                  placeholder="Describe a decision or assumption"
                  onChange={(items) => setGlobalDecisions(joinListDraft(items))}
                />
              </div>

              <div className="dialog-card__actions">
                <button type="button" onClick={handleClose} data-ui-log="Pattern selection – Cancel">
                  Cancel
                </button>
                {isEditMode ? (
                  <button
                    type="submit"
                    className="btn--primary"
                    disabled={!name.trim()}
                    data-ui-log="Pattern selection – Save project"
                  >
                    Save project
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn--primary"
                    onClick={() => {
                      if (name.trim()) {
                        setStep(2)
                      }
                    }}
                    disabled={!name.trim()}
                    data-ui-log="Pattern selection – Next: Pattern choice"
                  >
                    Next
                  </button>
                )}
              </div>
            </>
          )}

          {!isEditMode && step === 2 && (
            <>
              <div className="pattern-dialog__grid">
                {PATTERNS.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    className={`pattern-card${selectedPattern === pattern.id ? ' pattern-card--selected' : ''}`}
                    onClick={() => setSelectedPattern(pattern.id)}
                    data-ui-log={`Pattern selection – Choose ${pattern.name}`}
                  >
                    <span className="pattern-card__name">{pattern.name}</span>
                    <span className="pattern-card__desc">{pattern.description}</span>
                  </button>
                ))}
              </div>

              <div className="dialog-card__actions">
                <button type="button" onClick={handleClose} data-ui-log="Pattern selection – Cancel">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  data-ui-log="Pattern selection – Back to spec quality"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn--primary"
                  disabled={!name.trim() || !selectedPattern}
                  data-ui-log="Pattern selection – Create project"
                >
                  Create project
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
