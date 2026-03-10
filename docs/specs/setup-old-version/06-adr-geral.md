# ADR Geral — MVP do App de System Design Determinístico

- **Status:** Aceito
- **Data:** 2026-03-09
- **Contexto:** Definição arquitetural inicial do MVP

## 0.Objetivo
Este software permite que você planeje e arquitete um sistema completo, seja ele web, CLI ou qualquer outro tipo. No centro, você tem um quadro infinito onde desenha sua arquitetura de forma visual. Comece em um nível alto, criando blocos principais, definindo sistemas, serviços ou partes do seu software suas entradas e saídas. Ao clicar em um bloco, você aprofunda no próximo nível, detalhando classes, interfaces e outros componentes, as entradas e saídas de cada um deles. Um nível mais profundo ainda permite detalhar métodos, atributos, entradas e saídas. Quando todo o design está finalizado, você exporta prompts estruturados. Esses prompts são feitos para outra IA gerar especificações ou tarefas detalhadas, ajudando você a acelerar o desenvolvimento assistido por IA. Em resumo, ele transforma o seu pensamento visual em documentação e planos prontos para serem executados.


## 1. Título

Adotar uma arquitetura cliente-first, semântica e determinística para um app de system design em whiteboard infinito, com drill-down progressivo de `N1` para `N3` e exportação de prompts textuais.

## 2. Contexto

O produto tem como objetivo ajudar o usuário a sair de uma visão high-level de arquitetura para uma definição mais detalhada de contratos, classes, métodos e atributos, preservando a fluidez de um whiteboard infinito.

Diferentemente de uma ferramenta puramente visual, este produto exige que cada shape represente uma entidade semântica válida. O resultado final não é um diagrama apenas; é um conjunto de dados estruturados capazes de alimentar prompts de geração de specs e tasks para uso em LLMs externas.

O MVP precisa ser rápido de construir, simples de operar localmente e forte em tipagem, sem depender inicialmente de backend, autenticação ou colaboração em tempo real.

## 3. Decisão

Será adotada a seguinte arquitetura base para o MVP:

- **Frontend:** Vite + React + TypeScript
- **Canvas / Whiteboard:** tldraw
- **Gerenciamento de estado:** Zustand
- **Persistência local:** Dexie sobre IndexedDB
- **Validação de modelos:** Zod
- **Estratégia de produto:** cliente-first, offline-first, export determinístico

Além disso, será adotado um modelo semântico em três níveis:
- `N1`: contexto e visão geral
- `N2`: classes, interfaces, contratos
- `N3`: métodos, atributos e detalhes finos

A navegação entre níveis ocorrerá via **nested boards**, com **drill-down clicando em um bloco**, abrindo um novo board de detalhe associado ao node pai.

## 4. Justificativa

### 4.1 Vite + React + TypeScript
Escolhidos por rapidez de setup, produtividade alta no front-end e boa ergonomia para um MVP iterativo.

### 4.2 tldraw
Escolhido por ser um motor de whiteboard adequado ao paradigma do produto e por permitir modelagem em canvas infinito com forte extensibilidade.

### 4.3 Zustand
Escolhido por simplicidade, baixo overhead e boa adequação para estado de UI e estado de domínio local.

### 4.4 Dexie
Escolhido para encapsular IndexedDB com ergonomia melhor, persistência local eficiente e boa base para offline-first.

### 4.5 Zod
Escolhido para garantir que todo dado do domínio, do import/export e dos payloads específicos dos blocos seja validado de forma explícita.

### 4.6 Estratégia determinística
A aplicação não executará geração por IA internamente no MVP. Ela estruturará contexto e gerará prompts copiáveis. Isso reduz complexidade, acoplamento com provedores externos e ambiguidade operacional.

## 5. Decisões complementares

## 5.1 Todo shape é semântico
Não existirão shapes puramente decorativos no MVP.

### Implicações
- simplifica exportação;
- evita dívida semântica;
- aumenta coerência entre canvas e domínio.

## 5.2 O domínio não deve depender diretamente do canvas
O tldraw será tratado como camada visual.

