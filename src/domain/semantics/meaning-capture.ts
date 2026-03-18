import type { SemanticLevel } from '@/domain/models/board'
import type { SemanticNodeMeaning, SemanticNodeType } from '@/domain/models/semantic-node'
import type { ProjectBrief } from '@/domain/models/project'

export interface MeaningFieldConfig {
  key:
    | 'purpose'
    | 'role'
    | 'summary'
    | 'inputs'
    | 'outputs'
    | 'constraints'
    | 'decisionNote'
    | 'errorNote'
  label: string
  placeholder: string
  kind: 'text' | 'textarea' | 'list'
  required?: boolean
  advanced?: boolean
}

export interface ProjectBriefDraft {
  goal: string
  context: string
  scopeIn: string
  scopeOut: string
  constraints: string
  nfrs: string
  globalDecisions: string
}

export interface NodeMeaningDraft {
  title: string
  purpose: string
  role: string
  summary: string
  inputs: string
  outputs: string
  constraints: string
  decisionNote: string
  errorNote: string
}

const NOTE_NODE_TYPES: SemanticNodeType[] = ['free_note_input', 'free_note_output']

function parseLines(value: string): string[] | undefined {
  const items = value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return items.length > 0 ? items : undefined
}

function asText(value?: string): string {
  return value ?? ''
}

function asLines(value?: string[]): string {
  return value?.join('\n') ?? ''
}

export function getProjectBriefDraft(brief?: ProjectBrief): ProjectBriefDraft {
  return {
    goal: asText(brief?.goal),
    context: asText(brief?.context),
    scopeIn: asLines(brief?.scopeIn),
    scopeOut: asLines(brief?.scopeOut),
    constraints: asLines(brief?.constraints),
    nfrs: asLines(brief?.nfrs),
    globalDecisions: asLines(brief?.globalDecisions)
  }
}

export function buildProjectBrief(draft: ProjectBriefDraft): ProjectBrief | undefined {
  const brief: ProjectBrief = {
    goal: draft.goal.trim() || undefined,
    context: draft.context.trim() || undefined,
    scopeIn: parseLines(draft.scopeIn),
    scopeOut: parseLines(draft.scopeOut),
    constraints: parseLines(draft.constraints),
    nfrs: parseLines(draft.nfrs),
    globalDecisions: parseLines(draft.globalDecisions)
  }

  return Object.values(brief).some((value) => value !== undefined) ? brief : undefined
}

export function getDefaultNodeMeaningDraft(
  level: SemanticLevel,
  type: SemanticNodeType,
  title: string,
  patternRole?: string,
  meaning?: SemanticNodeMeaning
): NodeMeaningDraft {
  return {
    title,
    purpose: asText(meaning?.purpose),
    role: asText(meaning?.role ?? patternRole),
    summary: asText(meaning?.summary),
    inputs: asLines(meaning?.inputs),
    outputs: asLines(meaning?.outputs),
    constraints: asLines(meaning?.constraints),
    decisionNote: asText(meaning?.decisionNote),
    errorNote: asText(meaning?.errorNote)
  }
}

export function buildNodeMeaning(draft: NodeMeaningDraft): SemanticNodeMeaning {
  return {
    purpose: draft.purpose.trim() || undefined,
    role: draft.role.trim() || undefined,
    summary: draft.summary.trim() || undefined,
    inputs: parseLines(draft.inputs),
    outputs: parseLines(draft.outputs),
    constraints: parseLines(draft.constraints),
    decisionNote: draft.decisionNote.trim() || undefined,
    errorNote: draft.errorNote.trim() || undefined
  }
}

export function shouldSkipNodeMeaningCapture(type: SemanticNodeType): boolean {
  return NOTE_NODE_TYPES.includes(type)
}

