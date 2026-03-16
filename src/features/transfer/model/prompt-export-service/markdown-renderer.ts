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
  if (context.n2Nodes.length === 0) return '- Nenhum componente N2 registrado para este bloco N1.'

  return context.n2Nodes
    .map((n2) => {
      const lines = [
        `### ${n2.node.type} - ${textValue(n2.node.title)}`,
        `- Descricao: ${firstMeaningText(n2.node, ['purpose', 'summary'], [])}`,
        '- Payload semantico:',
        ...formatNodeData(n2.node.data).map((line) => `  ${line}`),
        '- Relacoes do componente:',
        ...formatRelations(n2.relations).map((line) => `  ${line}`),
        '- Blocos N3:',
        ...formatNodes(n2.n3Nodes).map((line) => `  ${line}`)
      ]

      return lines.join('\n')
    })
    .join('\n\n')
}

function renderN3Details(context: ExportContext): string {
  const withDetails = context.n2Nodes.filter((n2) => n2.n3Nodes.length > 0)
  if (withDetails.length === 0) return '- Nenhum detalhe N3 registrado.'

  return withDetails
    .map((n2) => {
      const n3Markdown = n2.n3Nodes
        .map((n3) => {
          const lines = [
            `#### ${n3.type} - ${textValue(n3.title)}`,
            `- Descricao: ${textValue(n3.description)}`,
            '- Payload semantico:',
            ...formatNodeData(n3.data).map((line) => `  ${line}`)
          ]

          return lines.join('\n')
        })
        .join('\n\n')

      return `### Detalhes de ${textValue(n2.node.title)}\n${n3Markdown}`
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
      return `- ${entry.node.type}: ${entry.node.title} -> ${firstMeaningText(entry.node, ['purpose', 'primaryResponsibility'], []) || summary}`
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
    `# Prompt de Spec - ${context.rootNode.title}`,
    '',
    'Gere uma spec tecnica detalhada e implementavel usando apenas os dados abaixo.',
    '',
    'Regras:',
    '- Nao invente informacoes ausentes.',
    '- Nao mencione ferramentas, editor visual, canvas ou processo de modelagem.',
    '- Use somente os dados fornecidos.',
    '- Registre lacunas em "Open Questions / Assumptions".',
    '- Responda em Markdown.',
    '',
    '## Contexto geral do projeto',
    `- Nome: ${textValue(context.project.name)}`,
    `- Objetivo: ${projectBriefValue(context.project, 'goal', context.project.description)}`,
    `- Contexto geral: ${projectBriefValue(context.project, 'context', context.rootBoard.description)}`,
    `- Escopo relevante: ${projectBriefValue(context.project, 'scopeIn')}`,
    '- Restricoes globais:',
    projectBriefValue(context.project, 'constraints'),
    '- Decisoes globais:',
    projectBriefValue(context.project, 'globalDecisions'),
    '',
    '## Elemento principal',
    `- Tipo: ${context.rootNode.type}`,
    `- Nome: ${textValue(context.rootNode.title)}`,
    `- Descricao: ${firstMeaningText(context.rootNode, ['purpose', 'summary'], [])}`,
    `- Responsabilidade: ${firstMeaningText(context.rootNode, ['primaryResponsibility', 'purpose'], ['responsibility', 'goal', 'purpose', 'decision'])}`,
    `- Entradas esperadas: ${meaningInputs}`,
    `- Saidas esperadas: ${meaningOutputs}`,
    '- Relacoes externas:',
    ...formatRelations(context.rootRelations),
    '- Decisoes associadas:',
    renderGlobalDecisions(context),
    '- Observacoes:',
    renderGlobalNotes(context),
    '',
    '## Componentes internos',
    renderN2Blocks(context),
    '',
    '## Detalhes internos dos componentes',
    renderN3Details(context),
    '',
    '## Contratos, interfaces e integracoes',
    renderContractsAndIntegrations(context),
    '',
    '## Regras e restricoes',
    '- Regras funcionais: Priorize as regras descritas no payload semantico de cada bloco.',
    '- Restricoes tecnicas: Use apenas informacoes explicitadas nas secoes acima.',
    '- Restricoes de dominio: Nao extrapolar comportamento sem evidencia do contexto.',
    '- Requisitos nao funcionais: Apontar lacunas quando nao houver detalhes.',
    '',
    '## Estrutura obrigatoria da resposta',
    '1. Objetivo',
    '2. Papel arquitetural',
    '3. Escopo',
    '4. Visao estrutural',
    '5. Responsabilidades',
    '6. Componentes internos',
    '7. Classes, interfaces, contratos e detalhes internos',
    '8. Fluxo de funcionamento',
    '9. Regras e invariantes',
    '10. Dependencias e integracoes',
    '11. Decisoes tecnicas relevantes',
    '12. Open Questions / Assumptions',
    '13. Riscos de implementacao',
    '14. Criterios de aceite',
    '15. Resumo operacional para implementacao',
    '16. Sequencia sugerida de implementacao'
  ].join('\n')
}

function renderTaskPromptMarkdown(context: ExportContext): string {
  return [
    `# Prompt de Tasks - ${context.rootNode.title}`,
    '',
    'Voce e um engenheiro de software senior responsavel por decompor uma spec em tarefas executaveis.',
    '',
    'Com base no contexto abaixo, gere tasks tecnicas de implementacao.',
    '',
    '## Contexto do bloco',
    `- Nome: ${textValue(context.rootNode.title)}`,
    `- Tipo: ${context.rootNode.type}`,
    `- Objetivo: ${projectBriefValue(context.project, 'goal', context.project.description)}`,
    `- Responsabilidades: ${firstMeaningText(context.rootNode, ['primaryResponsibility', 'purpose'], ['responsibility', 'goal', 'purpose', 'decision'])}`,
    '',
    '## Contexto geral do projeto',
    `- Project: ${textValue(context.project.name)}`,
    `- Board raiz: ${textValue(context.rootBoard.name)}`,
    `- Contexto adicional: ${projectBriefValue(context.project, 'context', context.rootBoard.description)}`,
    '',
    '## Relacoes externas do bloco',
    ...formatRelations(context.rootRelations),
    '',
    '## Detalhamento interno (N2)',
    renderN2Blocks(context),
    '',
    '## Detalhamento fino (N3)',
    renderN3Details(context),
    '',
    '## Contratos e integracoes',
    renderContractsAndIntegrations(context),
    '',
    '## Restricoes e decisoes',
    '- Decisoes arquiteturais relevantes:',
    renderGlobalDecisions(context),
    '- Dependencias conhecidas:',
    ...formatRelations(context.rootRelations),
    '- Inputs/outputs esperados:',
    renderGlobalNotes(context),
    '- Casos de erro conhecidos:',
    context.n2Nodes
      .flatMap((entry) => entry.n3Nodes)
      .flatMap((entry) => listValue(entry.data.errorCases))
      .map((value) => `- ${value}`)
      .join('\n') || `- ${MISSING_TEXT}`,
    '',
    '## Formato da resposta esperado',
    '- Separe por epicos ou grupos logicos.',
    '- Gere tasks pequenas e objetivas.',
    '- Inclua criterios de aceite por task.',
    '- Aponte dependencias entre tasks.',
    '- Escreva em portugues.',
    '- Nao invente contexto nao fornecido; use Open Questions / Assumptions para lacunas.'
  ].join('\n')
}

export function renderPromptMarkdown(context: ExportContext, exportType: ExportPromptType): string {
  if (exportType === 'task_prompt') return renderTaskPromptMarkdown(context)
  return renderSpecPromptMarkdown(context)
}