### Implicações
- o domínio deve possuir modelos próprios (`Workspace`, `Board`, `SemanticNode`, `Relation`);
- export e persistência não podem depender do snapshot visual bruto.

## 5.3 Boards são organizados por nível
Cada board possui um nível fixo: `N1`, `N2` ou `N3`.

### Implicações
- simplifica regras de criação e validação;
- torna a navegação previsível;
- reduz mistura de abstrações no mesmo board.

## 5.4 O bloco N1 é a unidade primária de export
Cada grande bloco de `N1` pode originar um conjunto próprio de prompts.

### Implicações
- o valor do produto está na conversão `board criado -> artifacts exportados`;
- o usuário pode decompor o sistema por fatias maiores e exportáveis.

## 5.5 Persistência local no MVP
Todo dado será persistido localmente com Dexie.

### Implicações
- o MVP não exige backend;
- o produto pode funcionar offline;
- export/import JSON vira mecanismo inicial de portabilidade.

## 6. Alternativas consideradas

## 6.1 Usar Next.js em vez de Vite
Foi considerado, mas rejeitado para o MVP.

### Motivo
O produto inicial é centrado em interação cliente-side, canvas e persistência local. A complexidade full-stack do Next.js não é necessária nesta fase.

## 6.2 Usar React Flow em vez de tldraw
Foi considerado, mas rejeitado.

### Motivo
O paradigma principal do produto é whiteboard livre com drill-down, e não apenas editor de grafos ou fluxo de nós.

## 6.3 Usar Redux em vez de Zustand
Foi considerado, mas rejeitado.

### Motivo
O MVP prioriza simplicidade, menor boilerplate e velocidade de iteração.

## 6.4 Usar IndexedDB puro em vez de Dexie
Foi considerado, mas rejeitado.

### Motivo
Dexie reduz fricção de implementação e manutenção.

## 6.5 Integrar LLM diretamente no MVP
Foi considerado, mas adiado.

### Motivo
A proposta inicial busca estruturar design e exportar prompts, não operar como agente autônomo acoplado a um provedor específico.

## 7. Consequências positivas

- rapidez de implementação do MVP;
- modelo de domínio claro e validado;
- boa base para evolução futura;
- valor direto ao usuário sem dependência de backend;
- export reaproveitável com qualquer LLM.

## 8. Consequências negativas e riscos

- sem backend, não há colaboração real-time no MVP;
- sem IA interna, parte da inteligência continua manual;
- modelagem totalmente semântica pode aumentar esforço de UX;
- nested boards exigem navegação clara para evitar perda de contexto.

## 9. Mitigações

- usar painel lateral forte e breadcrumbs entre níveis;
- manter tipos de blocos enxutos no MVP;
- permitir export mesmo com completude parcial;
- manter schemas rígidos e interface simples.

## 10. Diretrizes de implementação

1. Implementar primeiro a fundação de domínio, persistência e board base.
2. Implementar blocos `N1` antes de aprofundar `N2` e `N3`.
3. Garantir drill-down funcional cedo.
4. Tratar export como feature central, não acessória.
5. Validar tudo com Zod.
6. Evitar acoplamento excessivo ao tldraw.

## 11. Métrica principal do MVP

A métrica principal de sucesso será:

**conversão de boards criados para artifacts exportados**, especialmente múltiplos exports a partir dos blocos `N1`.

## 12. Fora de escopo do ADR inicial

- colaboração multiusuário;
- autenticação;
- billing;
- sync remoto;
- histórico avançado de versões;
- execução de prompts em provedores LLM.

## 13. Próximos passos

1. Inicializar o projeto e a estrutura base.
2. Implementar `Workspace`, `Board`, `SemanticNode` e `Relation`.
3. Implementar `N1` com drill-down para `N2`.
4. Implementar `N2` com drill-down para `N3`.
5. Implementar `N3`.
6. Implementar export de `spec_prompt` e `task_prompt`.

## 14. Resumo executivo

Este ADR estabelece que o MVP será um app cliente-first e offline-first de system design semântico, orientado a nested boards e exportação determinística de prompts, construído com Vite, React, TypeScript, tldraw, Zustand, Dexie e Zod.
