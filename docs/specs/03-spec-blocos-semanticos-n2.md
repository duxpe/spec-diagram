# Spec — Implementação dos Blocos Semânticos N2

## 1. Objetivo

Implementar os blocos semânticos de nível `N2`, responsáveis por detalhar um bloco `N1` específico por meio de classes, interfaces, contratos de API e notas contextuais de input/output.

`N2` representa a decomposição estrutural principal de um grande bloco arquitetural, aproximando o usuário de um design de baixo nível pronto para exportação.

## 2. Escopo

Esta spec cobre:
- tipos de blocos `N2`;
- modelo de dados;
- regras de criação e edição;
- relações permitidas;
- regras de drill-down para `N3`;
- validação;
- integração com export.

## 3. Nível semântico N2

`N2` representa o zoom de um bloco `N1`.

Seu objetivo é responder perguntas como:
- quais classes ou papéis internos compõem este bloco?
- quais interfaces existem?
- quais contratos de API precisam ser explicitados?
- quais inputs e outputs internos ou externos esse bloco manipula?

## 4. Blocos válidos em N2

- `class`
- `interface`
- `api_contract`
- `free_note_input`
- `free_note_output`

## 5. Modelo-base de bloco N2

```ts
interface N2NodeBase {
  id: string
  workspaceId: string
  boardId: string
  parentNodeId?: string
  level: 'N2'
  type:
    | 'class'
    | 'interface'
    | 'api_contract'
    | 'free_note_input'
    | 'free_note_output'
  title: string
  description?: string
  tags?: string[]
  childBoardId?: string
  data: Record<string, unknown>
}
```

## 6. Payload específico por tipo

## 6.1 Class

```ts
interface ClassNodeData {
  responsibility: string
  stereotypes?: string[]
  dependsOnClassIds?: string[]
  implementsInterfaceIds?: string[]
  exposesMethodsSummary?: string[]
  ownsAttributesSummary?: string[]
  invariants?: string[]
}
```

### Campos obrigatórios
- `responsibility`

## 6.2 Interface

```ts
interface InterfaceNodeData {
  purpose: string
  implementedByClassIds?: string[]
  exposedOperationsSummary?: string[]
  notes?: string[]
}
```

### Campos obrigatórios
- `purpose`

## 6.3 API Contract

```ts
interface ApiContractNodeData {
  kind: 'http' | 'event' | 'message' | 'rpc' | 'other'
  consumer?: string
  provider?: string
  inputSummary: string[]
  outputSummary: string[]
  constraints?: string[]
  errorCases?: string[]
}
```

### Campos obrigatórios
- `kind`
- `inputSummary`
- `outputSummary`

## 6.4 Free Note Input

```ts
interface FreeNoteInputNodeData {
  expectedInputsText: string
}
```

## 6.5 Free Note Output

```ts
interface FreeNoteOutputNodeData {
  expectedOutputsText: string
}
```

## 7. Papel de cada bloco em N2

### Class
Representa uma unidade de comportamento ou responsabilidade interna do bloco pai.

### Interface
Representa contratos internos de abstração entre componentes.

### API Contract
Representa contrato externo ou interno relevante, por exemplo endpoints, eventos ou mensagens.

### Notes
Representam observações livres necessárias para preservar contexto não estruturado.

## 8. Regras de criação

- Blocos `N2` só existem dentro de boards `N2`.
- Todo board `N2` deve ter um `parentNodeId` apontando para o bloco `N1` detalhado.
- Ao criar um novo board `N2`, o sistema deve exibir referência do bloco pai.

## 9. Relações permitidas em N2

Relações válidas:
- `depends_on`
- `implements`
- `extends`
- `uses`
- `exposes`
- `calls`

## 9.1 Exemplos

- `class -> interface` usando `implements` ou `uses`
- `class -> class` usando `depends_on` ou `calls`
- `class -> api_contract` usando `exposes` ou `uses`
- `interface -> api_contract` quando a interface encapsula o contrato

## 10. Regras de drill-down N2 -> N3

## 10.1 Elegibilidade

Podem abrir board `N3`:
- `class`
- `interface`
- `api_contract`

As notas livres não abrem detalhamento em `N3` no MVP.

## 10.2 Comportamento

- Ao abrir detalhe de um bloco `N2`, o sistema cria ou abre um board `N3`.
- O `parentNodeId` do board `N3` aponta para o bloco `N2` de origem.
- O board `N3` representa a decomposição fina em métodos e atributos.

## 11. Regras de validação

## 11.1 Gerais

- `title` obrigatório;
- `level = N2` obrigatório;
- payload específico compatível com o tipo;
- proibição de shape decorativo.

## 11.2 Class

- precisa declarar responsabilidade principal;
- recomenda-se pelo menos um resumo de método ou atributo quando o bloco estiver maduro.

## 11.3 Interface

- precisa declarar propósito;
- recomenda-se ao menos uma operação resumida.

## 11.4 API Contract

- precisa declarar `kind`;
- precisa conter resumo de entrada e saída;
- idealmente explicita restrições ou erros conhecidos.

## 11.5 Notes

- texto não vazio.

## 12. Estado de prontidão para export

Um bloco `N2` será considerado adequado para export quando:
- seus campos obrigatórios estiverem preenchidos;
- suas relações principais fizerem sentido;
- seus detalhes `N3` existirem ou houver detalhes suficientes no próprio bloco.

## 13. Painel lateral de edição

Ao selecionar um bloco `N2`, o painel lateral deve permitir:
- editar campos base;
- editar campos específicos do tipo;
- ver relações principais;
- abrir/criar sub-board `N3` quando aplicável;
- visualizar referência do bloco pai `N1`.

## 14. Integração com export

Na exportação a partir de um bloco `N1`, os blocos `N2` são tratados como **componentes internos principais** da spec.

### Class
Deve contribuir com:
- responsabilidade;
- dependências;
- operações resumidas;
- atributos resumidos.

### Interface
Deve contribuir com:
- abstrações expostas;
- responsabilidades contratuais.

### API Contract
Deve contribuir com:
- entradas;
- saídas;
- restrições;
- possíveis falhas.

### Notes
Devem complementar contexto de uso e borda de comportamento.

## 15. Casos de uso principais

### Caso 1 — Detalhar um serviço
- usuário entra no board `N2` de um `Container/Service`;
- cria classes centrais;
- define interfaces;
- registra contratos de API.

### Caso 2 — Preparar detalhamento fino
- usuário abre o detalhe de uma classe;
- navega para o board `N3` para descrever métodos e atributos.

### Caso 3 — Consolidar contexto para export
- usuário preenche notes de input/output;
- exportador usa isso como instrução adicional de spec.

## 16. Critérios de aceite

### Funcionais
- É possível criar todos os tipos válidos de `N2`.
- É possível editar propriedades específicas por tipo.
- É possível relacionar classes, interfaces e contratos.
- É possível abrir `N3` a partir de `class`, `interface` e `api_contract`.

### Semânticos
- Todo bloco `N2` é validado com schema próprio.
- O exportador consegue consumir dados `N2` sem depender do canvas visual.

## 17. Fora de escopo

- geração automática de diagrama UML formal;
- checagem avançada de consistência OO;
- inferência automática de interfaces;
- reverse engineering de código.

## 18. Definição de pronto

A implementação de `N2` estará pronta quando o usuário puder decompor um bloco `N1` em classes, interfaces e contratos relevantes, navegar para `N3` e alimentar exportações consistentes.
