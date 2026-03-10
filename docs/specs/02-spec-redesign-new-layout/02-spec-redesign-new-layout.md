# Spec — Redesign de Interface: HUD e Estética Sketch-Semântica

## 1. Objetivo
Refatorar a identidade visual do app para abandonar o layout de painéis laterais fixos e pesados (estado atual) em favor de uma interface HUD (Heads-Up Display). A nova estética deve seguir o estilo **"sketch" (traço manual)** para os elementos do board, mantendo uma organização limpa, moderna e focada em **menus flutuantes que não obstruem o whiteboard**.

---

## 2. Identidade Visual Base (The "Goal" Aesthetic)

A nova interface deve ser baseada nos seguintes pilares visuais:

### Fundo do Board
Transição de **azul escuro profundo** para um tom **off-white ou creme claro**, simulando um **papel técnico ou whiteboard físico de alta qualidade**.

### Estilo Sketch-Semântico
Os **nodes (cards)** não devem ter traços perfeitamente retos; as bordas devem ter um **leve aspecto de desenho manual (sketch)**, mas com **preenchimento sólido** e **cores pastéis/suaves** para indicar categorias.

### Sombreado
Uso de **drop shadows suaves** para dar profundidade aos cards sobre o fundo claro.

### Typography
Fontes **sans-serif modernas e limpas**, com **hierarquia clara entre o título do card e as informações internas**.

---

## 3. Layout de HUD e Componentes Flutuantes

### 3.1 Workspace / Projeto (Entry Page)

**Visual:**  
A tela de criação de Projetos deve abandonar os **cards escuros** e adotar uma **interface de vidro (glassmorphism)** sobre o fundo do board.

**Inputs:**  
Campos de **nome e descrição** devem ser **minimalistas**, com **bordas finas** e foco em **tipografia**.

---

### 3.2 Toolbar Lateral Flutuante

**Posicionamento:**  
Flutuando à **esquerda da tela**, sem encostar nas bordas da viewport.

**Estilo:**  
Barra vertical com **efeito glassmorphism** (desfoque de fundo e borda sutil).

**Ícones:**  
Representações minimalistas das ferramentas:

- Seta de seleção
- Formas geométricas
- Texto
- Zoom

---

### 3.3 Topbar e Navegação

**Header:**  
Um **cabeçalho flutuante discreto** no topo indicando:

- Nome do **Projeto**
- **Nível atual** (N1, N2 ou N3)

**Controles:**  
Botões de navegação para **retornar à lista de Projetos**.

---

## 4. Componentes Semânticos no Canvas (React Flow)

### 4.1 Design dos Nodes (Cards)

Cada tipo de bloco semântico deve seguir o padrão visual observado no screenshot de referência.

**Cabeçalho Colorido:**  
Uma faixa colorida no topo indicando a categoria.

Exemplos:

- Azul → Serviços  
- Verde → Bancos de Dados  
- Vermelho → Sistemas Externos

**Área de Ícone:**  
Espaço dedicado no **lado esquerdo do card** para o **ícone semântico**.

**Corpo:**  
Conteúdo em texto com **fundo branco/claro**.

---

### 4.2 Arestas (Relações)

**Visual:**  
As linhas de conexão devem ser **nítidas** e terminar em **setas indicativas de direção**.

**Labels:**  
Espaço para **labels de texto sobre as linhas**, por exemplo:

- `REST API`
- `Writes/Reads`

Essas labels devem **descrever a relação semântica** entre os nodes.

---

## 5. Interação e Menus de Contexto

### 5.1 Menu de Ação Flutuante

**Comportamento:**  
Ao selecionar um **node**, uma **pequena barra de ferramentas flutuante** aparece imediatamente **abaixo ou acima dele**, contendo ações rápidas:

- Editar
- Deletar
- Redimensionar

---

### 5.2 Painel Inspetor Flutuante (Floating Inspector)

**Posicionamento:**  
Uma **janela lateral flutuante** (não fixa à borda) que aparece **à direita** ao clicar no conteúdo do card.

**Estilo:**  
Glassmorphism com:

- bordas arredondadas
- cabeçalho identificando o tipo do bloco

**Ações na Base:**  
Botões de exportação agrupados na parte inferior:

- Geração de **Spec**
- **Export de Prompt**
- **Criação de Tasks**

---

## 6. Critérios de Sucesso do Redesign

### Eliminação de Scroll
A viewport deve ser **100dvw e 100dvh fixos**.  
Apenas o **canvas do board** e os **scrolls internos dos menus** devem existir.

### Aparência Sketch
Nodes e conexões devem transmitir:

- clareza de um **diagrama técnico**
- leveza de um **esboço manual**

### Navegação HUD
Todos os **controles e campos de edição** devem ser:

- **flutuantes**
- **contextuais**
- **não intrusivos ao canvas**