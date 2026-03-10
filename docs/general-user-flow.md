Descrição de Flow — Sistema de Whiteboard Semântico
1. Conceito de Projeto
O termo "Workspace" é substituído por Projeto.

Um Projeto encapsula boards de múltiplos níveis (N1, N2, N3) e metadados de arquitetura.

Toda a persistência é local e vinculada à estrutura do Projeto.

2. Criação e Manipulação no Whiteboard
Instanciação de Nodes: O usuário arrasta itens do menu lateral para o canvas (React Flow).

Validade Semântica: Ao soltar o card no whiteboard, o sistema cria automaticamente a entidade semântica correspondente ao tipo selecionado (system, container_service, database, etc.).

Conexões Intuitivas:

O usuário realiza a ligação física entre dois nodes arrastando a aresta.

No momento da conexão, uma Dialog Box/Popup flutuante é exibida.

O usuário seleciona o tipo de relação (depends_on, calls, reads, writes, implements, etc.) para validar o vínculo semântico.

3. Customização de Nodes (Interface Flutuante)
Edição de Ícones:

Ao clicar diretamente no ícone do card, abre-se um sub-menu de ícones.

O menu exibe apenas ícones válidos para o tipo da node (ícones genéricos ou de cloud providers como AWS, Azure e GCP).

Edição de Propriedades e Detalhes:

Ao clicar no título ou no centro do card, abre-se um menu/popup para edição de dados.

Os campos exibidos são dinâmicos e dependem do nível e tipo do card:

N1: Foco em responsabilidades macro, objetivos e contexto de negócio.

N2: Foco em atributos de classe, interfaces, contratos de API e resumos de input/output.

N3: Detalhamento fino de assinaturas de métodos, pré/pós-condições e invariantes.

Princípio de UI: Ausência de painéis estáticos; toda interação de edição ocorre via sub-menus, popups ou menus flutuantes para maximizar a área útil do whiteboard.

4. Navegação Drill-down
O acesso aos níveis internos (N1 → N2 → N3) é realizado através de ações específicas nos cards elegíveis.

O sistema mantém o vínculo entre o node pai e o sub-board detalhado.

5. Geração de Artefatos (Export)
O usuário pode acionar a exportação do prompt em qualquer estágio do desenvolvimento.

O exportador coleta deterministicamente os dados estruturados de todos os níveis disponíveis.

Resultados: Geração de spec_prompt (especificação técnica) ou task_prompt (decomposição de tarefas para backlog) formatados para uso em LLMs externas.