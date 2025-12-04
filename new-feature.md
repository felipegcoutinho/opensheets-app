# Tarefa: Implementar Sistema de Captura de Notificações Bancárias no OpenSheets

## Contexto
Estou trabalhando no OpenSheets, um aplicativo de gestão financeira pessoal self-hosted. Preciso implementar um sistema para automatizar o registro de transações através da captura de notificações de aplicativos bancários no Android.

## Objetivo
Criar uma funcionalidade completa que permita:
1. Capturar notificações de apps bancários (a ser feito em app Android separado - não fazer agora)
2. Receber essas notificações via API no OpenSheets
3. Armazenar como "transações pendentes"
4. Permitir revisão e processamento manual dessas transações antes de convertê-las em lançamentos definitivos

## Arquivos e Documentação Importante
- Leia o arquivo `CLAUDE.md` na raiz do projeto para entender a arquitetura completa
- Schema do banco de dados: `db/schema.ts`
- Padrões de server actions: veja `app/(dashboard)/lancamentos/actions.ts` como exemplo
- Padrões de componentes: veja `components/lancamentos/` como referência
- Padrões de API routes: veja arquivos existentes em `app/api/`

## Implementação Necessária - Passo a Passo

### PASSO 1: Adicionar Nova Tabela ao Schema
**Arquivo:** `db/schema.ts`

Adicione uma nova tabela chamada `transacoesPendentes` ao schema com os seguintes campos:

**Campos de identificação:**
- id (UUID, primary key)
- userId (UUID, foreign key para user, cascade delete)

**Campos de dados brutos da notificação:**
- appPackageName (texto, obrigatório)
- appName (texto, obrigatório)
- notificationText (texto, obrigatório)
- notificationTitle (texto, opcional)

**Campos de dados extraídos/parseados:**
- valor (numeric 12,2, opcional)
- estabelecimento (texto, opcional)
- dataHoraTransacao (timestamp, opcional)
- tipoTransacao (texto, opcional - valores: 'debito', 'credito', 'pix', 'transferencia')

**Campos para conversão em lançamento:**
- categoriaId (UUID, foreign key para categorias, opcional)
- contaId (UUID, foreign key para contas, opcional)
- cartaoId (UUID, foreign key para cartoes, opcional)
- pagadorId (UUID, foreign key para pagadores, opcional)
- descricaoEditada (texto, opcional)
- observacoes (texto, opcional)

**Campos de metadados:**
- status (texto, obrigatório, default 'pendente' - valores: 'pendente', 'processado', 'ignorado')
- processadoEm (timestamp, opcional)
- lancamentoId (UUID, foreign key para lancamentos, opcional)
- createdAt (timestamp, obrigatório, default now)
- updatedAt (timestamp, obrigatório, default now)

Exporte os tipos TypeScript: `TransacaoPendente` e `NewTransacaoPendente`

**Após adicionar a tabela, execute:** `npm run db:push`

---

### PASSO 2: Criar Schemas de Validação Zod
**Arquivo novo:** `lib/schemas/transacoes-pendentes.ts`

Crie dois schemas Zod:

**Schema 1: notificacaoBancariaSchema**
Para validar dados recebidos do app Android:
- appPackageName (string, mínimo 1)
- appName (string, mínimo 1)
- notificationText (string, mínimo 1)
- notificationTitle (string, opcional)
- valor (coerce number, opcional)
- estabelecimento (string, opcional)
- dataHoraTransacao (string, opcional)
- tipoTransacao (enum: 'debito', 'credito', 'pix', 'transferencia', opcional)

**Schema 2: processarTransacaoSchema**
Para validar dados ao processar uma transação pendente:
- descricaoEditada (string, mínimo 1, mensagem: "Descrição é obrigatória")
- categoriaId (string UUID, mensagem: "Categoria inválida")
- contaId (string UUID, opcional)
- cartaoId (string UUID, opcional)
- pagadorId (string UUID, opcional)
- observacoes (string, opcional)
- valor (coerce number, mínimo 0.01, mensagem: "Valor deve ser maior que zero")
- data (string, validar se é data válida, mensagem: "Data inválida")

