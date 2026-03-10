# Spec — Implementação dos Blocos Semânticos N3

## 1. Objetivo

Implementar os blocos semânticos de nível `N3`, responsáveis por registrar o detalhamento fino de classes, interfaces e contratos por meio de métodos, atributos e notas complementares de input/output.

`N3` é o nível mais baixo do MVP e deve fornecer material suficiente para gerar prompts copiáveis com foco em implementação de specs e tasks.

## 2. Escopo

Esta spec cobre:
- tipos de blocos `N3`;
- modelo de dados;
- relações permitidas;
- regras de validação;
- uso para export.

## 3. Nível semântico N3

`N3` representa o detalhe fino de um bloco `N2`.

Seu objetivo é responder perguntas como:
- quais métodos existem?
- quais atributos existem?
- quais entradas e saídas específicas são esperadas?
- quais restrições contratuais precisam ser preservadas?

## 4. Blocos válidos em N3

- `method`
- `attribute`
- `free_note_input`
- `free_note_output`

## 5. Modelo-base de bloco N3

```ts
interface N3NodeBase {
  id: string
  workspaceId: string
  boardId: string
  parentNodeId?: string
  level: 'N3'
  type:
    | 'method'
    | 'attribute'
    | 'free_note_input'
    | 'free_note_output'
  title: string
  description?: string
  data: Record<string, unknown>
}
```

## 6. Payload específico por tipo

## 6.1 Method

```ts
interface MethodNodeData {
  signature: string
  purpose: string
  inputs?: string[]
  outputs?: string[]
  sideEffects?: string[]
  preconditions?: string[]
  postconditions?: string[]
  errorCases?: string[]
  visibility?: 'public' | 'protected' | 'private' | 'internal'
  async?: boolean
}
```

### Campos obrigatórios
- `signature`
- `purpose`

## 6.2 Attribute

```ts
interface AttributeNodeData {
  typeSignature: string
  purpose: string
  visibility?: 'public' | 'protected' | 'private' | 'internal'
  required?: boolean
  defaultValue?: string
  invariants?: string[]
}
```

### Campos obrigatórios
- `typeSignature`
- `purpose`

## 6.3 Free Note Input

```ts
interface FreeNoteInputNodeData {
  expectedInputsText: string
}
```

## 6.4 Free Note Output

```ts
interface FreeNoteOutputNodeData {
  expectedOutputsText: string
}
```

## 7. Papel por tipo

### Method
Representa uma operação específica de uma classe, interface ou contrato.

### Attribute
Representa dado relevante do estado interno ou da estrutura exposta.

### Notes
Representam observações complementares úteis para especificação ou implementação.

## 8. Regras de criação

- Blocos `N3` só existem em boards `N3`.
- Todo board `N3` deve apontar para um `parentNodeId` de nível `N2`.
- O tipo do bloco pai `N2` deve influenciar o contexto do formulário em `N3`.

## 8.1 Exemplos de contexto

### Se o pai for `class`
- `method` e `attribute` representam membros da classe.

### Se o pai for `interface`
- `method` representa operação contratual;
- `attribute` pode ser usado com parcimônia, apenas se fizer sentido como propriedade contratual.

### Se o pai for `api_contract`
- `method` pode representar endpoint, handler, comando ou operação;
- `attribute` pode representar campos estruturais relevantes, se necessário.

## 9. Relações permitidas em N3

Relações válidas:
- `uses`
- `depends_on`
- `exposes`

No MVP, relações em `N3` podem ser opcionais e mais leves do que nos níveis anteriores.

## 10. Regras de validação

## 10.1 Gerais

- `title` obrigatório;
- `level = N3` obrigatório;
- payload específico válido;
- texto não vazio para notes.

## 10.2 Method

- `signature` obrigatória;
- `purpose` obrigatório;
- deve conter ao menos uma definição útil de comportamento;
- idealmente informa inputs ou outputs.

## 10.3 Attribute

- `typeSignature` obrigatório;
- `purpose` obrigatório.

## 10.4 Notes

- devem conter texto não vazio.

## 11. Formulários por tipo

## 11.1 Method

O painel lateral deve permitir editar:
- assinatura;
- propósito;
- entradas;
- saídas;
- efeitos colaterais;
- pré-condições;
- pós-condições;
- erros;
- visibilidade;
- indicador assíncrono.

## 11.2 Attribute

O painel lateral deve permitir editar:
- tipo;
- propósito;
- visibilidade;
- obrigatório/opcional;
- valor default;
- invariantes.

## 12. Integração com export

Os blocos `N3` alimentam o nível mais detalhado do prompt exportado.

### Method contribui com
- assinatura pretendida;
- comportamento esperado;
- pré e pós-condições;
- erros;
- efeitos colaterais.

### Attribute contribui com
- estrutura interna ou contratual;
- tipo esperado;
- restrições e invariantes.

### Notes contribuem com
- bordas de entrada;
- bordas de saída;
- observações de implementação.

## 13. Casos de uso principais

### Caso 1 — Detalhar uma classe
- usuário abre uma classe em `N2`;
- adiciona métodos e atributos;
- descreve responsabilidades finas.

### Caso 2 — Detalhar uma interface
- usuário registra operações expostas;
- define pré-condições e outputs esperados.

### Caso 3 — Detalhar um contrato
- usuário descreve operações, payloads e possíveis erros.

## 14. Critérios de aceite

### Funcionais
- É possível criar `method`, `attribute` e notes em `N3`.
- É possível editar todos os campos relevantes no painel lateral.
- Os dados persistem e são reabertos corretamente.

### Semânticos
- O exportador consegue montar texto detalhado a partir de `N3`.
- O sistema preserva vínculo entre board `N3` e bloco pai `N2`.

## 15. Fora de escopo

- modelagem formal de tipos complexos em AST;
- geração de código;
- compilação de assinaturas;
- validação por linguagem-alvo.

## 16. Definição de pronto

A implementação de `N3` estará pronta quando o usuário puder registrar métodos e atributos detalhados o suficiente para produzir prompts de spec e task utilizáveis por uma LLM externa.
