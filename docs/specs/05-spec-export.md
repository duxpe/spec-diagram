# Spec — Implementação do Export

## 1. Objetivo

Implementar a funcionalidade de exportação determinística do MVP, capaz de transformar um bloco `N1` e seus descendentes (`N2` e `N3`) em prompts textuais copiáveis para:
- criação de spec;
- criação de tasks.

O export não gera documentação final automaticamente. Ele gera **prompts estruturados** para o usuário usar em uma LLM de sua escolha.

## 2. Escopo

Esta spec cobre:
- modelos de export;
- inputs necessários;
- estratégia de coleta de contexto;
- templates de prompt;
- UI de export;
- critérios de prontidão e aceite.

## 3. Princípio de funcionamento

A exportação deve ser totalmente determinística.

Fluxo conceitual:
1. usuário escolhe um bloco `N1`;
2. sistema coleta o bloco `N1`;
3. sistema coleta o board `N2` filho, se existir;
4. sistema coleta todos os blocos `N2` relevantes;
5. sistema coleta os boards `N3` de cada bloco `N2` elegível;
6. sistema consolida o contexto em um modelo intermediário;
7. sistema renderiza um prompt textual via template.

## 4. Tipos de export do MVP

- `spec_prompt`
- `task_prompt`

## 5. Unidade de export

A unidade principal de export é um **bloco `N1` exportável**.

Isso significa que, em um mesmo board `N1`, pode haver múltiplos exports independentes — um para cada big block relevante.

## 6. Modelo intermediário de export

## 6.1 Estrutura sugerida

```ts
interface ExportContext {
  workspace: {
    id: string
    name: string
    description?: string
  }
  rootBlock: {
    id: string
    type: string
    title: string
    description?: string
    data: Record<string, unknown>
  }
  n1Relations: Array<{
    sourceTitle: string
    targetTitle: string
    type: string
    label?: string
  }>
  n2Blocks: Array<{
    id: string
    type: string
    title: string
    description?: string
    data: Record<string, unknown>
    relations: Array<{
      sourceTitle: string
      targetTitle: string
      type: string
      label?: string
    }>
    n3Blocks: Array<{
      id: string
      type: string
      title: string
      description?: string
      data: Record<string, unknown>
    }>
  }>
  notes: {
    input: string[]
    output: string[]
  }
}
```

## 7. Regras de coleta de contexto

## 7.1 Contexto do N1

Deve incluir:
- título do bloco raiz;
- tipo do bloco raiz;
- descrição;
- payload semântico;
- relações relevantes em `N1`;
- notes de input/output do mesmo board, quando relacionadas ao bloco ou ao contexto geral.

## 7.2 Contexto do N2

Deve incluir:
- todos os blocos do board filho `N2`;
- payloads específicos;
- relações entre blocos `N2`;
- notes de input/output.

## 7.3 Contexto do N3

Deve incluir:
- todos os `methods` e `attributes` dos boards `N3` descendentes;
- notes complementares.

## 7.4 Regras de ordenação

Os dados devem ser ordenados de forma estável para gerar export consistente.

Sugestão de prioridade:
1. tipo do bloco;
2. título;
3. data de criação.

## 8. Regras de exportabilidade

Um bloco `N1` pode ser exportado se:
- possui título;
- possui campos obrigatórios válidos;
- não está vazio semanticamente;
- possui contexto suficiente para produzir prompt útil.

Mesmo sem `N2` e `N3`, o sistema pode permitir export com aviso de baixa completude.

## 9. UI de export

## 9.1 Entrada de usuário

A interface de export deve permitir:
- selecionar um bloco `N1`;
- escolher tipo de export (`spec_prompt` ou `task_prompt`);
- visualizar prompt gerado;
- copiar prompt;
- opcionalmente salvar histórico local do export.

## 9.2 Ponto de entrada

Sugestões:
- botão no painel do bloco `N1`;
- menu contextual do bloco;
- painel lateral de export do board.

## 10. Template de prompt para spec

## 10.1 Objetivo

Gerar um prompt que peça a uma LLM a criação de uma spec técnica detalhada para o big block selecionado.