Exporte os tipos TypeScript inferidos de ambos schemas.

---

### PASSO 3: Criar Endpoints da API
**Arquivo novo:** `app/api/transacoes-pendentes/route.ts`

Implemente dois endpoints:

**Endpoint POST:**
- Usar `getUser()` para autenticação
- Receber JSON do body
- Validar com `notificacaoBancariaSchema`
- Inserir no banco de dados na tabela `transacoesPendentes` com status 'pendente'
- Retornar JSON com `{ success: true, data: resultado }`
- Em caso de erro, retornar `{ success: false, error: mensagem }` com status 400
- Incluir try/catch e console.error para logs

**Endpoint GET:**
- Usar `getUser()` para autenticação
- Buscar todas as transações pendentes do usuário (filtrar por userId)
- Ordenar por createdAt descendente
- Retornar JSON com `{ success: true, data: transacoes }`
- Em caso de erro, retornar `{ success: false, error: mensagem }` com status 400

Use os padrões do Drizzle ORM (eq, desc) e imports do projeto.

---

### PASSO 4: Criar Data Fetchers
**Arquivo novo:** `lib/transacoes-pendentes/fetch-data.ts`

Crie três funções de busca:

**Função 1: fetchTransacoesPendentes(userId: string)**
- Buscar todas as transações pendentes do usuário
- Fazer LEFT JOIN com: contas, cartoes, categorias, pagadores
- Retornar objeto com dados da transação e dados relacionados
- Ordenar por createdAt descendente

**Função 2: fetchTransacoesPendentesPorStatus(userId: string, status: string)**
- Buscar transações pendentes filtradas por status específico
- Filtrar por userId E status
- Ordenar por createdAt descendente

**Função 3: contarTransacoesPendentes(userId: string)**
- Contar quantas transações com status 'pendente' o usuário tem
- Filtrar por userId E status = 'pendente'
- Retornar o count/length

Use os padrões do Drizzle ORM (eq, and, desc) do projeto.

---

### PASSO 5: Criar Server Actions
**Arquivo novo:** `app/(dashboard)/transacoes-pendentes/actions.ts`

Adicione `"use server"` no topo do arquivo.

Implemente quatro server actions:

**Action 1: processarTransacaoPendente**
- Parâmetros: pendenteId (string), dadosEditados (object)
- Obter usuário com `getUser()`
- Validar dadosEditados com `processarTransacaoSchema`
- Buscar transação pendente (filtrar por id E userId)
- Verificar se existe e se status é 'pendente'
- Determinar tipo de lançamento baseado no tipoTransacao
- Criar novo lançamento na tabela `lancamentos` com status 'realizado'
- Atualizar transação pendente: status = 'processado', preencher campos editados, lancamentoId
- Usar `revalidateForEntity("transacoes-pendentes")`
- Retornar `successResult` ou `handleActionError`

**Action 2: ignorarTransacaoPendente**
- Parâmetros: pendenteId (string)
- Obter usuário com `getUser()`
- Buscar transação pendente (filtrar por id E userId)
- Verificar se existe
- Atualizar status para 'ignorado' e processadoEm com data atual
- Usar `revalidateForEntity("transacoes-pendentes")`
- Retornar `successResult` ou `handleActionError`

**Action 3: editarTransacaoPendente**
- Parâmetros: pendenteId (string), dados (object parcial)
- Obter usuário com `getUser()`
- Buscar transação pendente (filtrar por id E userId)
- Verificar se existe e se status é 'pendente'
- Montar objeto de atualização apenas com campos fornecidos
- Atualizar transação pendente
- Usar `revalidateForEntity("transacoes-pendentes")`
- Retornar `successResult` ou `handleActionError`

**Action 4: excluirTransacaoPendente**
- Parâmetros: pendenteId (string)
- Obter usuário com `getUser()`
- Buscar transação pendente (filtrar por id E userId)
- Verificar se existe
- Deletar do banco de dados
- Usar `revalidateForEntity("transacoes-pendentes")`
- Retornar `successResult` ou `handleActionError`

