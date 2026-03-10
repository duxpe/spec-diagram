# Spec — Implementação dos Blocos Semânticos N1

## 1. Objetivo

Implementar os blocos semânticos de nível `N1`, responsáveis por representar a visão high-level do sistema e servir como ponto de entrada para decomposição estrutural em níveis mais detalhados.

No MVP, os blocos `N1` são a base da exportação de artefatos: cada grande bloco de `N1` deve poder originar prompts de specs e tasks.

## 2. Escopo

Esta spec cobre:
- tipos de blocos `N1`;
- propriedades obrigatórias e opcionais;
- regras de criação;
- relações permitidas;
- regras de drill-down para `N2`;
- validação;
- critérios de aceite.

## 3. Nível semântico N1

`N1` representa contexto e visão geral da solução.

Seu objetivo é responder perguntas como:
- quais são os grandes blocos do sistema?
- quais responsabilidades macro existem?
- quais integrações externas participam?
- quais bases de dados existem?
- quais portas e adaptadores relevantes aparecem no contorno?
- quais decisões importantes restringem o design?
- quais entradas e saídas são esperadas?

## 4. Tipos de blocos N1

Os blocos semânticos válidos em `N1` são:

- `system`
- `container_service`
- `database`
- `external_system`
- `port`
- `adapter`
- `decision`
- `free_note_input`
- `free_note_output`

## 5. Objetivos por tipo

### 5.1 System
Representa o sistema principal ou um macrodomínio da solução.

### 5.2 Container/Service
Representa um serviço, aplicação, módulo executável ou container lógico relevante na arquitetura.

### 5.3 Database
Representa um armazenamento persistente relevante ao nível de arquitetura.

### 5.4 External System
Representa dependências externas, terceiros ou sistemas vizinhos.

### 5.5 Port
Representa um ponto de entrada ou saída arquitetural do sistema em sentido hexagonal/clean.

### 5.6 Adapter
Representa implementações que conectam portas à infraestrutura ou a sistemas externos.

### 5.7 Decision
Representa uma decisão arquitetural, trade-off, restrição ou escolha importante.

### 5.8 Free Note Input
Representa uma nota livre com contexto sobre entradas esperadas do bloco.

### 5.9 Free Note Output
Representa uma nota livre com contexto sobre saídas esperadas do bloco.

## 6. Modelo-base de bloco N1

Todos os blocos `N1` devem compartilhar o seguinte contrato mínimo:

```ts
interface N1NodeBase {
  id: string
  workspaceId: string
  boardId: string
  level: 'N1'
  type:
    | 'system'
    | 'container_service'
    | 'database'
    | 'external_system'
    | 'port'
    | 'adapter'
    | 'decision'
    | 'free_note_input'
    | 'free_note_output'
  title: string
  description?: string
  tags?: string[]
  childBoardId?: string
  data: Record<string, unknown>
}
```

## 7. Payload específico por tipo

## 7.1 System

```ts
interface SystemNodeData {
  goal: string
  businessContext?: string
  primaryResponsibilities: string[]
  boundaries?: string[]
  assumptions?: string[]
}
```

### Campos obrigatórios
- `goal`
- `primaryResponsibilities`

## 7.2 Container/Service

```ts
interface ContainerServiceNodeData {
  responsibility: string
  inputs?: string[]
  outputs?: string[]
  technologies?: string[]
  ownedBy?: string
  exposesPorts?: string[]
  dependsOn?: string[]
}
```

### Campos obrigatórios
- `responsibility`

## 7.3 Database

```ts
interface DatabaseNodeData {
  purpose: string
  storageModel?: 'relational' | 'document' | 'key_value' | 'graph' | 'event_store' | 'other'
  mainEntities?: string[]
  accessedBy?: string[]
  consistencyNotes?: string[]
}
```

### Campos obrigatórios
- `purpose`

## 7.4 External System

```ts
interface ExternalSystemNodeData {
  purpose: string
  interactionType?: 'sync' | 'async' | 'batch' | 'manual' | 'unknown'
  contractsKnown?: string[]
  risks?: string[]
}
```

### Campos obrigatórios
- `purpose`

## 7.5 Port

```ts
interface PortNodeData {
  direction: 'inbound' | 'outbound'
  protocol?: string
  responsibility: string
  ownedByBlockId?: string
}
```

### Campos obrigatórios
- `direction`
- `responsibility`

## 7.6 Adapter

```ts
interface AdapterNodeData {
  responsibility: string
  adaptsPortId?: string
  technology?: string
  externalDependency?: string
}
```

### Campos obrigatórios
- `responsibility`

## 7.7 Decision

```ts
interface DecisionNodeData {
  decision: string
  rationale?: string
  consequences?: string[]
  alternativesConsidered?: string[]
  status?: 'proposed' | 'accepted' | 'deprecated'
}
```