## 10.2 Estrutura sugerida

```text
Você é um especialista em arquitetura e especificação de software.

Quero que produza uma spec técnica detalhada com base no contexto abaixo.

OBJETIVO DO BLOCO
- Nome:
- Tipo:
- Descrição:
- Responsabilidade principal:

CONTEXTO HIGH-LEVEL
- Relações com outros blocos:
- Inputs esperados:
- Outputs esperados:
- Decisões relevantes:

DECOMPOSIÇÃO INTERNA
- Classes:
- Interfaces:
- Contratos de API:

DETALHE FINO
- Métodos:
- Atributos:
- Pré-condições / pós-condições:
- Casos de erro:

INSTRUÇÕES PARA A RESPOSTA
- Gere a spec em português.
- Explique responsabilidades.
- Explique contratos firmes.
- Destaque lacunas e premissas.
- Estruture a resposta em seções.
```

## 11. Template de prompt para tasks

## 11.1 Objetivo

Gerar um prompt que peça a uma LLM a decomposição do bloco em tarefas de implementação.

## 11.2 Estrutura sugerida

```text
Você é um engenheiro de software sênior responsável por decompor uma spec em tarefas executáveis.

Com base no contexto abaixo, gere tasks técnicas de implementação.

CONTEXTO DO BLOCO
- Nome:
- Tipo:
- Objetivo:
- Responsabilidades:

DETALHAMENTO INTERNO
- Classes:
- Interfaces:
- Contratos:
- Métodos:
- Atributos:

RESTRIÇÕES E DECISÕES
- Decisões arquiteturais:
- Dependências:
- Inputs e outputs esperados:
- Casos de erro:

FORMATO DA RESPOSTA
- Separe por épicos ou grupos lógicos.
- Gere tasks pequenas e objetivas.
- Inclua critérios de aceite.
- Aponte dependências entre tasks.
- Escreva em português.
```

## 12. Estratégia de renderização do prompt

O sistema deve:
1. coletar `ExportContext`;
2. converter objetos em texto estruturado;
3. preencher template por tipo de export;
4. apresentar o resultado em textarea/markdown preview copiável.

## 13. Persistência opcional do histórico de export

Recomendado registrar localmente:

```ts
interface ExportRecord {
  id: string
  workspaceId: string
  boardId: string
  rootNodeId: string
  exportType: 'spec_prompt' | 'task_prompt'
  promptText: string
  createdAt: string
}
```

## 14. Critérios de completude do export

O sistema pode calcular um score simples de completude com base em:
- bloco `N1` com dados obrigatórios;
- existência de `N2`;
- existência de `N3`;
- presença de inputs/outputs;
- presença de decisões e contratos.

Esse score não bloqueia export, mas ajuda a orientar o usuário.

## 15. Casos de uso principais

### Caso 1 — Exportar spec de um container
- usuário seleciona um `Container/Service` em `N1`;
- sistema coleta `N2` e `N3`;
- sistema gera prompt de spec.

### Caso 2 — Exportar tasks de implementação
- usuário usa o mesmo contexto;
- sistema gera prompt orientado a backlog técnico.

### Caso 3 — Export com contexto parcial
- usuário ainda não detalhou `N3`;
- sistema exporta mesmo assim, com menor riqueza semântica.

## 16. Critérios de aceite

### Funcionais
- É possível selecionar um bloco `N1` e gerar prompt de spec.
- É possível selecionar um bloco `N1` e gerar prompt de tasks.
- O prompt é copiável sem edição obrigatória.
- O prompt reflete dados reais de `N1`, `N2` e `N3`.

### Técnicos
- O exportador não depende do estado bruto do canvas.
- O texto gerado é estável para o mesmo conjunto de dados.
- O sistema não quebra quando descendentes opcionais não existem.

## 17. Fora de escopo

- envio direto para provedores de IA;
- escolha automática de modelo LLM;
- versionamento remoto dos exports;
- avaliação de qualidade pela própria IA.

## 18. Definição de pronto

A implementação de export estará pronta quando o usuário conseguir gerar, copiar e reutilizar prompts coerentes de spec e task para cada bloco `N1` relevante do board high-level.