Use os helpers: `handleActionError`, `successResult`, `errorResult`, `revalidateForEntity` de `@/lib/actions/helpers`

---

### PASSO 6: Criar Estrutura de Página
**Diretório novo:** `app/(dashboard)/transacoes-pendentes/`

Crie os seguintes arquivos:

**Arquivo 1: page.tsx**
- Server component
- Obter usuário com `getUser()`
- Buscar transações pendentes usando o data fetcher
- Buscar dados auxiliares necessários (contas, cartões, categorias, pagadores)
- Renderizar componente principal de listagem
- Incluir header com título "Transações Pendentes" e descrição
- Passar dados como props para componente client

**Arquivo 2: loading.tsx**
- Criar skeleton de loading
- Usar componentes skeleton do shadcn/ui
- Simular estrutura da página real

**Arquivo 3: data.ts** (opcional)
- Se preferir, separar as funções de fetch da page.tsx
- Criar função principal que agrega todos os fetches necessários
- Usar Promise.all para fetches paralelos

---

### PASSO 7: Criar Componentes da Feature
**Diretório novo:** `components/transacoes-pendentes/`

Crie os seguintes componentes:

**Componente 1: transacoes-pendentes-list.tsx**
- Client component (`"use client"`)
- Receber array de transações pendentes como prop
- Exibir lista/tabela com:
  - Data/hora da notificação
  - Nome do app/banco
  - Estabelecimento (se disponível)
  - Valor (se disponível)
  - Status (badge colorido)
  - Ações (botões: Processar, Ignorar, Excluir)
- Implementar estado de loading para ações
- Usar componentes do shadcn/ui (Card, Button, Badge, etc)
- Implementar filtros por status (tabs ou select)
- Incluir estado vazio quando não há transações

**Componente 2: processar-dialog.tsx**
- Client component
- Dialog/Modal para processar transação
- Receber transação pendente como prop
- Formulário com campos:
  - Descrição (Input text, pré-preenchido com estabelecimento ou notificationText)
  - Valor (Input number, pré-preenchido se disponível)
  - Data (DatePicker, pré-preenchido com dataHoraTransacao ou hoje)
  - Categoria (Select com categorias do usuário)
  - Conta ou Cartão (Select, mutuamente exclusivos)
  - Pagador (Select, opcional)
  - Observações (Textarea, opcional)
- Botões: "Salvar como Lançamento" e "Cancelar"
- Chamar action `processarTransacaoPendente` ao submeter
- Mostrar toast de sucesso/erro
- Fechar dialog após sucesso
- Usar componentes shadcn/ui (Dialog, Form, Input, Select, Button)

**Componente 3: detalhes-notificacao.tsx**
- Client component
- Receber transação pendente como prop
- Exibir em Card ou Accordion os dados brutos:
  - Nome do app
  - Package name
  - Título da notificação
  - Texto completo da notificação
  - Timestamp
- Design colapsável para não poluir interface

**Componente 4: empty-state.tsx**
- Component simples
- Mostrar quando não há transações pendentes
- Ícone ilustrativo
- Mensagem amigável
- Opcionalmente, link para documentação sobre o app Android

**Componente 5: transacao-pendente-card.tsx** (opcional)
- Component reutilizável para exibir uma transação
- Usar no list component
- Design responsivo

Use hooks do React (useState, useTransition) para gerenciar estados de loading e interatividade.

---

### PASSO 8: Atualizar Navegação do Sidebar
**Arquivo:** `components/sidebar/sidebar-nav.tsx`

Adicione um novo item ao array de navegação:
- title: "Transações Pendentes"
- icon: Escolha um ícone apropriado do Remix Icon (ex: RiNotificationLine, RiInboxLine)
- href: "/transacoes-pendentes"
- badge: true (para mostrar contador)

Implemente lógica para buscar e exibir o número de transações pendentes no badge.
Use a função `contarTransacoesPendentes` criada anteriormente.

---

### PASSO 9: Adicionar Badge Contador no Sidebar
**Modificação adicional no sidebar**