export function getNodeMeaningFields(
  level: SemanticLevel,
  type: SemanticNodeType
): MeaningFieldConfig[] {
  if (shouldSkipNodeMeaningCapture(type)) {
    return []
  }

  const fields: MeaningFieldConfig[] = [
    {
      key: 'purpose',
      label: 'Purpose',
      placeholder: 'What this element does and why it exists',
      kind: 'textarea',
      required: true
    }
  ]

  if (type === 'decision') {
    fields.push({
      key: 'decisionNote',
      label: 'Decision note',
      placeholder: 'Trade-off or rationale behind this decision',
      kind: 'textarea'
    })
  }

  fields.push({
    key: 'role',
    label: 'Role in system',
    placeholder: 'Optional architectural role',
    kind: 'text'
  })

  if (
    level === 'N1' ||
    type === 'api_contract' ||
    type === 'port' ||
    type === 'adapter'
  ) {
    fields.push(
      {
        key: 'inputs',
        label: 'High-level inputs',
        placeholder: 'Describe an input',
        kind: 'list',
        required: type === 'api_contract'
      },
      {
        key: 'outputs',
        label: 'High-level outputs',
        placeholder: 'Describe an output',
        kind: 'list',
        required: type === 'api_contract'
      }
    )
  }

  if (type === 'class' || type === 'interface') {
    fields.push({
      key: 'summary',
      label: type === 'class' ? 'Responsibilities summary' : 'Exposed capability summary',
      placeholder: 'Optional concise summary',
      kind: 'textarea'
    })
  }

  if (type !== 'decision') {
    fields.push({
      key: 'constraints',
      label: 'Constraints or boundary notes',
      placeholder: 'Describe a constraint',
      kind: 'list',
      advanced: true
    })
  }

  return fields
}

export function applyMeaningToNodeData(
  type: SemanticNodeType,
  data: Record<string, unknown>,
  meaning: SemanticNodeMeaning,
  draft: NodeMeaningDraft
): Record<string, unknown> {
  const nextData = { ...data }

  switch (type) {
    case 'system':
      nextData.goal = meaning.purpose ?? draft.title
      nextData.primaryResponsibilities = meaning.purpose
        ? [meaning.purpose]
        : Array.isArray(nextData.primaryResponsibilities)
          ? nextData.primaryResponsibilities
          : ['Define purpose']
      if (meaning.summary) nextData.businessContext = meaning.summary
      if (meaning.constraints) nextData.boundaries = meaning.constraints
      break
    case 'container_service':
      nextData.responsibility = meaning.purpose ?? draft.title
      if (meaning.inputs) nextData.inputs = meaning.inputs
      if (meaning.outputs) nextData.outputs = meaning.outputs
      break
    case 'database':
    case 'external_system':
      nextData.purpose = meaning.purpose ?? draft.title
      break
    case 'port':
    case 'adapter':
      nextData.responsibility = meaning.purpose ?? draft.title
      if (meaning.inputs) nextData.inputs = meaning.inputs
      if (meaning.outputs) nextData.outputs = meaning.outputs
      break
    case 'decision':
      nextData.decision = meaning.purpose ?? draft.title
      if (meaning.decisionNote) nextData.rationale = meaning.decisionNote
      break
    case 'class':
      nextData.responsibility = meaning.purpose ?? draft.title
      break
    case 'interface':
      nextData.purpose = meaning.purpose ?? draft.title
      if (meaning.summary) nextData.notes = [meaning.summary]
      break
    case 'api_contract':
      nextData.inputSummary = meaning.inputs ?? ['Describe contract input']
      nextData.outputSummary = meaning.outputs ?? ['Describe contract output']
      if (meaning.constraints) nextData.constraints = meaning.constraints
      if (meaning.errorNote) nextData.errorCases = [meaning.errorNote]
      break
    case 'free_note_input':
      nextData.expectedInputsText = meaning.purpose ?? meaning.inputs?.join('; ') ?? draft.title
      break
    case 'free_note_output':
      nextData.expectedOutputsText = meaning.purpose ?? meaning.outputs?.join('; ') ?? draft.title
      break
  }

  return nextData
}
