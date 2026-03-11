# Spec — Redesign de UI, Cores e Temas

## 1. Objetivo

Redefinir a linguagem visual do app para que ele funcione como uma **ferramenta de raciocínio técnico**, e não como uma interface chamativa ou decorativa. A nova direção deve priorizar:

- baixa complexidade visual
- alta legibilidade
- familiaridade com ferramentas de produtividade
- uso econômico e semântico da cor
- contraste forte
- aparência profissional, calma e moderna
- suporte consistente a light e dark mode

Esta spec cobre apenas:
- UI
- cores
- temas
- aparência visual
- hierarquia visual
- guidelines de layout visual

Não cobre:
- features
- regras de negócio
- modelagem de domínio
- exportação
- comportamento funcional novo

---

## 2. Direção de design

A interface deve transmitir:

- clareza
- confiança
- previsibilidade
- foco
- precisão técnica

A sensação geral do produto deve ser de:

- **quiet UI**
- **canvas-first**
- **tooling profissional**
- **mínimo ruído**
- **máxima legibilidade**

A UI ao redor do board deve ser discreta. O conteúdo diagramado deve ser o protagonista.

---

## 3. Princípios visuais

### 3.1 Clareza acima de estilo
Todo elemento visual deve justificar sua presença melhorando leitura, orientação ou foco.

### 3.2 Familiaridade acima de originalidade
A interface deve se parecer com ferramentas já conhecidas de produtividade, edição e modelagem, reduzindo custo cognitivo de aprendizado.

### 3.3 Cor como linguagem semântica, não decoração
Cor deve ser usada para:
- foco
- seleção
- estados
- categorias limitadas

Cor não deve ser usada para “embelezar” a interface sem função clara.

### 3.4 Baixa complexidade visual
Reduzir:
- excesso de contraste local
- gradientes fortes
- sombras pesadas
- muitas cores simultâneas
- muitas superfícies competindo entre si

### 3.5 Legibilidade como critério central
A leitura de labels, títulos, relações e painéis deve ser mais importante que a expressividade visual.

### 3.6 Consistência entre canvas e chrome
Toolbar, sidebar, inspector, modais e nodes devem falar a mesma língua visual.

---

## 4. Personalidade visual desejada

A nova aparência deve ser:

- sóbria
- técnica
- precisa
- modular
- limpa
- contemporânea

Deve evitar:

- visual excessivamente gamer
- neon exagerado
- glassmorphism pesado
- skeuomorphism
- saturação alta em excesso
- interfaces muito “marketing”
- excesso de bordas, divisórias e ornamentos

---

## 5. Estratégia de cor

## 5.1 Estrutura geral da paleta
A paleta deve seguir a lógica:

- **base neutra** para superfícies e estrutura
- **azul como acento principal**
- **poucas cores semânticas de suporte**
- **cores especiais no canvas apenas quando houver valor cognitivo**

### Estrutura recomendada
- neutros frios ou levemente azulados
- azul como cor primária de ação e foco
- verde, âmbar e vermelho apenas para estados
- roxo/ciano apenas se realmente houver categorias visuais consistentes

---

## 5.2 Papel do azul
Azul deve ser a principal cor de:

- ação primária
- foco
- seleção
- destaque confiável
- elemento ativo
- links e affordances visuais importantes

Azul não deve monopolizar toda a interface, mas deve ser a cor mais reconhecível do sistema.

---

## 5.3 Cores semânticas permitidas
As cores de estado devem ser poucas e estáveis:

- **azul** → foco, seleção, ação principal
- **verde** → sucesso, válido, pronto, saudável
- **âmbar** → atenção, incompleto, aviso
- **vermelho** → erro, conflito, remoção, risco
- **roxo/ciano** → categorias específicas apenas se necessário no canvas

---

## 5.4 Regras de uso da cor
- não usar muitas cores ao mesmo tempo no board
- não colorir cada tipo de node com uma cor saturada diferente
- não usar cor como único indicador de significado
- priorizar contraste de luminância
- usar cor para orientar busca visual e hierarquia

---

## 6. Paleta base recomendada

## 6.1 Light theme
Base visual:
- fundo principal claro, levemente frio
- painéis em branco suave ou cinza muito claro
- bordas discretas
- texto escuro com alto contraste
- azul moderado para ação/foco

Sensação:
- técnica
- arejada
- clara
- precisa