No componente do sidebar:
- Fazer fetch do contador de pendentes
- Passar como prop para o item de menu
- Exibir Badge apenas se contador > 0
- Badge deve mostrar o número
- Usar cor de destaque (ex: red ou orange)

Considere fazer este fetch no layout do dashboard para evitar múltiplos fetches.

---

### PASSO 10: Atualizar Configuração de Revalidação
**Arquivo:** `lib/actions/helpers.ts`

Localize o objeto `revalidateConfig` e adicione:
```
"transacoes-pendentes": ["/transacoes-pendentes", "/dashboard"],
```

Isso garante que após qualquer ação nas transações pendentes, tanto a página específica quanto o dashboard sejam revalidados.

---

### PASSO 11: Adicionar Types Helper (se necessário)
**Arquivo novo:** `components/transacoes-pendentes/types.ts`

Se necessário, crie tipos auxiliares para:
- Props dos componentes
- Dados agregados de transações com joins
- Estados de formulários
- Tipos estendidos que combinam dados de múltiplas tabelas

---

### PASSO 12: Implementar Toasts para Feedback
**Usar o sistema de toasts existente do projeto**

Nos componentes client:
- Importar e usar o toast do shadcn/ui
- Mostrar toasts de sucesso ao processar/ignorar/excluir
- Mostrar toasts de erro em caso de falha
- Mensagens em português brasileiro
- Incluir ícones nos toasts

---

### PASSO 13: Criar Loading States
**Em todos os componentes interativos:**

- Usar `useTransition` do React para ações assíncronas
- Desabilitar botões durante loading
- Mostrar spinners ou texto "Processando..."
- Prevenir múltiplos cliques
- Loading skeleton na página principal

---

### PASSO 14: Implementar Responsividade
**Em todos os componentes criados:**

- Design mobile-first
- Usar breakpoints do Tailwind (sm, md, lg)
- Tabela deve virar cards em mobile
- Dialogs devem ser full-screen em mobile
- Testar em diferentes tamanhos de tela

---

### PASSO 15: Adicionar Filtros e Busca (opcional)
**No componente de lista:**

Se desejado, adicione:
- Tabs para filtrar por status (Pendentes, Processadas, Ignoradas)
- Input de busca para filtrar por estabelecimento/descrição
- Filtro por data
- Filtro por app/banco

Use estado local do React para gerenciar filtros.

---

### PASSO 16: Tratamento de Erros Robusto
**Em todas as funções/actions:**

- Sempre usar try/catch
- Logs com console.error
- Mensagens de erro amigáveis ao usuário
- Validações de dados antes de processar
- Verificar permissões (userId)

---

### PASSO 17: Adicionar Confirmações
**Para ações destrutivas:**

- Confirmar antes de excluir (AlertDialog)
- Confirmar antes de ignorar (opcional)
- Feedback claro do que vai acontecer

Use o componente AlertDialog do shadcn/ui.

---

### PASSO 18: Otimizações de Performance
**Considere:**

- Paginação se houver muitas transações
- Lazy loading de componentes pesados
- Memoização com useMemo/useCallback onde apropriado
- Debounce em inputs de busca
- Prefetch de dados auxiliares

---

### PASSO 19: Testes Manuais
**Após implementação, teste:**

1. Criar transação pendente via API (use Postman ou curl)
2. Visualizar na página de transações pendentes
3. Processar uma transação → verificar se vira lançamento
4. Ignorar uma transação → verificar mudança de status
5. Excluir uma transação → verificar se some
6. Testar validações de formulário
7. Testar responsividade mobile
8. Testar contador no sidebar
9. Verificar revalidação de caches
10. Testar com múltiplos usuários (user scoping)

---

### PASSO 20: Dados de Teste/Seed (opcional)
**Criar script ou SQL para popular dados de teste:**

Crie algumas transações pendentes de exemplo:
- Com valores diferentes
- Com diferentes apps/bancos
- Com diferentes status
- Com e sem dados parseados

Isso facilita o desenvolvimento e testes da UI.

---

