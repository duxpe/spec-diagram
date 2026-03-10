Spec — Migração e Integração com React Flow
1. Objetivo
Substituir a biblioteca tldraw pelo React Flow para a implementação do whiteboard infinito. A mudança visa garantir maior controle programático sobre os elementos, simplificar a integração com a UI do React e otimizar a performance em diagramas de múltiplos níveis (N1, N2, N3).

1. Racional da Troca
Afinidade com o Domínio: O React Flow utiliza nativamente uma estrutura de Nodes (nós) e Edges (arestas), o que se alinha diretamente ao modelo semântico de SemanticNode e Relation definido no projeto.

Customização de UI: Permite a criação de Custom Nodes utilizando JSX/TSX, facilitando a aplicação da identidade visual (glassmorphism, ícones de cloud providers e badges).

Performance: Gerenciamento eficiente de renderização para grandes volumes de nós e interações complexas sem a latência observada na integração atual.

3. Arquitetura de Implementação
3.1 Componentização de Nós e Arestas
Custom Nodes Semânticos: Implementar componentes específicos para cada tipo de bloco (System, Service, Database, Class, etc.), respeitando as propriedades obrigatórias de cada nível.

Handles de Conexão: Definir pontos de ancoragem (Handles) específicos nos nós para representar relações de entrada e saída de dados.

Custom Edges: Estilizar arestas para representar visualmente os tipos de relação (depends_on, calls, reads, writes, etc.) com marcadores de direção e labels dinâmicas.

3.2 Gerenciamento de Estado Unificado
Store (Zustand): O board-store deve atuar como a única fonte de verdade, armazenando a lista de nodes e edges compatíveis com o React Flow.

Sincronização: Utilizar os hooks onNodesChange e onEdgesChange do React Flow para despachar atualizações de posição e estado para o banco local Dexie.

Validação: Todo dado recebido do canvas deve ser validado via Zod antes de ser persistido ou utilizado na geração de prompts de exportação.

4. UI/UX e Layout
Viewport: Manter layout full-screen (100dvw / 100dvh) com overflow: hidden.

Painéis e Menus: Integrar o painel lateral de edição e a toolbar utilizando posicionamento absoluto sobre o canvas, aplicando efeitos de glassmorphism e neon para destaque visual.

Navegação: Implementar transições de drill-down entre boards através do hook useReactFlow, permitindo zoom e foco automático no contexto do nó pai ao entrar em um nível inferior (N1 -> N2, N2 -> N3).

5. Persistência Local (Dexie)
Armazenar as coordenadas x, y e o estado de zoom da viewport por board.

Garantir que a estrutura de dados persistida seja agnóstica à visualização, permitindo que os nós sejam reconstruídos no React Flow a partir do modelo semântico puro.

6. Critérios de Aceite
Renderização de todos os tipos de blocos semânticos N1, N2 e N3 como Custom Nodes.

Criação e remoção de relações (Edges) entre nós com persistência imediata.

Navegação fluida via drill-down (clique duplo ou botão de ação) sem perda de dados entre níveis.

Interface livre de scroll nativo da viewport, com movimentação restrita ao canvas infinito.

Todas features já implementadas continuam funcionando.

Todos os testes passam.

Sem errors de tipagem.