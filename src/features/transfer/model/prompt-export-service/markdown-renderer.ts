import type { ExportPromptType } from '@/domain/models/export'
import {
  firstDefinedText,
  firstMeaningText,
  formatNodeData,
  formatNodes,
  formatRelations,
  listValue,
  projectBriefValue,
  textValue,
  MISSING_TEXT
} from '@/features/transfer/model/prompt-export-service/formatting'
import type { ExportContext } from '@/features/transfer/model/prompt-export-service/types'

function renderN2Blocks(context: ExportContext): string {
  if (context.n2Nodes.length === 0) return '- No internal components registered for this block.'

  return context.n2Nodes
    .map((n2) => {
      const lines = [
        `### ${n2.node.type} - ${textValue(n2.node.title)}`,
        `- Description: ${firstMeaningText(n2.node, ['purpose', 'summary'], [])}`,
        '- Semantic payload:',
        ...formatNodeData(n2.node.data).map((line) => `  ${line}`),
        '- Component relations:',
        ...formatRelations(n2.relations).map((line) => `  ${line}`),
        '- Code-level details:',
        ...formatNodes(n2.n3Nodes).map((line) => `  ${line}`)
      ]

      return lines.join('\n')
    })
    .join('\n\n')
}

function renderN3Details(context: ExportContext): string {
  const withDetails = context.n2Nodes.filter((n2) => n2.n3Nodes.length > 0)
  if (withDetails.length === 0) return '- No code-level details registered.'

  return withDetails
    .map((n2) => {
      const n3Markdown = n2.n3Nodes
        .map((n3) => {
          const lines = [
            `#### ${n3.type} - ${textValue(n3.title)}`,
            `- Description: ${textValue(n3.description)}`,
            '- Semantic payload:',
            ...formatNodeData(n3.data).map((line) => `  ${line}`)
          ]

          return lines.join('\n')
        })
        .join('\n\n')

      return `### Details for ${textValue(n2.node.title)}\n${n3Markdown}`
    })
    .join('\n\n')
}

function renderContractsAndIntegrations(context: ExportContext): string {
  const candidates = context.n2Nodes.filter((entry) =>
    ['interface', 'api_contract'].includes(entry.node.type)
  )

  if (candidates.length === 0) return `- ${MISSING_TEXT}`

  return candidates
    .map((entry) => {
      const summary = firstDefinedText(entry.node.data, [
        'purpose',
        'responsibility',
        'inputSummary',
        'outputSummary'
      ])
      return `- ${entry.node.type}: ${entry.node.title} -> ${firstMeaningText(entry.node, ['purpose'], []) || summary}`
    })
    .join('\n')
}

function renderGlobalDecisions(context: ExportContext): string {
  if (context.globalDecisions.length === 0) return `- ${MISSING_TEXT}`

  return context.globalDecisions
    .map((node) => `- ${node.title}: ${firstDefinedText(node.data, ['decision', 'rationale'])}`)
    .join('\n')
}

function renderGlobalNotes(context: ExportContext): string {
  if (context.globalNotes.length === 0) return `- ${MISSING_TEXT}`

  return context.globalNotes
    .map((node) => {
      const text = firstDefinedText(node.data, ['expectedInputsText', 'expectedOutputsText'])
      return `- ${node.type}: ${node.title} -> ${text}`
    })
    .join('\n')
}