## Requisitos Técnicos Importantes

### Segurança
- ✅ SEMPRE filtrar queries por userId
- ✅ Validar todos os inputs com Zod
- ✅ Usar getUser() em todas as actions e API routes
- ✅ Nunca expor dados de outros usuários
- ✅ Sanitizar dados de notificações (podem vir de fonte externa)

### UX/UI
- ✅ Usar componentes shadcn/ui existentes
- ✅ Seguir padrão de cores do app
- ✅ Loading states em todas as ações assíncronas
- ✅ Toasts para feedback imediato
- ✅ Design responsivo (mobile-first)
- ✅ Mensagens em português brasileiro

### Performance
- ✅ Parallel fetching com Promise.all
- ✅ Evitar N+1 queries (usar joins)
- ✅ Considerar paginação para muitos dados
- ✅ Lazy loading de componentes pesados

### Padrões de Código
- ✅ TypeScript strict mode
- ✅ Imports organizados
- ✅ Server components por padrão
- ✅ Client components apenas quando necessário
- ✅ Comentários em português para lógica de negócio
- ✅ Nomes em inglês, UI em português

---

## Fluxo de Trabalho do Usuário Final

1. App Android captura notificação bancária
2. App envia para API do OpenSheets (POST /api/transacoes-pendentes)
3. Transação salva com status 'pendente'
4. Usuário vê notificação/badge no sidebar
5. Usuário acessa página "Transações Pendentes"
6. Lista mostra todas as transações capturadas
7. Usuário clica em "Processar" em uma transação
8. Dialog abre com formulário pré-preenchido
9. Usuário edita/completa informações (categoria, conta, etc)
10. Usuário clica "Salvar como Lançamento"
11. Sistema cria lançamento real e marca pendente como 'processado'
12. Toast de sucesso aparece
13. Lista atualiza automaticamente
14. Transação some da lista de pendentes (ou vai para aba "Processadas")

---

## Observações Importantes

- ❗ O app Android NÃO faz parte desta implementação
- ❗ Foco total na interface web de revisão e processamento
- ❗ Assumir que notificações podem vir incompletas
- ❗ Usuário deve ter controle total antes da conversão final
- ❗ Manter histórico completo (não deletar processadas)
- ❗ Segurança de dados é CRÍTICA (user scoping)

---

## Ordem Sugerida de Implementação

1. ✅ Schema + migrations (PASSO 1)
2. ✅ Schemas Zod (PASSO 2)
3. ✅ API endpoints (PASSO 3)
4. ✅ Data fetchers (PASSO 4)
5. ✅ Server actions (PASSO 5)
6. ✅ Página e estrutura (PASSO 6)
7. ✅ Componentes UI (PASSO 7)
8. ✅ Navegação sidebar (PASSO 8-9)
9. ✅ Revalidação config (PASSO 10)
10. ✅ Polimentos finais (PASSOS 11-19)
11. ✅ Testes e ajustes (PASSO 20)

---

## Resultado Esperado

Ao final da implementação, você terá:

✅ Uma nova tabela `transacoes_pendentes` no banco de dados
✅ API funcionando para receber notificações externas
✅ Página completa para gerenciar transações pendentes
✅ Sistema de processamento que converte pendentes em lançamentos
✅ UI intuitiva e responsiva
✅ Navegação integrada com badge de contador
✅ Validações robustas e tratamento de erros
✅ Segurança garantida com user scoping
✅ Código organizado seguindo padrões do projeto

---

## Próximos Passos Futuros (não fazer agora)

- 📱 Desenvolvimento do app Android
- 🔐 Sistema de API key/autenticação para o app
- 🤖 Parser inteligente de notificações (regex, NLP, AI)
- 🎯 Auto-categorização baseada em histórico
- 💡 Sugestões inteligentes de categoria/pagador
- 📊 Analytics de transações automáticas
- 🔔 Notificações web quando nova pendente chega

---

Siga os passos na ordem sugerida, consultando sempre o CLAUDE.md e os arquivos de referência do projeto. Mantenha consistência com os padrões existentes. Boa implementação!