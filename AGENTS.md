# AGENTS.md - SocialBluePro Agent Guidelines (v2.3.1)

**Documento mandatório para todos os agents AI operando neste codebase.**

> **Última atualização:** 2026-02-13  
> **Versão:** 2.3.1  
> **Projeto:** SocialBluePro - Sistema de Gestão de Leads e Marketing

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Comandos Obrigatórios](#3-comandos-obrigatórios)
4. [Arquitetura e Padrões](#4-arquitetura-e-padrões)
5. [Estrutura de Arquivos](#5-estrutura-de-arquivos)
6. [Convenções de Código](#6-convenções-de-código)
7. [Server Actions](#7-server-actions)
8. [UI e Estilização](#8-ui-e-estilização)
9. [Banco de Dados](#9-banco-de-dados)
10. [Versionamento e Releases](#10-versionamento-e-releases)
11. [Regras Específicas](#11-regras-específicas)
12. [Checklist Pré-commit](#12-checklist-pré-commit)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Visão Geral do Projeto

**SocialBluePro** é uma plataforma full-stack para empresas de paisagismo em Denver, Colorado, combinando:

- **Website de Conversão**: Landing page otimizada
- **CRM Interno**: Gestão completa de leads
- **Email Marketing**: Campanhas com templates profissionais
- **Analytics**: Dashboard de métricas em tempo real
- **Remarketing Automation**: Segmentação automática

### Áreas Principais
| Área | Rota | Funcionalidade |
|------|------|----------------|
| **Public** | `/` | Homepage com Hero, Services, About, Testimonials |
| **Lead Capture** | `/request` | Formulário de orçamento com validações |
| **Contact** | `/contact` | Formulário de mensagens com anti-bot |
| **About** | `/about` | Página institucional Sobre nós |
| **FAQ** | `/faq` | Perguntas frequentes |
| **Services** | `/services` | Lista de serviços disponíveis |
| **Service Detail** | `/services/[slug]` | Página individual de serviço |
| **Locations** | `/locations/[city]` | Páginas de cidades (SEO local) |
| **Admin** | `/admin/*` | Dashboard, CRM, Campanhas, Analytics, Settings, Messages, Tools |

---

## 🔄 Estado Atual do Trabalho

**⚠️ CRITICAL: Esta seção deve ser mantida atualizada a cada milestone!**

**SEMPRE que iniciar uma sessão, verifique o que está em andamento:**

### Tarefa Atual
- ✅ v2.3.0 Contact Message System & Autonomous Git Workflow - CONCLUÍDO
- ✅ v2.3.1 Marketing Tools UX Fixes & UI Standardization - CONCLUÍDO

### Progresso
- [x] v2.3.1 - Marketing Tools UX Fixes & UI Standardization - CONCLUÍDO
- [x] Documentação atualizada (CHANGELOG, README, AGENTS.md)
- [x] Versão do projeto atualizada para 2.3.1

### Próximos Passos
- [x] Aplicar migration pendente do Prisma (UTM fields) - CONCLUÍDO
- [x] Executar lint e build para validação - CONCLUÍDO (build OK, lint com problema de configuração)
- [x] Commit e push das atualizações de documentação - CONCLUÍDO

### Último Commit
- Versão: 2.3.1
- Feature: Atualização completa da documentação para v2.3.1

**Status:** ✅ Todas as documentações atualizadas e push realizado para main

---

## 🧠 Controle de Contexto

### Regras Anti-Esquentamento (IMPORTANTE para modelos Google/Gemini)

**SEJA ultra-conciso:**
- Respostas máximo 3-4 linhas
- Uma linha = ideal
- NUNCA parágrafos longos

**Limite de ações por ciclo:**
- Máximo 5 ações consecutivas sem pausa
- Após 5 ações: pause e confirme com usuário
- Pergunta: "✅ 5 ações completadas. Continuar ou pausar?"

**Cooldown inteligente:**
- Trabalhos complexos: pause naturalmente
- Ex: "Analisando estrutura..." → aguarde → "Próximo passo..."
- Evita acúmulo de contexto desnecessário

**Economia de tokens:**
- NÃO repita o que o usuário já sabe
- NÃO explique o óbvio ("Estou abrindo o arquivo...")
- NÃO faça múltiplas ações sem confirmação

**Ferramentas por resposta:**
- Máximo 2-3 ferramentas por vez
- Se precisar de mais: divida em múltiplas respostas
- Ordem: Leitura → Análise → Execução (nunca tudo junto)

### Exemplos de Comunicação Concisa

**❌ INCORRETO (esquentando):**
"Vou analisar o código cuidadosamente para entender a estrutura do componente AdminNavigation. Primeiro, deixe-me abrir o arquivo para ver como ele está implementado atualmente..."

**✅ CORRETO:**
"Analisando AdminNavigation..."

---

## 2. Stack Tecnológico

### Framework e Core
| Componente | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 15.0.3 | App Router, Server Components |
| **React** | 19.0.0 | UI Library |
| **TypeScript** | 5.x | Strict Mode Obrigatório |
| **Tailwind CSS** | 4.x | Utility-first CSS |

### Banco de Dados
| Componente | Versão | Uso |
|------------|--------|-----|
| **PostgreSQL** | 14+ | Banco relacional |
| **Prisma** | 7.2.0 | ORM e migrations |

### Autenticação e Segurança
| Componente | Versão | Uso |
|------------|--------|-----|
| **NextAuth.js** | 5.0.0-beta.30 | Autenticação |
| **bcryptjs** | 3.0.3 | Hash de senhas |

### Email
| Componente | Versão | Uso |
|------------|--------|-----|
| **Nodemailer** | 7.0.12 | Envio SMTP |

### UI/UX
| Componente | Versão | Uso |
|------------|--------|-----|
| **lucide-react** | 0.562.0 | Ícones |
| **framer-motion** | 12.23.26 | Animações |
| **clsx** | 2.1.1 | Classes condicionais |
| **tailwind-merge** | 3.4.0 | Merge de classes |

### Validação
| Componente | Versão | Uso |
|------------|--------|-----|
| **validator** | 13.15.26 | Validação strings |
| **libphonenumber-js** | 1.12.33 | Validação telefones US |

---

## 3. Comandos Obrigatórios

### ⚠️ ANTES de qualquer commit:

```bash
npm run lint     # Verifica erros de ESLint
npm run build    # Verifica build de produção
```

### Scripts do Projeto (package.json)

| Comando | Uso | Quando usar |
|---------|-----|-------------|
| `npm run dev` | Desenvolvimento local | **NUNCA** em execução de agent |
| `npm run build` | Build produção | **SEMPRE** antes de commit |
| `npm run start` | Servidor produção | Apenas via `init.sh prod` |
| `npm run lint` | ESLint | **SEMPRE** antes de commit |

### Scripts de Lifecycle (init.sh)

| Comando | Descrição |
|---------|-----------|
| `./init.sh setup` | Instala deps + configura Prisma |
| `./init.sh prod` | Build + start produção |
| `./init.sh stop` | Para servidor |
| `./init.sh clean` | Remove caches (.next, logs) |

---

## 🔄 Automação Git/GitHub (Vibe-Code Philosophy)

### Autonomia e Fluxo de Trabalho

**O Agent deve agir como um Desenvolvedor Sênior autônomo. Não queremos burocracia, queremos resultados seguros.**

**Regras de Ouro:**
1. ✅ **Merge Direto na Main:** Se a alteração (feature ou fix) passar no `npm run lint` e `npm run build`, o agent tem autonomia total para fazer o merge e push direto na `main`.
2. ✅ **Fim dos PRs Manuais:** Não abra Pull Requests para o dono do projeto. O agent resolve o fluxo de git de ponta a ponta.
3. ❌ **Consultar apenas em casos CRÍTICOS:** Peça confirmação apenas para ações destrutivas ou irreversíveis (ex: `force push`, deletar histórico git, apagar bancos de dados de produção).
4. ✅ **Segurança em Primeiro Lugar:** O push só acontece se o build estiver VERDE.

### Política de Commits e Push

- ✅ **Commit AUTOMÁTICO:** Sempre após validação de sucesso.
- ✅ **Mensagem em PORTUGUÊS:** Clara e objetiva.
- ✅ **Push AUTOMÁTICO:** Sempre para a branch `main` após validação.
- ❌ **Sem Perguntas:** Não pergunte "posso commitar?" ou "posso enviar?". Execute se estiver seguro.

### Fluxo Técnico Recomendado:
1. Desenvolver em branch temporária (opcional para organização).
2. Rodar `npm run lint` e `npm run build`.
3. Se OK: Merge na `main` e `git push origin main`.
4. Informar ao usuário: "✅ Código atualizado e disponível para produção."

### Regras de Commit

**SEMPRE execute ANTES de commitar:**
```bash
npm run lint     # Deve passar sem erros
npm run build    # Deve completar com sucesso
```

**Formato da mensagem (Português):**
```
<tipo>: <descrição breve>

[detalhes opcionais]
```

Tipos permitidos:
- `fix:` - Correção de bug
- `feat:` - Nova funcionalidade
- `refactor:` - Refatoração
- `docs:` - Documentação
- `style:` - Estilização/CSS
- `chore:` - Tarefas de manutenção

### Exemplos de Execução

**Alteração simples (automática):**
```bash
# Após editar arquivo...
npm run lint && npm run build
git add .
git commit -m "fix: corrige espaçamento do header mobile"
git push origin main
# Informar usuário: "✅ Alteração commitada e enviada!"
```

**Alteração grande (PR automático):**
```bash
# Criar branch...
git checkout -b feature/nova-funcionalidade
# ... múltiplos commits ...
git push -u origin feature/nova-funcionalidade
gh pr create --title "feat: adiciona nova funcionalidade" --body "..."
# Informar usuário: "🚀 PR criado: https://github.com/..."
```

### Segurança

**NUNCA:**
- Force push em main/master
- Commite arquivos sensíveis (.env, credentials.json)
- Altere versões do projeto sem permissão explícita

**SEMPRE:**
- Valide antes de commitar
- Mensagens em português
- Informe usuário do commit

---

## 4. Arquitetura e Padrões

### Server Actions (Padrão Principal)

**REGRA DE OURO:** Todas as operações de dados usam Server Actions.

```typescript
// ✅ CORRETO
// src/actions/leads.ts
"use server";

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany();
    return { success: true, data: leads };
  } catch (error) {
    console.error("[LEADS] Error:", error);
    return { success: false, error: "Failed to fetch leads" };
  }
}

// ❌ INCORRETO - Não use API routes para CRUD
// src/app/api/leads/route.ts
export async function GET() {
  // NÃO FAÇA ISSO
}
```

### Retorno Padrão das Actions

```typescript
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Exemplo de uso:
const result = await getLeads();
if (result.success) {
  // use result.data
} else {
  // use result.error
}
```

### Real-Time Polling

Use `useRealTimePoll` para dados que precisam atualizar automaticamente:

```typescript
// src/lib/hooks/useRealTimePoll.ts
const { data, loading, refetch } = useRealTimePoll({
  fetchFunction: async () => {
    // sua função aqui
  },
  interval: 30000, // 30 segundos
  enabled: true
});
```

**⚠️ IMPORTANTE:** O componente `LiveIndicator` foi removido. **NUNCA** o reintroduza.

---

## 5. Estrutura de Arquivos

### Regras de Organização

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout
│   ├── login/page.tsx     # Login
│   ├── request/   # Formulário
│   └── admin/             # Área admin
│       ├── page.tsx       # Dashboard
│       ├── layout.tsx     # Layout protegido
│       ├── leads/page.tsx # CRM
│       ├── campaigns/     # Email marketing
│       ├── analytics/     # Métricas
│       ├── remarketing/   # Automação
│       └── settings/      # Configurações
│
├── components/
│   ├── ui/                # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── QuoteModal.tsx
│   │   ├── LeadDetailModal.tsx
│   │   ├── PageContainer.tsx
│   │   ├── Toast.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── BackToTop.tsx
│   ├── providers/         # Providers React
│   ├── admin/             # Componentes admin
│   ├── sections/          # Seções da landing
│   └── [Outros componentes de página]
│
├── actions/               # Server Actions
│   ├── auth.ts
│   ├── leads.ts
│   ├── campaigns.ts
│   ├── email.ts
│   ├── email-tracking.ts
│   ├── campaign-analytics.ts
│   ├── remarketing.ts
│   ├── users.ts
│   ├── settings.ts
│   └── lead-notes.ts
│
└── lib/
    ├── hooks/             # Custom hooks
    ├── validation/        # Dados de validação
    ├── prisma.ts          # Cliente Prisma
    ├── toast.tsx          # Sistema de toast
    ├── validators.ts      # Funções de validação
    ├── client-validation.ts
    ├── mail.ts            # Config SMTP
    ├── attachments.ts     # Anexos
    └── utils.ts           # Utilitários
```

### ⚠️ REGRAS DE ARQUIVOS:

1. **NUNCA** crie arquivos na raiz do projeto (exceto documentação)
2. **SEMPRE** use imports absolutos via `@/`
3. **NUNCA** use imports relativos (`../../`)
4. **SEMPRE** coloque componentes reutilizáveis em `components/ui/`
5. **SEMPRE** coloque Server Actions em `actions/`

---

## 6. Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Componentes** | PascalCase | `LeadDetailModal.tsx` |
| **Páginas** | PascalCase | `AdminDashboard.tsx` |
| **Funções** | camelCase | `handleSubmit` |
| **Variáveis** | camelCase | `campaignError` |
| **Actions** | camelCase | `getAllAnalytics` |
| **Interfaces** | PascalCase | `interface Lead` |
| **Types** | PascalCase | `type Status = "new" \| "closed"` |

### Imports (ORDEM OBRIGATÓRIA)

```typescript
// 1. Node modules
import { useState, useEffect } from "react";
import { Mail, User } from "lucide-react";

// 2. Absolute imports (@/)
import { getLeads } from "@/actions/leads";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/toast";

// 3. Relative imports (apenas se necessário)
import { helper } from "./utils";
```

### TypeScript - Strict Mode

```typescript
// ✅ CORRETO - Tipar tudo
interface Lead {
  id: string;
  name: string;
  email: string;
  status: "new" | "contacted" | "closed";
}

function processLead(lead: Lead): string {
  return lead.name;
}

// ❌ INCORRETO - Não tipar
function processLead(lead) {
  return lead.name;
}
```

---

## 7. Server Actions

### Estrutura Padrão

```typescript
"use server";

import { prisma } from "@/lib/prisma";

// Interface de retorno
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function minhaAction(dados: DadosInput): Promise<ActionResult<Output>> {
  try {
    // Validação
    if (!dados.campo) {
      return { success: false, error: "Campo obrigatório" };
    }

    // Operação no banco
    const resultado = await prisma.model.create({
      data: dados
    });

    // Log de sucesso
    console.log("[ACTION] Sucesso:", resultado.id);

    return { success: true, data: resultado };
  } catch (error) {
    // Log de erro com prefixo
    console.error("[ACTION] Error:", error);
    return { success: false, error: "Mensagem amigável" };
  }
}
```

### Prefixos de Log

Use prefixes para identificar a origem:

```typescript
console.error("[LEADS] Error fetching leads:", error);
console.error("[CAMPAIGNS] Failed to send:", error);
console.error("[SETTINGS] SMTP test failed:", error);
console.error("[AUTH] Login failed:", error);
```

---

## 8. UI e Estilização

### Tailwind CSS

```typescript
// ✅ CORRETO - Use classes Tailwind
<button className="bg-accent text-white px-4 py-2 rounded-lg">
  Enviar
</button>

// ❌ INCORRETO - Não use styled-components ou CSS modules
const Button = styled.button`
  background: green;
`;
```

### Classes Condicionais

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso:
<button className={cn(
  "bg-accent text-white px-4 py-2 rounded-lg",
  isLoading && "opacity-50 cursor-not-allowed",
  variant === "danger" && "bg-red-500"
)}>
```

### Design Tokens

```css
/* Cores */
--color-accent: #22c55e;           /* green-500 */
--color-accent-dark: #16a34a;      /* green-600 */
--color-accent-accessible: #15803d; /* green-700 */
--color-primary: #0f172a;          /* slate-900 */

/* Tipografia */
--font-sans: Inter, system-ui, sans-serif;
--font-serif: Playfair Display, serif;
```

### Mobile-First

```typescript
// ✅ CORRETO - Mobile-first
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-lg md:text-xl lg:text-2xl">
</div>

// Touch targets mínimos
<button className="min-h-[44px] min-w-[44px]">
```

### Toast Notifications

```typescript
import { useToast } from "@/lib/toast";

const { addToast } = useToast();

// Sucesso
addToast("✅ Lead criado com sucesso", "success");

// Erro
addToast("❌ Falha ao criar lead", "error");

// Info
addToast("ℹ️ Processando...", "info");
```

---

## 9. Banco de Dados

### Prisma Client

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Uso nas Actions

```typescript
"use server";

import { prisma } from "@/lib/prisma";

export async function getLeads() {
  const leads = await prisma.lead.findMany({
    orderBy: { created_at: "desc" },
    take: 100
  });
  return leads;
}
```

### Migrations

```bash
# Após alterar schema.prisma:
npx prisma migrate dev --name descricao_da_mudanca

# Gerar cliente:
npx prisma generate
```

---

## 10. Versionamento e Releases

### Política de Versionamento (Semantic Versioning)

O projeto segue **Semantic Versioning 2.0.0**:

```
MAJOR.MINOR.PATCH
```

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| **MAJOR** | Mudanças incompatíveis (breaking changes) | `2.0.0` → `3.0.0` |
| **MINOR** | Novas funcionalidades (backwards compatible) | `2.1.0` → `2.2.0` |
| **PATCH** | Correções de bugs (backwards compatible) | `2.1.0` → `2.1.1` |

### Automação com semantic-release

O versionamento é **automático** via GitHub Actions:

1. **Commits** seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` → bump MINOR
   - `fix:` → bump PATCH
   - `BREAKING CHANGE:` → bump MAJOR

2. **GitHub Actions** (`.github/workflows/release.yml`):
   - Roda em todo push para `main`
   - Executa build e validação
   - Cria tag e release automaticamente
   - Atualiza `CHANGELOG.md` e `package.json`

3. **Componente VersionBadge** (`src/components/ui/VersionBadge.tsx`):
   - Mostra versão atual no footer admin
   - Verifica atualizações via `/api/version`
   - Notifica quando há nova versão disponível

### API de Versão

Endpoint: `GET /api/version`

```json
{
  "current": "2.3.1",
  "latest": "2.3.1",
  "upToDate": true,
  "releaseUrl": "https://github.com/...",
  "publishedAt": "2026-02-13T..."
}
```

### Backfill de Releases

Script para criar releases históricas:

```bash
# Definir token
export GH_TOKEN=seu_token_github

# Executar
node scripts/backfill-releases.js
```

### Comandos Úteis

```bash
# Ver versão atual
node -p "require('./package.json').version"

# Criar release manual (não recomendado)
npx semantic-release --dry-run

# Verificar status das releases
gh release list
```

### Checklist de Nova Versão

- [ ] Commits seguem convenção (feat/fix/BREAKING CHANGE)
- [ ] `CHANGELOG.md` atualizado manualmente (opcional)
- [ ] Build passa (`npm run build`)
- [ ] GitHub Actions cria release automaticamente
- [ ] Tag criada no formato `vX.Y.Z`
- [ ] Release notes publicadas no GitHub

---

## 11. Regras Específicas

### ⚠️ PROIBIDO:

1. **NUNCA** reintroduza o `LiveIndicator` componente
2. **NUNCA** use Supabase client diretamente (use Prisma)
3. **NUNCA** crie arquivos na raiz do projeto
4. **NUNCA** use imports relativos (`../../`)
5. **NUNCA** use `console.log` sem prefixo de módulo
6. **NUNCA** deixe de tratar erros em try/catch
7. **NUNCA** use `any` sem justificativa
8. **NUNCA** force push em main/master
9. **NUNCA** commite arquivos sensíveis (.env, credentials.json)
10. **NUNCA** altere versões do projeto sem permissão explícita

### ⚠️ OBRIGATÓRIO:

1. **SEMPRE** use strict mode TypeScript
2. **SEMPRE** retorne `{ success, data, error }` nas actions
3. **SEMPRE** use imports absolutos `@/`
4. **SEMPRE** valide inputs antes de operações no banco
5. **SEMPRE** use `console.error` com prefixo em erros
6. **SEMPRE** use `useToast` para feedback ao usuário
7. **SEMPRE** execute `npm run lint` e `npm run build` antes de commit
8. **SEMPRE** commite automaticamente alterações simples (lint/build OK)
9. **SEMPRE** use mensagens de commit em PORTUGUÊS
10. **SEMPRE** pause após 5 ações e confirme com usuário
11. **SEMPRE** seja ultra-conciso nas respostas (máx 3-4 linhas)
10. **SEMPRE** atualize "Estado Atual do Trabalho" a cada milestone
11. **SEMPRE** pause após 5 ações e confirme com usuário
12. **SEMPRE** seja ultra-conciso nas respostas (máx 3-4 linhas)

---

## 12. Checklist Pré-commit

Antes de finalizar qualquer alteração:

```markdown
- [ ] Código segue as convenções de nomenclatura
- [ ] Imports estão na ordem correta (node → @/ → relative)
- [ ] Todos os tipos estão definidos (strict mode)
- [ ] Server Actions retornam { success, data?, error? }
- [ ] Erros são logados com console.error("[PREFIX]...")
- [ ] Feedback ao usuário via useToast()
- [ ] Nenhum arquivo criado na raiz do projeto
- [ ] Nenhum import relativo (../../)
- [ ] npm run lint → 0 erros
- [ ] npm run build → sucesso
```

---

## 13. Troubleshooting

### Erros Comuns

#### "Cannot find module '@/...'"
- Verifique o path no alias `@/`
- Confirme que o arquivo existe

#### "PrismaClient is not defined"
- Importe de `@/lib/prisma`
- Não crie nova instância do PrismaClient

#### "useToast is not defined"
- Importe de `@/lib/toast`
- Use dentro de Client Components ("use client")

#### Build falha
```bash
# Limpe e reinstale
./init.sh clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug

```typescript
// Debug de Server Action
"use server";

export async function debugAction(data: any) {
  console.log("[DEBUG] Input:", data);
  
  try {
    const result = await prisma.model.findMany();
    console.log("[DEBUG] Result:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return { success: false, error: String(error) };
  }
}
```

---

## 📞 Suporte para Agents

Em caso de dúvidas:
1. Consulte este documento
2. Verifique exemplos existentes no codebase
3. Siga os padrões dos arquivos vizinhos
4. Priorize consistência sobre inovação

---

**Documento mantido por:** AI Agents  
**Frequência de atualização:** A cada mudança significativa no stack
