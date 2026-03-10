
# Spec — UI/UX para Identidade Visual de Nodes, Biblioteca de Ícones e Tema do Produto

## 1. Objetivo
Definir a experiência visual e de interação para que cada node do sistema seja identificada de forma **rápida, intuitiva e consistente**, usando:
- shapes semânticos
- ícones genéricos por tipo
- ícones específicos de cloud providers
- painel de edição com troca visual controlada
- tema coerente light/dark
- linguagem visual clean, moderna, levemente neon e com glassmorphism
- layout full-screen sem barras de rolagem na viewport

Esta spec cobre apenas **UX e UI**, sem alterar regras de negócio, semântica do domínio ou lógica de export.

---

## 2. Problema a resolver
Um node pode existir semanticamente correto, mas o usuário precisa:
- reconhecê-la rapidamente no board
- distinguir tipos semelhantes sem ler tudo
- manter consistência visual entre níveis
- visualizar se algo é genérico ou ligado a uma cloud
- editar essa representação sem fricção
- navegar em uma interface ampla sem poluição visual

Objetivos da solução:
- melhorar legibilidade
- aumentar velocidade de leitura do board
- reforçar clareza arquitetural
- manter sensação de produto profissional
- permitir alta densidade de informação

---

## 3. Princípios de design

### Clareza antes de decoração
O visual deve reforçar o significado da node.

### Semântica visual consistente
Cada tipo deve ter:
- shape base
- ícone padrão
- acento visual consistente
- comportamento consistente no painel

### Progressão de detalhe
A representação visual precisa funcionar em zoom amplo e detalhado.

### Visual moderno
O produto deve usar:
- superfícies limpas
- contraste adequado
- glow moderado
- glassmorphism sutil

### A viewport nunca rola
A aplicação deve ocupar:
- width: 100dvw
- height: 100dvh

A viewport não deve ter scroll. Apenas o board se expande.

---

## 4. Escopo

Inclui:
- identidade visual de nodes
- shapes por categoria
- ícones genéricos
- ícones de AWS/Azure/GCP
- painel de aparência
- fallback visual
- estados visuais
- tema light/dark
- layout full-screen

Não inclui:
- mudanças de domínio
- regras de negócio
- export
- colaboração

---

## 5. Modelo visual das nodes

Cada node possui duas camadas:

### Camada semântica base
- tipo
- shape
- ícone genérico
- estilo base

### Camada visual opcional
- provider visual
- ícone específico
- badge de provider
- estilo cloud

Exemplo:
database → ícone genérico  
database + AWS → RDS icon

---

## 6. Shapes por categoria

System  
- retângulo grande arredondado

Container / Service  
- retângulo médio arredondado

Database  
- cilindro

External System  
- retângulo tracejado

API Contract  
- card com header

Decision  
- losango ou card angular

Class  
- card estruturado

Interface  
- card com outline leve

Port  
- cápsula horizontal

Adapter  
- card com notch

Method  
- pill compacto

Attribute  
- pill estático

Input Note  
- sticky com badge IN

Output Note  
- sticky com badge OUT

---

## 7. Ícones genéricos

System → grid  
Service → cube  
Database → cylinder  
External → globe  
API Contract → brackets  
Decision → branch  
Class → box  
Interface → layers  
Port → plug  
Adapter → bridge  
Method → function  
Attribute → key  
Input → arrow-down  
Output → arrow-up

Requisitos:
- legível em 16/20/24px
- monocromático
- compatível com dark/light

---

## 8. Ícones específicos de cloud

Providers suportados:

AWS  
Azure  
GCP

O tipo da node não muda.

Usuário escolhe provider visual no painel.

Exemplo:

database  
→ generic  
→ AWS → RDS

### Exemplos AWS
EC2  
Lambda  
ECS  
S3  
RDS  
DynamoDB  
API Gateway  
SQS  
SNS  
EventBridge  
CloudFront  
Route53

### Exemplos Azure
App Service  
Functions  
AKS  
Blob Storage  
Azure SQL  
CosmosDB  
API Management  
Service Bus

### Exemplos GCP
Cloud Run  
GKE  
Cloud Functions  
Cloud Storage  
Cloud SQL  
Firestore  
Pub/Sub  
Load Balancer

---

## 9. Regras de fallback visual

Prioridade:

1. shape
2. ícone genérico
3. ícone específico
4. badge provider

Se ícone específico faltar:
- usar genérico

---

## 10. Painel de aparência

Seção no painel lateral:

Aparência

Campos:
- shape
- ícone
- provider visual
- serviço cloud
- cor/acento
- badge provider
- reset visual

Preview deve atualizar em tempo real.

---

## 11. Picker de ícones

Mostrar:
- genérico primeiro
- cloud providers em abas
- busca textual

Evitar grids enormes.

---

## 12. Estados visuais

Default  
- borda discreta

Hover  
- contraste leve

Selected  
- glow suave

Editing  
- destaque maior

Invalid  
- badge warning

Linked detail  
- indicador de drill-down

---

## 13. Layout da aplicação

Viewport:

width: 100dvw  
height: 100dvh  
overflow: hidden

Estrutura:

Topbar  
Toolbar lateral  
Board central  
Painel lateral

Board:
- pan
- zoom
- infinito

Scroll somente interno em painéis.

---

## 14. Tema light e dark

Requisitos:
- toggle
- persistência

Identidade:
- clean
- moderna
- neon leve
- glassmorphism

Dark:
- fundo profundo
- glow cyan/purple

Light:
- fundo claro frio
- contraste suave

---

## 15. Glassmorphism

Aplicado em:
- topbar
- painéis
- modais

Com:
- blur leve
- borda sutil
- transparência moderada

---

## 16. Neon

Usado apenas em:
- seleção
- foco
- destaque

Nunca exagerado.

---

## 17. Paleta sugerida

System → cyan  
Service → teal  
Database → amber  
External → gray  
API Contract → indigo  
Decision → orange  
Class → blue  
Interface → purple  
Port → cyan  
Adapter → teal  
Method → blue  
Attribute → neutral  
Input → green  
Output → cyan/orange

---

## 18. Tipografia

Requisitos:
- moderna
- legível
- limpa

Hierarquia:
- título claro
- badges discretos
- labels curtas

---

## 19. Acessibilidade

- contraste adequado
- não depender só de cor
- shape + ícone + label

Funcionar em:
- zoom out
- zoom médio
- foco detalhado

---

## 20. Interações

Criação:
- animação curta
- ícone genérico automático

Customização:
- preview imediato
- reset visual

Descoberta:
- genérico primeiro
- cloud depois

---

## 21. Clouds

- AWS / Azure / GCP com paridade visual
- mistura permitida
- badge provider opcional

---

## 22. Fora de escopo

- auto-detecção de cloud
- marketplace de temas
- import de ícones
- customização por workspace

---

## 23. Critérios de aceite

Nodes:
- shape + ícone coerente

Personalização:
- trocar provider
- trocar ícone
- reset visual

Cloud:
- AWS/Azure/GCP suportados
- fallback genérico funcional

Tema:
- light/dark funcionando

Layout:
- viewport sem scroll

---

## 24. Definição de pronto

- nodes visualmente claras
- customização funcionando
- cloud icons disponíveis
- tema light/dark consistente
- layout 100dvh/dvw
- UI moderna e limpa
