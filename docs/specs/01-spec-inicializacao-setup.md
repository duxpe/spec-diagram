# Spec — Inicialização e Setup do Projeto

## 1. Objetivo

Inicializar o projeto do MVP de um app de system design orientado a whiteboard infinito, com foco em modelagem determinística de arquitetura em múltiplos níveis (`N1`, `N2`, `N3`) e exportação de prompts para geração de specs e tasks.

A aplicação deve permitir que o usuário:
- crie boards e sub-boards encadeados por drill-down;
- modele blocos semânticos em diferentes níveis de abstração;
- persista tudo localmente;
- exporte artefatos textuais baseados principalmente nos blocos de nível `N1`.

## 2. Stack definida

- **Build / Dev Server:** Vite
- **UI:** React
- **Linguagem:** TypeScript
- **Whiteboard / Canvas:** tldraw
- **Gerenciamento de estado:** Zustand
- **Persistência local:** Dexie (sobre IndexedDB)
- **Validação de schemas:** Zod

## 3. Objetivo técnico do setup

O setup inicial deve entregar uma base pronta para:
- desenvolvimento rápido com tipagem forte;
- separação clara entre estado visual do board e estado semântico do domínio;
- persistência local e export/import JSON;
- evolução futura para múltiplos workspaces e colaboração.
- testes unitários para todas features majors e minors.

## 4. Escopo desta spec

Esta spec cobre:
- bootstrap do projeto;
- convenções de diretórios;
- dependências iniciais;
- arquitetura de estado;
- modelagem base do domínio;
- persistência local;
- navegação entre boards;
- comandos essenciais do MVP;
- critérios de aceite do setup.

Não cobre a implementação detalhada dos blocos semânticos `N1`, `N2`, `N3` nem a engine de export, que possuem specs próprias.

## 5. Princípios de arquitetura

1. **O board não é apenas visual.** Todo shape do canvas representa uma entidade semântica válida.
2. **Domínio acima da UI.** O modelo semântico deve existir independentemente do tldraw.
3. **Determinismo.** O produto não depende de LLM interna. Toda exportação é gerada a partir dos dados estruturados.
4. **Drill-down explícito.** Um bloco pode abrir um board de detalhe em nível inferior.
5. **Offline-first.** O MVP deve funcionar integralmente em persistência local.
6. **Type-safe by default.** Modelos e payloads devem ser validados com Zod.

## 6. Estrutura sugerida de diretórios

```text
src/
  app/
    App.tsx
    providers/
    router/
  pages/
    workspace/
      WorkspacePage.tsx
    board/
      BoardPage.tsx
  components/
    layout/
    panels/
    inspector/
    toolbar/
    dialogs/
  board/
    tldraw/
      TLComponents.tsx
      shape-utils/
      bindings/
    semantic/
      semantic-shape-factory.ts
      semantic-shape-mappers.ts
  domain/
    models/
      workspace.ts
      board.ts
      semantic-node.ts
      relation.ts
      export.ts
    schemas/
      workspace.schema.ts
      board.schema.ts
      semantic-node.schema.ts
      relation.schema.ts
      export.schema.ts
    services/
      board-service.ts
      navigation-service.ts
      export-service.ts
      validation-service.ts
  state/
    app-store.ts
    workspace-store.ts
    board-store.ts
    ui-store.ts
  db/
    dexie.ts
    repositories/
      workspace-repo.ts
      board-repo.ts
      semantic-node-repo.ts
      relation-repo.ts
  features/
    semantic-blocks/
      n1/
      n2/
      n3/
    export/
    import/
    autosave/
  utils/
    ids.ts
    dates.ts
    json.ts
    assertions.ts
  styles/
  main.tsx
```

## 7. Dependências iniciais

### 7.1 Dependências de produção

- `react`
- `react-dom`
- `tldraw`
- `zustand`
- `dexie`
- `zod`

### 7.2 Dependências de desenvolvimento

- `typescript`
- `vite`
- `@types/react`
- `@types/react-dom`
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `prettier`
- `eslint-config-prettier`
- `eslint-plugin-react-hooks`

## 8. Convenções de modelagem

## 8.1 Conceitos-base

### Workspace
Agrupa múltiplos boards e metadados do projeto.

### Board
Representa uma superfície de modelagem em um nível semântico específico.

### Semantic Node
Representa um shape/bloco do canvas com significado semântico obrigatório.

### Relation
Representa uma conexão semântica entre dois nós.

### Drill-down
Ligação entre um nó pai e um board filho de detalhe.

## 8.2 Enum de níveis

```ts
export type SemanticLevel = 'N1' | 'N2' | 'N3'
```

## 8.3 Enum inicial de tipos semânticos

```ts
export type SemanticNodeType =
  | 'system'
  | 'container_service'
  | 'database'
  | 'external_system'
  | 'api_contract'
  | 'decision'
  | 'class'
  | 'interface'
  | 'port'
  | 'adapter'
  | 'method'
  | 'attribute'
  | 'free_note_input'
  | 'free_note_output'
```

## 9. Modelo inicial de dados

## 9.1 Workspace

```ts
interface Workspace {
  id: string
  name: string
  description?: string
  rootBoardId: string
  boardIds: string[]
  createdAt: string
  updatedAt: string
}
```

## 9.2 Board

```ts
interface Board {
  id: string
  workspaceId: string
  parentBoardId?: string
  parentNodeId?: string
  level: 'N1' | 'N2' | 'N3'
  name: string
  description?: string
  nodeIds: string[]
  relationIds: string[]
  tlSnapshot?: unknown
  createdAt: string
  updatedAt: string
}
```

## 9.3 SemanticNode