## 6.2 Dark theme
Base visual:
- fundo escuro neutro ou levemente azulado
- superfícies em cinza profundo
- bordas suaves e legíveis
- texto claro sem brilho excessivo
- azul mais luminoso para foco e seleção

Sensação:
- concentrada
- estável
- elegante
- confortável em uso prolongado

---

## 6.3 Requisitos de contraste
- labels e texto pequeno devem sempre priorizar contraste
- o contraste deve ser validado primeiro nos textos pequenos e estados de foco
- a legibilidade não pode depender de saturação
- matiz nunca deve compensar contraste insuficiente

---

## 7. Tokens visuais recomendados

## 7.1 Tokens de superfície
Definir tokens separados para:
- app background
- panel background
- elevated panel background
- canvas chrome
- overlay background
- node surface
- selected node surface

## 7.2 Tokens de texto
Definir no mínimo:
- text primary
- text secondary
- text muted
- text inverse
- text accent

## 7.3 Tokens de borda
Definir no mínimo:
- border subtle
- border default
- border strong
- border focus
- border warning
- border danger

## 7.4 Tokens de estado
Definir:
- accent primary
- success
- warning
- danger
- info

## 7.5 Tokens de canvas
Separar tokens para:
- edge default
- edge selected
- node default
- node hover
- node selected
- node incomplete
- node external
- grid subtle

---

## 8. Layout visual do app

## 8.1 Filosofia de layout
O app deve adotar uma estrutura de moldura silenciosa ao redor do canvas.

O canvas é o protagonista.  
A interface periférica é suporte.

## 8.2 Distribuição visual
Elementos de interface como:
- topbar
- toolbar
- sidebar
- inspector

devem ser visíveis e utilizáveis, mas não devem competir visualmente com o board.

## 8.3 Densidade visual
A densidade deve ser controlada:
- painéis compactos, mas respiráveis
- espaçamentos consistentes
- grupos bem organizados
- poucas divisórias fortes
- uso generoso de espaço negativo onde possível

## 8.4 Separação visual
A separação entre regiões deve depender mais de:
- contraste de superfície
- espaçamento
- elevação sutil

e menos de:
- muitas linhas
- caixas pesadas
- sombras grandes

---

## 9. Estilo dos componentes

## 9.1 Cantos
Todos os componentes interativos devem usar cantos levemente arredondados.

Aplicar em:
- botões
- inputs
- dropdowns
- painéis
- popovers
- modais
- chips
- cards
- nodes

O arredondamento deve ser discreto e técnico, não lúdico.

## 9.2 Bordas
Bordas devem ser:
- finas
- discretas
- consistentes
- mais perceptíveis no dark mode quando necessário

## 9.3 Sombras
Sombras devem ser mínimas e funcionais:
- para separação
- para sobreposição
- para estados elevados

Evitar sombras grandes e chamativas.

## 9.4 Efeitos
Glassmorphism e neon, se existirem, devem ser extremamente moderados.

### Glassmorphism
Pode existir apenas em:
- painéis flutuantes
- overlays
- menus contextuais

Sempre com:
- blur leve
- opacidade controlada
- excelente legibilidade

### Neon
Pode existir apenas como acento de:
- foco
- seleção
- highlight ativo

Nunca como linguagem predominante do app.

---

## 10. Tipografia

## 10.1 Direção tipográfica
A tipografia deve ser:
- simples
- moderna
- altamente legível
- neutra
- técnica

## 10.2 Hierarquia
A hierarquia deve ser curta e clara:

- título de seção
- título de item
- label
- texto auxiliar
- metadata

Evitar muitos níveis visuais.

## 10.3 Uso em canvas
No board:
- labels devem ser sempre legíveis
- evitar fontes pequenas demais
- manter orientação horizontal sempre que possível
- evitar estilos tipográficos decorativos

---

## 11. Canvas e diagrama

## 11.1 Princípio visual
No board, a aparência deve ajudar a revelar estrutura.

Nunca deve competir com a estrutura.

## 11.2 Cor no canvas
Cor no canvas deve servir principalmente para:
- tipo de elemento, se necessário
- estados
- foco
- seleção
- status semântico restrito

Não deve haver “arco-íris arquitetural”.

## 11.3 Nodes
As nodes devem usar:
- fundo limpo
- contraste forte no título
- ícones simples
- borda clara
- acento discreto
- estados visuais previsíveis

