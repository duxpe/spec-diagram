Spec — Refatoração de Layout e Interface Flutuante
1. Objetivo
Refatorar a interface do projeto para eliminar painéis estáticos e barras de rolagem, adotando um layout de HUD (Heads-Up Display) totalmente flutuante sobre o whiteboard. A nova interface deve priorizar menus contextuais e sub-menus que surgem conforme a interação com os nodes.

2. Arquitetura de Layout (Viewport Fixa)
Controle de Viewport: Configurar width: 100dvw e height: 100dvh com overflow: hidden no container raiz.

Camadas (Z-Index):

Canvas (Base): React Flow ocupando todo o fundo.

HUD Layer: Toolbar lateral, Topbar e Minimap flutuantes.

Context Layer: Menus de ação (Popups) que acompanham os nodes selecionados.

Overlay Layer: Modais de exportação e diálogos de relação.

3. Componentes da Interface Flutuante
3.1 Topbar Minimalista
Posicionamento: Flutuante no topo, centralizada ou com margens de 20px.

Conteúdo: Nome do Projeto, botão "Share" e avatar do usuário.

Estética: Glassmorphism sutil (blur e transparência).

3.2 Toolbar Lateral (Floating Toolbar)
Posicionamento: Vertical, fixa à esquerda.

Ações: Ferramentas de seleção, criação de nodes (drag-and-drop), inserção de texto e zoom.

Design: Ícones monocromáticos em container com bordas arredondadas e efeito neon na seleção.

3.3 Barra de Ações do Node (Contextual)
Gatilho: Aparece imediatamente abaixo do node ao ser selecionado.

Botões: Edit, Duplicate, Comment, Resize e Delete.

4. Fluxo de Interação Semântica
4.1 Edição de Ícone (Sub-menu)
Interação: Clique no ícone dentro do card.

Comportamento: Abre um sub-menu flutuante adjacente ao node.

Filtro: Exibe apenas ícones compatíveis com o SemanticNodeType atual (ex: bancos de dados para database).

4.2 Painel Inspetor (Floating Inspector)
Interação: Clique no título ou centro do card.

Comportamento: Abre um card flutuante à direita da tela, exibindo as propriedades semânticas.

Campos Dinâmicos:

N1: Responsabilidade, Goal, Contexto de Negócio.

N2/N3: Métodos, Atributos, Assinaturas e Erros.

Ações de Export: Botões "Generate Spec", "Export LLM Prompt" e "Create Tasks" fixos na base deste painel.

4.3 Diálogo de Relação (Edge Dialog)
Interação: Após conectar dois nodes.

Comportamento: Popup centralizado ou próximo à conexão para selecionar o RelationType (ex: writes, calls, depends_on).

5. Estética e Visual
Estilo dos Cards: Borda com aspecto "sketch" (traço manual), fundo branco/off-white e cabeçalhos coloridos por categoria.

Cores de Acento:

Azul: Frontend / Mobile.

Amarelo/Bege: API Gateway / Auth.

Verde: Billing / Pagamentos.

Vermelho: 3rd Party / Externo.

Efeitos: Sombras suaves (drop shadow) para profundidade e glassmorphism nos menus de HUD.

6. Critérios de Aceite
Ausência total de barras de rolagem na janela principal.

Menus contextuais seguindo a posição dos nodes no canvas.

Edição de campos semânticos via painel flutuante sem recarregar o board.

Persistência automática das edições via Dexie.