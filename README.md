# SocialBluePro - Sistema de Gestão de Leads e Marketing

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1)](https://www.postgresql.org/)

> Plataforma full-stack para gestão de leads, email marketing e automação de remarketing para empresas de paisagismo.

---

## 📋 Índice

- [Instalação Rápida](#instalação-rápida)
- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Páginas e Rotas](#páginas-e-rotas)
- [Banco de Dados](#banco-de-dados)
- [Design System](#design-system)
- [Comandos](#comandos)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Contribuição](#contribuição)

---

## 🎯 Visão Geral

**SocialBluePro** é uma aplicação web moderna que combina:

- **Website de Conversão**: Landing page otimizada para captura de leads
- **CRM Interno**: Gestão completa de leads com filtros avançados
- **Email Marketing**: Campanhas com templates profissionais e tracking
- **Analytics**: Dashboard de métricas de email em tempo real
- **Remarketing Automation**: Segmentação automática e campanhas agendadas
- **Sistema Multi-usuário**: Autenticação segura com proteção brute-force

---

## 🚀 Instalação Rápida

### Instalação Automatizada (Ubuntu/Debian)

Execute em seu servidor:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

**O que o script faz:**
- Instala Node.js 18+, PostgreSQL e dependências
- Cria banco de dados e usuário dedicado
- Gera credenciais de admin **aleatórias e seguras**
- Configura e inicia o serviço automaticamente
- Roda em `localhost:3000` (acessível via IP:3000)

**Credenciais serão mostradas no terminal ao final da instalação.**

### Acesso Após Instalação

- **Local**: http://localhost:3000
- **Rede**: http://SEU-IP:3000
- **Credenciais**: Mostradas no terminal (ex: `admin-a3f5@local.system` / `xK9mP2nQ7rT5vWjL`)
- **Arquivo de credenciais**: `/root/.socialbluepro-credentials`

### Comandos do Sistema

```bash
sudo systemctl start socialbluepro   # Iniciar
sudo systemctl stop socialbluepro    # Parar
sudo systemctl status socialbluepro  # Status
```

---

## 🚀 Tecnologias

### Core Stack
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 15.0.3 | Framework React com App Router |
| **React** | 19.0.0 | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática (Strict Mode) |
| **Tailwind CSS** | 4.x | Framework CSS utility-first |
| **PostgreSQL** | 14+ | Banco de dados relacional |
| **Prisma** | 7.2.0 | ORM moderno |

### Bibliotecas Principais
```json
{
  "next-auth": "5.0.0-beta.30",      // Autenticação
  "nodemailer": "7.0.12",            // Envio de emails
  "lucide-react": "0.562.0",         // Ícones
  "framer-motion": "12.23.26",       // Animações
  "bcryptjs": "3.0.3",               // Hash de senhas
  "validator": "13.15.26",           // Validação de strings
  "libphonenumber-js": "1.12.33"     // Validação de telefones
}
```

---

## 🏗️ Arquitetura

### Padrão: Next.js 15 App Router + Server Actions

**Características:**
- **Server Actions**: Todas as operações CRUD usam Server Actions (`"use server"`)
- **Server Components**: Por padrão, Client Components apenas onde necessário
- **Data Fetching**: Via Server Actions com Prisma ORM
- **Autenticação**: NextAuth.js v5 com credentials provider
- **Middleware**: Proteção de rotas `/admin/*`

### Fluxo de Dados
```
Client Component → Server Action → Prisma ORM → PostgreSQL
                       ↓
              Retorno: { success, data, error }
```

---

## 📁 Estrutura do Projeto

```
socialbluepro/
├── 📁 src/
│   ├── 📁 app/                          # Next.js App Router
│   │   ├── 📄 page.tsx                  # Homepage (Landing)
│   │   ├── 📄 layout.tsx                # Root layout
│   │   ├── 📄 globals.css               # Estilos globais Tailwind
│   │   ├── 📁 login/                    # Página de login
│   │   ├── 📁 request-service/          # Formulário de orçamento
│   │   ├── 📁 terms/                    # Termos de serviço
│   │   ├── 📁 privacy/                  # Política de privacidade
│   │   ├── 📁 admin/                    # Área administrativa
│   │   │   ├── 📄 page.tsx              # Dashboard
│   │   │   ├── 📄 layout.tsx            # Layout protegido
│   │   │   ├── 📄 AdminNavigation.tsx   # Navegação admin
│   │   │   ├── 📁 leads/                # CRM Leads
│   │   │   ├── 📁 campaigns/            # Email Marketing
│   │   │   ├── 📁 analytics/            # Analytics
│   │   │   ├── 📁 remarketing/          # Automação Remarketing
│   │   │   └── 📁 settings/             # Configurações
│   │   └── 📁 api/                      # API Routes
│   │       ├── 📁 leads/                # POST /api/leads
│   │       ├── 📁 auth/                 # NextAuth routes
│   │       ├── 📁 track/                # Tracking pixel/click
│   │       └── 📁 uploads/              # Upload de arquivos
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                       # Componentes reutilizáveis
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Card.tsx
│   │   │   ├── 📄 Table.tsx
│   │   │   ├── 📄 QuoteModal.tsx
│   │   │   ├── 📄 LeadDetailModal.tsx
│   │   │   ├── 📄 PageContainer.tsx
│   │   │   ├── 📄 Toast.tsx
│   │   │   ├── 📄 ConfirmModal.tsx
│   │   │   └── 📄 BackToTop.tsx
│   │   ├── 📁 providers/                # Providers React
│   │   │   └── 📄 ToastProvider.tsx
│   │   ├── 📁 admin/                    # Componentes admin
│   │   │   └── 📄 DefaultPasswordWarning.tsx
│   │   ├── 📁 sections/                 # Seções da landing
│   │   │   └── 📄 AboutSection.tsx
│   │   ├── 📄 Hero.tsx                  # Hero section
│   │   ├── 📄 Services.tsx              # Grid de serviços
│   │   ├── 📄 Navbar.tsx                # Navegação
│   │   ├── 📄 Footer.tsx                # Rodapé
│   │   ├── 📄 LeadMagnet.tsx            # Captura de leads
│   │   ├── 📄 ServiceArea.tsx           # Área de atuação
│   │   └── 📄 Testimonials.tsx          # Depoimentos
│   │
│   ├── 📁 actions/                      # Server Actions
│   │   ├── 📄 auth.ts                   # Autenticação
│   │   ├── 📄 leads.ts                  # Gestão de leads
│   │   ├── 📄 campaigns.ts              # Campanhas
│   │   ├── 📄 email.ts                  # Envio de emails
│   │   ├── 📄 email-tracking.ts         # Tracking
│   │   ├── 📄 campaign-analytics.ts     # Analytics
│   │   ├── 📄 remarketing.ts            # Remarketing
│   │   ├── 📄 users.ts                  # Usuários
│   │   ├── 📄 settings.ts               # Configurações
│   │   └── 📄 lead-notes.ts             # Notas de leads
│   │
│   ├── 📁 lib/                          # Bibliotecas e utilitários
│   │   ├── 📁 hooks/
│   │   │   └── 📄 useRealTimePoll.ts    # Polling 30s
│   │   ├── 📁 validation/
│   │   │   ├── 📄 address-suffixes.ts
│   │   │   ├── 📄 colorado-data.ts
│   │   │   └── 📄 disposable-email-list.ts
│   │   ├── 📄 prisma.ts                 # Cliente Prisma
│   │   ├── 📄 toast.tsx                 # Sistema de toast
│   │   ├── 📄 validators.ts             # Validações
│   │   ├── 📄 client-validation.ts      # Validações client-side
│   │   ├── 📄 mail.ts                   # Configuração SMTP
│   │   ├── 📄 attachments.ts            # Gerenciamento de anexos
│   │   └── 📄 utils.ts                  # Utilitários
│   │
│   ├── 📄 auth.ts                       # Configuração NextAuth
│   └── 📄 middleware.ts                 # Middleware de proteção
│
├── 📁 prisma/
│   └── 📄 schema.prisma                 # Schema do banco de dados
│
├── 📁 public/                           # Assets estáticos
│   └── 📁 imgs/                         # Imagens otimizadas
│
├── 📄 package.json                      # Dependências
├── 📄 next.config.ts                    # Configuração Next.js
├── 📄 tailwind.config.js                # Configuração Tailwind
├── 📄 tsconfig.json                     # Configuração TypeScript
├── 📄 .env                              # Variáveis de ambiente
├── 📄 init.sh                           # Script de setup/deploy
├── 📄 README.md                         # Este arquivo
└── 📄 AGENTS.md                         # Guidelines para agents
```

---

## ✨ Funcionalidades

### 🌐 Website Público

#### Homepage (`/`)
- **Hero Section**: Imagem de fundo otimizada, CTA principal
- **Services Grid**: 8 serviços clicáveis (Sod, Hardscaping, Weed, Mulch, etc)
- **About Section**: História e certificações Colorado
- **Service Area**: Mapa de área de atuação (Denver metro)
- **Testimonials**: Carrossel de depoimentos
- **Lead Magnet**: Captura de leads final
- **Quote Modal**: Abre via CTA, trigger inteligente (mouseleave ou 45s)

#### Request Service (`/request-service`)
Formulário completo com validações:
- **Campos**: Nome, telefone (validação US), email, endereço, cidade, ZIP
- **Validações em tempo real**: Telefone, email (bloqueio de domínios temporários), ZIP Colorado
- **Upload**: Fotos (até 25MB) e vídeos (até 500MB), total 1GB
- **Serviços**: Sod, Hardscaping, Weed, Mulch, Spring Clean Up, Snow Removal

### 🔐 Área Administrativa

#### Dashboard (`/admin`)
- Métricas em tempo real (leads, campanhas, taxas)
- Lista de leads recentes
- CTA para campanhas

#### CRM - Leads (`/admin/leads`)
- Lista completa com busca e filtros avançados
- Filtros: Status, serviço, usuário, cidade, ZIP, datas
- Ações: Atribuir, mudar status, ver detalhes, deletar
- Exportação CSV

#### Campanhas (`/admin/campaigns`)
- 6 templates HTML profissionais
- Editor com preview em tempo real
- Segmentação de audiência (9 filtros)
- Merge tags: `{name}`, `{city}`, `{state}`, `{service}`
- Métodos: Send Now, Schedule, Batch
- Teste de email

#### Analytics (`/admin/analytics`)
- Métricas: Sent, Opened, Clicked, Open Rate, Click Rate, Bounced
- Tabela detalhada com status, device type
- Filtros por campanha e status
- Exportação CSV

#### Remarketing (`/admin/remarketing`)
- 4 segmentos automáticos:
  - **Hot Leads**: Engajados <30 dias
  - **Warm Leads**: Sem contato 30-60 dias
  - **Cold Leads**: Dormantes >90 dias
  - **Sem Conversão**: Status "new" >7 dias
- Campanhas agendadas por segmento

#### Settings (`/admin/settings`)
- **Email Channels**: Múltiplas contas SMTP, teste de conexão
- **Users**: CRUD, desbloqueio, reset de senha
- **Integrations**: reCAPTCHA (Google, hCaptcha, Turnstile), Tracking Pixels

---

## 🛣️ Páginas e Rotas

### Públicas
| Rota | Descrição | Componentes Principais |
|------|-----------|----------------------|
| `/` | Homepage | Hero, Services, About, Testimonials |
| `/request-service` | Formulário de orçamento | RequestFormContent |
| `/login` | Login admin | LoginPage |
| `/terms` | Termos de serviço | TermsPage |
| `/privacy` | Política de privacidade | PrivacyPage |

### Admin (Protegidas)
| Rota | Descrição | Funcionalidades |
|------|-----------|----------------|
| `/admin` | Dashboard | Métricas, leads recentes |
| `/admin/leads` | CRM | Lista, filtros, export |
| `/admin/campaigns` | Email Marketing | Templates, editor, envio |
| `/admin/analytics` | Analytics | Métricas, tabela detalhada |
| `/admin/remarketing` | Automação | Segmentos, campanhas agendadas |
| `/admin/settings` | Configurações | SMTP, users, integrações |

### API Routes
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/leads` | POST | Criar lead com upload |
| `/api/auth/[...nextauth]` | ALL | Autenticação |
| `/api/track/open/[id]` | GET | Tracking pixel |
| `/api/track/click/[id]` | GET | Tracking de cliques |
| `/api/uploads/[...path]` | GET | Servir arquivos |

---

## 🗄️ Banco de Dados

### Tabelas Principais (Prisma)

```prisma
// Autenticação
model AdminUser {
  id, name, email, password_hash
  failed_attempts, locked_until  // Proteção brute-force
  is_default_password
  role, is_active
}

// Leads
model Lead {
  id, name, email, phone
  address_line1, city, state, zip_code
  service_interest, description, notes
  status (new|contacted|closed)
  assigned_to, attachments
}

// Email Marketing
model Campaign {
  id, name, subject, content
  target_audience, status
  sent_count, opened_count, clicked_count
  open_rate, click_rate
}

// Tracking
model EmailTracking {
  id, tracking_id (único)
  sent_at, opened_at, clicked_at
  delivery_status, device_type
}

// Configurações
model SmtpAccount {
  id, name, host, port
  username, password, from_email
  purposes[], is_default
}

// Remarketing
model RemarketingSegment {
  id, name, description
  criteria (JSON), lead_count
}
```

---

## 🎨 Design System

### Cores
```css
--color-accent: #22c55e          /* green-500 */
--color-accent-dark: #16a34a     /* green-600 */
--color-accent-accessible: #15803d /* green-700 */
--color-primary: #0f172a         /* slate-900 */
--color-background: #ffffff
```

### Tipografia
- **Sans**: Inter (variable font)
- **Serif**: Playfair Display
- **Pesos**: 300-900

### Padrões
- Mobile-first responsivo
- Touch targets mínimos: 44x44px
- Bordas arredondadas: lg (0.5rem) a 3xl (1.5rem)
- Animações: fade-in-up, slide-up

### Classes Tailwind Custom
```css
@theme {
  --color-accent: #22c55e;
  --color-accent-dark: #16a34a;
  --font-sans: var(--font-inter), "Inter", system-ui, sans-serif;
  --font-serif: var(--font-playfair), "Playfair Display", serif;
}
```

---

## ⌨️ Comandos

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento
```

### Build e Deploy
```bash
npm run build        # Build de produção (obrigatório)
npm run start        # Servidor de produção
npm run lint         # ESLint (obrigatório)
```

### Scripts do Projeto (init.sh)
```bash
./init.sh setup      # Instala dependências e configura Prisma
./init.sh prod       # Build e start em produção
./init.sh stop       # Para o servidor
./init.sh clean      # Remove caches
```

---

## 🔧 Variáveis de Ambiente

**⚠️ IMPORTANTE:** O arquivo `.env` é gerado **automaticamente** pelo script de instalação. Não edite manualmente!

### Gerado Automaticamente (install.sh)
```env
# Banco de Dados (Gerado pelo install.sh)
DATABASE_URL="postgresql://sbp_user:SENHA_GERADA@localhost:5432/socialbluepro"
DIRECT_URL="postgresql://sbp_user:SENHA_GERADA@localhost:5432/socialbluepro"

# Autenticação (Gerado pelo install.sh)
NEXTAUTH_SECRET="CHAVE_GERADA_AUTOMATICAMENTE"
NEXTAUTH_URL="http://localhost:3000"

# Criptografia (Gerado pelo install.sh)
ENCRYPTION_KEY="CHAVE_GERADA_AUTOMATICAMENTE"

# Uploads
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=1073741824
```

### Configurado via Interface Admin
As seguintes configurações são feitas via **interface web** após login:

- **SMTP/Email**: Settings > Email Channels
- **reCAPTCHA**: Settings > Integrations  
- **Tracking Pixels**: Settings > Integrations

**NÃO adicione essas configurações no .env!**

---

## 💻 Desenvolvimento

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Setup Inicial
```bash
# 1. Clone o repositório
git clone <repo-url>
cd socialbluepro

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Execute o setup
./init.sh setup

# 5. Inicie em desenvolvimento
npm run dev
```

### Convenções de Código
- **Imports**: Use `@/` alias (ex: `@/components/ui/Button`)
- **Server Actions**: Retorne `{ success, data?, error? }`
- **Error Handling**: Use `console.error("[PREFIX] mensagem")`
- **Tipagem**: Strict mode, tipar funções e argumentos
- **Componentes**: PascalCase (ex: `LeadDetailModal.tsx`)
- **Funções**: camelCase (ex: `handleSubmit`)

---

## 🚀 Deploy

### Instalação em Produção (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

O sistema roda em **localhost:3000** e é acessível via:
- http://localhost:3000 (local)
- http://IP_DO_SERVIDOR:3000 (rede)

**Não requer Nginx** - o Node.js serve diretamente na porta 3000.

### Atualização
```bash
cd /opt/socialbluepro
sudo git pull origin main
sudo npm install --production
sudo npx prisma migrate deploy
sudo npm run build
sudo systemctl restart socialbluepro
```

### Verificação Pré-deploy (Desenvolvimento)
```bash
npm run lint      # Verificar erros de lint
npm run build     # Verificar build completo
```

### Scripts Locais (init.sh)
Para desenvolvimento local:
```bash
./init.sh setup   # Setup inicial
./init.sh prod    # Build + start
./init.sh stop    # Parar servidor
```

---

## 🤝 Contribuição

### Guidelines
1. Siga as convenções de código do projeto
2. Use imports absolutos via `@/`
3. Mantenha o strict mode do TypeScript
4. Teste com `npm run lint` e `npm run build`
5. Documente funções complexas

### Para Agents AI
Consulte o arquivo `AGENTS.md` para guidelines específicas de desenvolvimento.

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 📞 Suporte

Para dúvidas ou suporte:
- Email: suporte@socialbluepro.com
- Telefone: (720) 555-0123

---

**Last Update:** 2026-01-30  
**Version:** 2.0.0