## 11.4 Conexões
As edges e conectores devem ser:
- discretos
- legíveis
- com direção clara
- pouco saturados por padrão

Relações importantes podem ganhar destaque contextual, mas sem poluir o board.

## 11.5 Grid e fundo
O fundo do board deve ser contido:
- grid sutil
- textura mínima ou nenhuma
- sem padrões chamativos
- sem excesso de contraste

Observação adicional:
- os pontilhados do fundo do whiteboard, usados para dar visão de escala e movimento, devem permanecer visíveis tanto no tema light quanto no dark
- esses pontilhados devem ser suaves, discretos e consistentes com o restante da interface
- nunca podem competir com nodes, conexões, labels ou estados visuais do canvas
- devem funcionar como referência espacial, não como elemento decorativo dominante

---

## 12. Temas

## 12.1 Estratégia
O produto deve oferecer:
- light theme
- dark theme

Ambos devem ser de primeira classe.

Nenhum deve parecer versão improvisada do outro.

## 12.2 Light theme
Deve privilegiar:
- leitura intensa
- clareza
- contraste limpo
- aparência leve e profissional

## 12.3 Dark theme
Deve privilegiar:
- conforto em ambientes escuros
- foco
- hierarquia clara
- contraste suficiente sem brilho agressivo

## 12.4 Paridade
Os dois temas devem manter:
- mesma identidade visual
- mesma hierarquia
- mesmas regras semânticas de cor
- mesmos estados de foco e seleção

---

## 13. Estados visuais

Todos os componentes e nodes devem ter estados coerentes:

- default
- hover
- active
- selected
- focused
- disabled
- warning
- error

### Regras
- estados não devem depender apenas de cor
- foco deve ser muito visível
- selected deve ser distinguível de hover
- disabled deve reduzir destaque sem perder legibilidade crítica

---

## 14. Hierarquia visual geral

A ordem de atenção da interface deve ser:

1. conteúdo do board
2. seleção atual
3. inspector/painel relacionado ao foco atual
4. ações primárias
5. ações secundárias
6. metadados e suporte

Se a UI ao redor estiver mais chamativa que o board, o design está errado.

---

## 15. Acessibilidade visual

## 15.1 Regras mínimas
- contraste adequado em ambos os temas
- não depender apenas de cor
- estados com múltiplos sinais visuais
- targets interativos claros
- foco visível em toda a interface

## 15.2 Canvas
No board, a leitura deve continuar boa em:
- zoom out moderado
- zoom médio
- seleção detalhada

---

## 16. O que deve ser evitado

- excesso de saturação
- muitas cores simultâneas
- sombras fortes
- vidro excessivo
- muito blur
- glow constante
- contrastes baixos em texto pequeno
- excesso de badges coloridos
- toolbar e sidebars mais chamativas que o canvas
- visual de dashboard de marketing
- interfaces “futuristas” que sacrificam clareza

---

## 17. Resultado esperado

Ao final da mudança visual, o app deve parecer:

- uma ferramenta séria de raciocínio e modelagem
- silenciosa visualmente
- confiável
- clara
- profissional
- moderna sem exagero
- altamente legível
- pronta para sessões longas de uso

---

## 18. Critérios de aceite

### 18.1 Cor
- a paleta foi reduzida e organizada
- azul é o acento principal consistente
- estados usam poucas cores semânticas
- o canvas não está visualmente sobrecarregado

### 18.2 Temas
- light e dark possuem qualidade equivalente
- ambos mantêm identidade coerente
- ambos preservam legibilidade forte

### 18.3 Componentes
- cantos levemente arredondados foram padronizados
- bordas e sombras estão mais discretas
- efeitos visuais estão controlados

### 18.4 Layout visual
- o canvas virou protagonista
- painéis e toolbars ficaram mais silenciosos
- a hierarquia visual ficou mais clara

### 18.5 Leitura
- labels e textos pequenos ficaram mais legíveis
- seleção, foco e estados ficaram mais claros
- a interface parece mais calma e menos ruidosa

---

## 19. Definição de pronto

Esta mudança estará pronta quando a interface:

- transmitir foco e confiança imediatamente
- reduzir ruído visual perceptível
- usar cor de maneira semântica e disciplinada
- funcionar bem em light e dark
- manter aparência moderna sem excesso de efeitos
- colocar o conteúdo técnico no centro da experiência