### Campos obrigatórios
- `decision`

## 7.8 Free Note Input

```ts
interface FreeNoteInputNodeData {
  expectedInputsText: string
}
```

### Campos obrigatórios
- `expectedInputsText`

## 7.9 Free Note Output

```ts
interface FreeNoteOutputNodeData {
  expectedOutputsText: string
}
```

### Campos obrigatórios
- `expectedOutputsText`

## 8. Regras de UI e criação

## 8.1 Inserção

O usuário deve conseguir criar blocos `N1` por:
- toolbar;
- menu contextual;
- atalho futuro opcional.

## 8.2 Aparência

Cada tipo deve possuir:
- rótulo visível;
- ícone ou marcador semântico;
- estilo visual consistente por categoria.

## 8.3 Painel lateral

Ao selecionar um bloco `N1`, o painel lateral deve permitir:
- editar título;
- editar descrição;
- editar campos específicos do tipo;
- abrir/criar sub-board `N2` quando aplicável.

## 9. Regras de drill-down N1 -> N2

## 9.1 Elegibilidade

Podem abrir board `N2`:
- `system`
- `container_service`
- `database`
- `external_system`
- `port`
- `adapter`

No MVP, `decision` e notas livres não precisam abrir detalhamento, embora isso possa ser permitido futuramente.

## 9.2 Comportamento

- Se o bloco não possuir `childBoardId`, o sistema cria um board `N2`.
- O board `N2` criado deve registrar `parentNodeId` apontando para o bloco de origem.
- O título inicial do board filho pode seguir o padrão: `Detalhe de <nome do bloco>`.

## 10. Relações permitidas em N1

Relações iniciais permitidas:
- `depends_on`
- `calls`
- `reads`
- `writes`
- `uses`
- `exposes`
- `decides`

## 10.1 Restrições sugeridas

- `database` não deve ser origem de `calls` no MVP.
- `decision` preferencialmente usa `decides` ou `depends_on`.
- `port` deve se relacionar com `adapter`, `system` ou `container_service`.
- `adapter` deve preferencialmente apontar para `port` e/ou `external_system`.

## 11. Regras de validação

## 11.1 Validação estrutural

- Todo bloco `N1` deve ter `title` não vazio.
- Todo bloco `N1` deve possuir payload válido conforme seu tipo.
- O `level` deve ser obrigatoriamente `N1`.

## 11.2 Validação semântica mínima

### System
- deve possuir ao menos uma responsabilidade principal.

### Container/Service
- deve declarar responsabilidade principal.

### Database
- deve declarar propósito.

### External System
- deve declarar propósito.

### Port
- deve declarar direção e responsabilidade.

### Adapter
- deve declarar responsabilidade.

### Decision
- deve registrar a decisão em texto.

### Notes
- devem conter texto não vazio.

## 11.3 Validação de prontidão para export

Um bloco `N1` será considerado “exportável” se:
- possuir `title`;
- possuir dados obrigatórios válidos;
- possuir ao menos uma descrição mínima útil;
- opcionalmente possuir sub-board `N2` ou justificativa para ausência.

## 12. Integração com export

Cada bloco `N1` deve ser tratado como **raiz de contexto exportável**.

A exportação deve conseguir:
- coletar o bloco `N1` selecionado;
- percorrer seu sub-board `N2`;
- percorrer seus descendentes `N3`;
- gerar prompt textual consolidado para spec ou tasks.

## 13. Casos de uso principais

### Caso 1 — Criar visão high-level
- usuário cria `System`;
- adiciona `Container/Service`;
- adiciona `Database` e `External System`;
- conecta relações;
- registra inputs/outputs esperados.

### Caso 2 — Preparar detalhamento
- usuário seleciona um `Container/Service`;
- abre detalhe;
- navega para board `N2` específico.

### Caso 3 — Preparar export
- usuário finaliza um bloco `N1` e seus descendentes;
- sistema marca bloco como pronto para export.

## 14. Critérios de aceite

### Funcionais
- É possível criar todos os tipos válidos de blocos `N1`.
- Cada tipo abre um formulário de propriedades adequado.
- É possível conectar blocos `N1` com relações válidas.
- É possível abrir um sub-board `N2` a partir de um bloco elegível.
- Os dados persistem após reload.

### Semânticos
- Cada bloco `N1` é validado por schema específico.
- O sistema consegue identificar se um bloco está pronto para export.

## 15. Fora de escopo

- lint semântico avançado;
- sugestão automática de componentes;
- inferência automática de relações;
- colaboração multiusuário;
- visualizações alternativas além do board.

## 16. Definição de pronto

A implementação de `N1` estará pronta quando o usuário puder modelar a arquitetura high-level com blocos semânticos coerentes, navegar para detalhamento `N2` e usar esses blocos como raízes de exportação.