function renderSpecPromptMarkdown(context: ExportContext): string {
  const expectedInputs = firstDefinedText(context.rootNode.data, [
    'expectedInputsText',
    'inputs',
    'inputSummary'
  ])
  const expectedOutputs = firstDefinedText(context.rootNode.data, [
    'expectedOutputsText',
    'outputs',
    'outputSummary'
  ])
  const meaningInputs = context.rootNode.meaning?.inputs?.join('; ') ?? expectedInputs
  const meaningOutputs = context.rootNode.meaning?.outputs?.join('; ') ?? expectedOutputs

  return [
    `# Spec Prompt - ${context.rootNode.title}`,
    '',
    'Generate a detailed and implementable technical spec using only the data below.',
    '',
    'Rules:',
    '- Do not invent missing information.',
    '- Do not mention tools, visual editor, canvas, or modeling process.',
    '- Use only the provided data.',
    '- Record gaps in "Open Questions / Assumptions".',
    '- Respond in Markdown.',
    '',
    '## General project context',
    `- Name: ${textValue(context.project.name)}`,
    `- Goal: ${projectBriefValue(context.project, 'goal', context.project.description)}`,
    `- General context: ${projectBriefValue(context.project, 'context', context.rootBoard.description)}`,
    `- Relevant scope: ${projectBriefValue(context.project, 'scopeIn')}`,
    '- Global constraints:',
    projectBriefValue(context.project, 'constraints'),
    '- Global decisions:',
    projectBriefValue(context.project, 'globalDecisions'),
    '',
    '## Main element',
    `- Type: ${context.rootNode.type}`,
    `- Name: ${textValue(context.rootNode.title)}`,
    `- Description: ${firstMeaningText(context.rootNode, ['purpose', 'summary'], [])}`,
    `- Responsibility: ${firstMeaningText(context.rootNode, ['purpose'], ['responsibility', 'goal', 'purpose', 'decision'])}`,
    `- Expected inputs: ${meaningInputs}`,
    `- Expected outputs: ${meaningOutputs}`,
    '- External relations:',
    ...formatRelations(context.rootRelations),
    '- Associated decisions:',
    renderGlobalDecisions(context),
    '- Notes:',
    renderGlobalNotes(context),
    '',
    '## Internal components',
    renderN2Blocks(context),
    '',
    '## Internal component details',
    renderN3Details(context),
    '',
    '## Contracts, interfaces, and integrations',
    renderContractsAndIntegrations(context),
    '',
    '## Rules and constraints',
    '- Functional rules: Prioritize the rules described in the semantic payload of each block.',
    '- Technical constraints: Use only information explicitly stated in the sections above.',
    '- Domain constraints: Do not extrapolate behavior without evidence from context.',
    '- Non-functional requirements: Flag gaps when details are missing.',
    '',
    '## Required response structure',
    '1. Objective',
    '2. Architectural role',
    '3. Scope',
    '4. Structural view',
    '5. Responsibilities',
    '6. Internal components',
    '7. Classes, interfaces, contracts, and internal details',
    '8. Operational flow',
    '9. Rules and invariants',
    '10. Dependencies and integrations',
    '11. Relevant technical decisions',
    '12. Open Questions / Assumptions',
    '13. Implementation risks',
    '14. Acceptance criteria',
    '15. Operational summary for implementation',
    '16. Suggested implementation sequence'
  ].join('\n')
}

function renderTaskPromptMarkdown(context: ExportContext): string {
  return [
    `# Task Prompt - ${context.rootNode.title}`,
    '',
    'You are a senior software engineer responsible for decomposing a spec into executable tasks.',
    '',
    'Based on the context below, generate technical implementation tasks.',
    '',
    '## Block context',
    `- Name: ${textValue(context.rootNode.title)}`,
    `- Type: ${context.rootNode.type}`,
    `- Goal: ${projectBriefValue(context.project, 'goal', context.project.description)}`,
    `- Responsibilities: ${firstMeaningText(context.rootNode, ['purpose'], ['responsibility', 'goal', 'purpose', 'decision'])}`,
    '',
    '## General project context',
    `- Project: ${textValue(context.project.name)}`,
    `- Root board: ${textValue(context.rootBoard.name)}`,
    `- Additional context: ${projectBriefValue(context.project, 'context', context.rootBoard.description)}`,
    '',
    '## External block relations',
    ...formatRelations(context.rootRelations),
    '',
    '## Implementation structure',
    renderN2Blocks(context),
    '',
    '## Code-level details',
    renderN3Details(context),
    '',
    '## Contracts and integrations',
    renderContractsAndIntegrations(context),
    '',
    '## Constraints and decisions',
    '- Relevant architectural decisions:',
    renderGlobalDecisions(context),
    '- Known dependencies:',
    ...formatRelations(context.rootRelations),
    '- Expected inputs/outputs:',
    renderGlobalNotes(context),
    '- Known error cases:',
    context.n2Nodes
      .flatMap((entry) => entry.n3Nodes)
      .flatMap((entry) => listValue(entry.data.errorCases))
      .map((value) => `- ${value}`)
      .join('\n') || `- ${MISSING_TEXT}`,
    '',
    '## Expected response format',
    '- Separate by epics or logical groups.',
    '- Generate small, objective tasks.',
    '- Include acceptance criteria per task.',
    '- Indicate dependencies between tasks.',
    '- Write in English.',
    '- Do not invent context not provided; use Open Questions / Assumptions for gaps.'
  ].join('\n')
}

export function renderPromptMarkdown(context: ExportContext, exportType: ExportPromptType): string {
  if (exportType === 'task_prompt') return renderTaskPromptMarkdown(context)
  return renderSpecPromptMarkdown(context)
}