```ts
interface SemanticNode {
  id: string
  workspaceId: string
  boardId: string
  parentNodeId?: string
  level: 'N1' | 'N2' | 'N3'
  type: SemanticNodeType
  title: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  childBoardId?: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
```

## 9.4 Relation

```ts
interface Relation {
  id: string
  workspaceId: string
  boardId: string
  sourceNodeId: string
  targetNodeId: string
  label?: string
  type:
    | 'depends_on'
    | 'calls'
    | 'reads'
    | 'writes'
    | 'implements'
    | 'extends'
    | 'uses'
    | 'exposes'
    | 'contains'
    | 'decides'
  createdAt: string
  updatedAt: string
}
```

## 10. Regras estruturais do MVP

1. Todo board possui um `level` fixo.
2. Todo node pertence exatamente a um board.
3. Todo node é semântico; não existem shapes puramente decorativos.
4. Um node pode opcionalmente apontar para um `childBoardId`.
5. `N1` pode abrir boards `N2`.
6. `N2` pode abrir boards `N3`.
7. `N3` não abre novo nível no MVP.
8. Relações só podem existir entre nodes do mesmo board.
9. Dados específicos de cada tipo de bloco vivem em `data`, mas com schema validado por Zod.

## 11. Navegação do MVP

## 11.1 Fluxo principal

- Usuário entra no workspace.
- O sistema abre o root board `N1`.
- Ao clicar em “abrir detalhe” em um bloco compatível, o sistema navega para o board filho.
- A navegação deve preservar contexto do bloco pai.

## 11.2 Rotas sugeridas

```text
/workspaces
/workspace/:workspaceId
/workspace/:workspaceId/board/:boardId
```

## 11.3 Requisitos de drill-down

- Cada node elegível deve exibir ação “Abrir detalhe”.
- Se o `childBoardId` não existir, o sistema pode criar o sub-board automaticamente.
- O nível do board filho deve ser inferido a partir do nível do node pai.

## 12. Estratégia de estado

## 12.1 Zustand separado por responsabilidade

### `workspace-store`
Responsável por:
- workspace atual;
- lista de boards do workspace;
- criação e seleção de boards.

### `board-store`
Responsável por:
- board atual;
- nodes do board atual;
- relations do board atual;
- sincronização com canvas.

### `ui-store`
Responsável por:
- seleção atual;
- painel lateral aberto/fechado;
- modo de criação de bloco;
- modais de export/import.

## 12.2 Regra crítica

O Zustand não deve armazenar apenas estado visual do tldraw. Deve armazenar o estado semântico já normalizado.

## 13. Persistência local com Dexie

## 13.1 Tabelas iniciais

- `workspaces`
- `boards`
- `nodes`
- `relations`
- `exports` (opcional no MVP, mas recomendada)

## 13.2 Requisitos

- salvar automaticamente mudanças importantes;
- suportar `Ctrl+S` para persistência explícita;
- reabrir último workspace/board usado;
- exportar workspace completo em JSON;
- importar workspace de JSON validado por schema.

## 13.3 Estratégia de autosave

Sugestão:
- debounce de 500ms a 1200ms para alterações semânticas;
- persistência imediata em ações destrutivas;
- persistência manual via atalho.

## 14. Integração com tldraw

## 14.1 Papel do tldraw

O tldraw será o motor visual do canvas.

## 14.2 Papel da camada de adaptação

Criar uma camada própria que converta:
- `SemanticNode -> Shape do tldraw`
- `Relation -> Binding/Arrow do tldraw`
- eventos do tldraw -> atualização do domínio

## 14.3 Regra importante

O domínio não deve depender de tipos internos do tldraw além da camada de adaptação.

## 15. Schemas Zod obrigatórios

Devem existir schemas para:
- workspace;
- board;
- relation;
- base de node;
- payload específico de cada tipo de node;
- arquivo JSON de export/import do workspace.

## 16. Funcionalidades mínimas do setup

1. Criar workspace.
2. Criar board raiz `N1` automaticamente.
3. Renderizar tldraw dentro da página de board.
4. Criar um node semântico básico no board.
5. Selecionar node e editar propriedades no painel lateral.
6. Conectar nodes com relation.
7. Persistir e reabrir dados locais.
8. Navegar para sub-board via drill-down.
9. Exportar JSON do workspace.
10. Importar JSON do workspace.

## 17. Critérios de aceite

### Aceite funcional

- É possível iniciar um workspace novo e abrir o board raiz.
- É possível adicionar ao menos um bloco semântico em `N1`.
- É possível mover o bloco no canvas e persistir sua posição.
- É possível abrir um sub-board a partir de um bloco.
- Ao recarregar a página, o estado persistido é restaurado.
- É possível exportar e importar o workspace em JSON.

### Aceite técnico

- Todo dado persistido é validado por Zod antes de uso.
- Existe separação clara entre domínio, estado, persistência e canvas.
- O projeto compila sem `any` não justificado nas camadas de domínio.
- O build de produção executa com sucesso.

## 18. Fora de escopo desta etapa

- autenticação;
- sincronização remota;
- colaboração em tempo real;
- histórico de versões completo;
- geração automática por LLM;
- permissões multiusuário;
- comentários em tempo real.

## 19. Entregáveis esperados

- projeto Vite configurado;
- estrutura de pastas criada;
- stores base em Zustand;
- banco Dexie configurado;
- schemas Zod iniciais;
- tela de board funcional com tldraw;
- criação/persistência de workspace e board raiz.

## 20. Definição de pronto

Esta spec estará concluída quando existir uma base executável capaz de sustentar as demais fases (`N1`, `N2`, `N3`, export) sem refatoração estrutural grande.
