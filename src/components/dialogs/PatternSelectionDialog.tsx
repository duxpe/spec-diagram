import { FormEvent, useEffect, useState } from 'react'
import { buildWorkspaceBrief, getWorkspaceBriefDraft } from '@/domain/semantics/meaning-capture'
import { ArchitecturePattern, Workspace } from '@/domain/models/workspace'
import { PATTERN_CATALOG, PatternDefinition } from '@/domain/semantics/pattern-catalog'

interface PatternSelectionDialogProps {
  open: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  initialWorkspace?: Workspace
  onSubmit: (
    name: string,
    description: string | undefined,
    pattern: ArchitecturePattern,
    brief?: Workspace['brief']
  ) => void
}

const PATTERNS: PatternDefinition[] = Object.values(PATTERN_CATALOG)

export function PatternSelectionDialog({
  open,
  onClose,
  mode = 'create',
  initialWorkspace,
  onSubmit
}: PatternSelectionDialogProps): JSX.Element | null {
  const initialBrief = getWorkspaceBriefDraft(initialWorkspace?.brief)
  const [name, setName] = useState(initialWorkspace?.name ?? '')
  const [description, setDescription] = useState(initialWorkspace?.description ?? '')
  const [selectedPattern, setSelectedPattern] = useState<ArchitecturePattern | null>(
    initialWorkspace?.architecturePattern ?? null
  )
  const [goal, setGoal] = useState(initialBrief.goal)
  const [context, setContext] = useState(initialBrief.context)
  const [scopeIn, setScopeIn] = useState(initialBrief.scopeIn)
  const [scopeOut, setScopeOut] = useState(initialBrief.scopeOut)
  const [constraints, setConstraints] = useState(initialBrief.constraints)
  const [nfrs, setNfrs] = useState(initialBrief.nfrs)
  const [globalDecisions, setGlobalDecisions] = useState(initialBrief.globalDecisions)
  const [isBriefOpen, setIsBriefOpen] = useState(Boolean(initialWorkspace?.brief))

  useEffect(() => {
    setName(initialWorkspace?.name ?? '')
    setDescription(initialWorkspace?.description ?? '')
    setSelectedPattern(initialWorkspace?.architecturePattern ?? null)
    setGoal(initialBrief.goal)
    setContext(initialBrief.context)
    setScopeIn(initialBrief.scopeIn)
    setScopeOut(initialBrief.scopeOut)
    setConstraints(initialBrief.constraints)
    setNfrs(initialBrief.nfrs)
    setGlobalDecisions(initialBrief.globalDecisions)
    setIsBriefOpen(Boolean(initialWorkspace?.brief))
  }, [
    initialBrief.constraints,
    initialBrief.context,
    initialBrief.globalDecisions,
    initialBrief.goal,
    initialBrief.nfrs,
    initialBrief.scopeIn,
    initialBrief.scopeOut,
    initialWorkspace
  ])

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || !selectedPattern) return

    onSubmit(
      trimmedName,
      description.trim() || undefined,
      selectedPattern,
      buildWorkspaceBrief({
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
    setIsBriefOpen(false)
  }

  const handleClose = (): void => {
    setName(initialWorkspace?.name ?? '')
    setDescription(initialWorkspace?.description ?? '')
    setSelectedPattern(initialWorkspace?.architecturePattern ?? null)
    setGoal(initialBrief.goal)
    setContext(initialBrief.context)
    setScopeIn(initialBrief.scopeIn)
    setScopeOut(initialBrief.scopeOut)
    setConstraints(initialBrief.constraints)
    setNfrs(initialBrief.nfrs)
    setGlobalDecisions(initialBrief.globalDecisions)
    setIsBriefOpen(Boolean(initialWorkspace?.brief))
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
          <div className="pattern-dialog__form-fields">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="pattern-dialog__brief-toggle"
            onClick={() => setIsBriefOpen((value) => !value)}
          >
            {isBriefOpen ? 'Hide spec quality fields' : 'Improve spec quality'}
          </button>

          {isBriefOpen ? (
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
              <label>
                In scope
                <textarea
                  rows={2}
                  placeholder="One scope item per line"
                  value={scopeIn}
                  onChange={(event) => setScopeIn(event.target.value)}
                />
              </label>
              <label>
                Out of scope
                <textarea
                  rows={2}
                  placeholder="One exclusion per line"
                  value={scopeOut}
                  onChange={(event) => setScopeOut(event.target.value)}
                />
              </label>
              <label>
                Constraints
                <textarea
                  rows={2}
                  placeholder="One constraint per line"
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                />
              </label>
              <label>
                Priority NFRs
                <textarea
                  rows={2}
                  placeholder="One non-functional priority per line"
                  value={nfrs}
                  onChange={(event) => setNfrs(event.target.value)}
                />
              </label>
              <label>
                Global decisions
                <textarea
                  rows={2}
                  placeholder="One decision or assumption per line"
                  value={globalDecisions}
                  onChange={(event) => setGlobalDecisions(event.target.value)}
                />
              </label>
            </div>
          ) : null}

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
              type="submit"
              className="btn--primary"
              disabled={!name.trim() || !selectedPattern}
              data-ui-log={`Pattern selection – ${mode === 'edit' ? 'Save project' : 'Create project'}`}
            >
              {mode === 'edit' ? 'Save project' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
