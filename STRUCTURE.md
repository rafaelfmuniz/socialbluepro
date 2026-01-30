# Estrutura do Projeto - Visual Guide

> Mapa visual completo da organização de arquivos do SocialBluePro

---

## 📁 Árvore de Diretórios

```
socialbluepro/
│
├── 📄 README.md                    # Documentação principal
├── 📄 AGENTS.md                    # Guidelines para AI agents
├── 📄 DOCUMENTATION.md             # Documentação técnica
├── 📄 CHANGELOG.md                 # Histórico de mudanças
├── 📄 STRUCTURE.md                 # Este arquivo
│
├── 📁 .next/                       # Build do Next.js (gitignored)
├── 📁 node_modules/                # Dependências (gitignored)
├── 📁 uploads/                     # Arquivos enviados (gitignored)
│
├── 📄 package.json                 # Dependências npm
├── 📄 next.config.ts               # Configuração Next.js
├── 📄 tsconfig.json                # Configuração TypeScript
├── 📄 tailwind.config.js           # Configuração Tailwind
├── 📄 .env                         # Variáveis de ambiente (gitignored)
├── 📄 .env.example                 # Exemplo de variáveis
├── 📄 .gitignore                   # Arquivos ignorados pelo git
├── 📄 init.sh                      # Script de setup/deploy
│
├── 📁 prisma/
│   └── 📄 schema.prisma            # Schema do banco de dados
│
├── 📁 public/                      # Assets estáticos
│   └── 📁 imgs/
│       └── 📁 Imgs_WEBP/          # Imagens otimizadas WebP
│
└── 📁 src/                         # Código fonte
    │
    ├── 📁 app/                     # Next.js App Router
    │   ├── 📄 globals.css          # Estilos globais Tailwind
    │   ├── 📄 layout.tsx           # Root layout com fonts
    │   ├── 📄 page.tsx             # Homepage (Landing)
    │   │
    │   ├── 📁 api/                 # API Routes
    │   │   ├── 📁 auth/
    │   │   │   └── 📁 [...nextauth]/
    │   │   │       └── 📄 route.ts # NextAuth config
    │   │   ├── 📁 leads/
    │   │   │   └── 📄 route.ts     # POST /api/leads
    │   │   ├── 📁 track/
    │   │   │   ├── 📁 click/
    │   │   │   │   └── 📁 [trackingId]/
    │   │   │   │       └── 📄 route.ts  # Tracking clicks
    │   │   │   └── 📁 open/
    │   │   │       └── 📁 [trackingId]/
    │   │   │           └── 📄 route.ts  # Tracking pixel
    │   │   ├── 📁 uploads/
    │   │   │   └── 📁 [...path]/
    │   │   │       └── 📄 route.ts # Servir uploads
    │   │   ├── 📄 health/route.ts  # Health check
    │   │   ├── 📄 login/route.ts   # Login alternativo
    │   │   ├── 📄 logout/route.ts  # Logout
    │   │   ├── 📄 notifications/route.ts # Notificações
    │   │   └── 📄 send-email/route.ts    # Envio de email
    │   │
    │   ├── 📁 login/
    │   │   └── 📄 page.tsx         # Página de login
    │   │
    │   ├── 📁 request-service/
    │   │   └── 📄 page.tsx         # Formulário de orçamento
    │   │
    │   ├── 📁 terms/
    │   │   └── 📄 page.tsx         # Termos de serviço
    │   │
    │   ├── 📁 privacy/
    │   │   └── 📄 page.tsx         # Política de privacidade
    │   │
    │   └── 📁 admin/               # Área administrativa
    │       ├── 📄 layout.tsx       # Layout protegido
    │       ├── 📄 page.tsx         # Dashboard
    │       ├── 📄 AdminNavigation.tsx # Nav admin
    │       │
    │       ├── 📁 dashboard/
    │       │   └── 📄 page.tsx     # Página dashboard
    │       │
    │       ├── 📁 leads/
    │       │   └── 📄 page.tsx     # CRM Leads
    │       │
    │       ├── 📁 campaigns/
    │       │   └── 📄 page.tsx     # Email Marketing
    │       │
    │       ├── 📁 analytics/
    │       │   └── 📄 page.tsx     # Analytics
    │       │
    │       ├── 📁 remarketing/
    │       │   └── 📄 page.tsx     # Remarketing Automation
    │       │
    │       └── 📁 settings/
    │           └── 📄 page.tsx     # Configurações
    │
    ├── 📁 components/
    │   ├── 📁 ui/                  # Design System
    │   │   ├── 📄 BackToTop.tsx
    │   │   ├── 📄 Button.tsx
    │   │   ├── 📄 Card.tsx
    │   │   ├── 📄 ConfirmModal.tsx
    │   │   ├── 📄 DesktopImage.tsx
    │   │   ├── 📄 ErrorBoundary.tsx
    │   │   ├── 📄 LeadDetailModal.tsx
    │   │   ├── 📄 PageContainer.tsx
    │   │   ├── 📄 QuoteModal.tsx
    │   │   ├── 📄 Table.tsx
    │   │   ├── 📄 Toast.tsx
    │   │   ├── 📄 BackgroundImage.tsx
    │   │   └── 📄 ProgressiveImage.tsx
    │   │
    │   ├── 📁 providers/
    │   │   └── 📄 ToastProvider.tsx
    │   │
    │   ├── 📁 admin/
    │   │   └── 📄 DefaultPasswordWarning.tsx
    │   │
    │   ├── 📁 sections/
    │   │   └── 📄 AboutSection.tsx
    │   │
    │   ├── 📄 Footer.tsx
    │   ├── 📄 Hero.tsx
    │   ├── 📄 LeadMagnet.tsx
    │   ├── 📄 Navbar.tsx
    │   ├── 📄 NavbarLayout.tsx
    │   ├── 📄 ProjectRecap.tsx
    │   ├── 📄 ServiceArea.tsx
    │   ├── 📄 Services.tsx
    │   ├── 📄 SimpleFooter.tsx
    │   └── 📄 Testimonials.tsx
    │
    ├── 📁 actions/                 # Server Actions
    │   ├── 📄 auth.ts              # Autenticação
    │   ├── 📄 campaign-analytics.ts # Analytics
    │   ├── 📄 campaigns.ts         # Campanhas
    │   ├── 📄 email-tracking.ts    # Tracking
    │   ├── 📄 email.ts             # Envio de emails
    │   ├── 📄 lead-notes.ts        # Notas de leads
    │   ├── 📄 leads.ts             # Gestão de leads
    │   ├── 📄 remarketing.ts       # Remarketing
    │   ├── 📄 settings.ts          # Configurações
    │   └── 📄 users.ts             # Usuários
    │
    ├── 📁 lib/                     # Bibliotecas
    │   ├── 📁 hooks/
    │   │   └── 📄 useRealTimePoll.ts
    │   │
    │   ├── 📁 validation/
    │   │   ├── 📄 address-suffixes.ts
    │   │   ├── 📄 colorado-data.ts
    │   │   └── 📄 disposable-email-list.ts
    │   │
    │   ├── 📄 attachments.ts       # Gerenciamento de anexos
    │   ├── 📄 auth-helpers.ts      # Helpers de auth
    │   ├── 📄 client-validation.ts # Validações client-side
    │   ├── 📄 constants.ts         # Constantes
    │   ├── 📄 local-db.ts          # DB local (legado)
    │   ├── 📄 mail.ts              # Configuração SMTP
    │   ├── 📄 prisma-init.ts       # Inicialização Prisma
    │   ├── 📄 prisma.ts            # Cliente Prisma
    │   ├── 📄 simple-auth.ts       # Auth simples (legado)
    │   ├── 📄 supabase-ssr.ts      # Supabase SSR (não usado)
    │   ├── 📄 toast.tsx            # Sistema de toast
    │   ├── 📄 utils.ts             # Utilitários
    │   ├── 📄 validators.ts        # Validações server-side
    │   └── 📄 websocket.ts         # WebSocket (preparado)
    │
    ├── 📄 auth.ts                  # Configuração NextAuth
    └── 📄 middleware.ts            # Middleware de proteção
```

---

## 🗺️ Mapa de Funcionalidades

### Website Público (Landing)

```
📄 page.tsx
├─ 📄 Hero.tsx           → Banner principal + CTA
├─ 📄 Services.tsx       → Grid 8 serviços
├─ 📄 AboutSection.tsx   → Sobre a empresa
├─ 📄 ServiceArea.tsx    → Área de atuação
├─ 📄 Testimonials.tsx   → Depoimentos
├─ 📄 LeadMagnet.tsx     → Captura final
├─ 📄 Footer.tsx         → Rodapé
└─ 📄 QuoteModal.tsx     → Modal de orçamento
```

### Formulário de Orçamento

```
📁 request-service/
└─ 📄 page.tsx
   ├─ Validação: Telefone US
   ├─ Validação: Email (anti-disposable)
   ├─ Validação: ZIP Colorado
   └─ Upload: Fotos/Vídeos (1GB max)
```

### Área Admin

```
📁 admin/
├─ 📄 layout.tsx              → Layout protegido
├─ 📄 page.tsx                → Dashboard
├─ 📄 AdminNavigation.tsx     → Navegação
│
├─ 📁 leads/
│  └─ 📄 page.tsx
│     ├─ Lista de leads
│     ├─ Filtros avançados
│     ├─ Atribuição
│     └─ Export CSV
│
├─ 📁 campaigns/
│  └─ 📄 page.tsx
│     ├─ 6 templates HTML
│     ├─ Editor visual
│     ├─ Segmentação
│     └─ Merge tags
│
├─ 📁 analytics/
│  └─ 📄 page.tsx
│     ├─ Métricas (open/click rate)
│     ├─ Tabela detalhada
│     └─ Export CSV
│
├─ 📁 remarketing/
│  └─ 📄 page.tsx
│     ├─ 4 segmentos
│     ├─ Campanhas agendadas
│     └─ Automation
│
└─ 📁 settings/
   └─ 📄 page.tsx
      ├─ Email Channels (SMTP)
      ├─ User Management
      └─ Integrations (reCAPTCHA, Pixels)
```

---

## 🔀 Fluxos de Dados

### Captura de Lead

```
Visitante
   ↓
Landing Page (/)
   ↓
QuoteModal / Request Service
   ↓
Formulário + Validações
   ↓
POST /api/leads
   ↓
Server Action: createLead
   ↓
Prisma ORM
   ↓
PostgreSQL (leads table)
   ↓
Notificação Email
```

### Email Marketing

```
Admin (/admin/campaigns)
   ↓
Seleciona Template
   ↓
Edita Conteúdo
   ↓
Seleciona Audiência
   ↓
Server Action: sendCampaign
   ↓
Para cada lead:
   ├─ Merge tags ({name}, {city})
   ├─ Add tracking pixel
   ├─ Replace links com tracking
   └─ Send via nodemailer
   ↓
EmailTracking DB
   ↓
Track opens/clicks
```

---

## 📊 Banco de Dados

### Tabelas Principais

```
📦 admin_users
   ├─ id, name, email, password_hash
   ├─ failed_attempts, locked_until
   └─ role, is_active, is_default_password

📦 leads
   ├─ id, name, email, phone
   ├─ address_line1, city, state, zip_code
   ├─ service_interest, description, notes
   ├─ status (new/contacted/closed)
   ├─ assigned_to, assigned_at
   └─ attachments (JSON)

📦 campaigns
   ├─ id, name, subject, content
   ├─ target_audience, status
   ├─ sent_count, opened_count, clicked_count
   └─ open_rate, click_rate

📦 email_tracking
   ├─ id, tracking_id (unique)
   ├─ lead_id, campaign_id, recipient_email
   ├─ sent_at, opened_at, clicked_at
   ├─ delivery_status, device_type
   └─ subject

📦 smtp_accounts
   ├─ id, name, host, port
   ├─ username, password, from_email
   ├─ purposes[], is_default, is_active
   └─ encryption, reply_to

📦 remarketing_segments
   ├─ id, name, description
   ├─ criteria (JSON)
   └─ lead_count
```

---

## 🎯 Convenções de Nomenclatura

### Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Componentes** | PascalCase | `LeadDetailModal.tsx` |
| **Páginas** | PascalCase | `page.tsx` |
| **Actions** | camelCase | `getLeads.ts` |
| **Hooks** | camelCase | `useRealTimePoll.ts` |
| **Utilitários** | camelCase | `validators.ts` |
| **Estilos** | camelCase | `globals.css` |

### Funções e Variáveis

```typescript
// Componentes
const LeadDetailModal: React.FC<Props> = () => {}

// Funções
const handleSubmit = async () => {}
const getLeads = async () => {}

// Variáveis
const [isLoading, setIsLoading] = useState(false);
const campaignError = useState<string | null>(null);

// Interfaces
interface Lead {
  id: string;
  name: string;
}

// Types
type Status = "new" | "contacted" | "closed";
```

---

## ⚙️ Configurações

### next.config.ts
- Server Actions: bodySizeLimit '1gb'
- External packages: pg, @prisma/adapter-pg
- Images: AVIF/WebP, deviceSizes otimizados
- Headers: Security headers

### tsconfig.json
- Target: ES2017
- Strict mode: true
- Paths: `@/*` → `./src/*`

### tailwind.config.js
- v4.x configuration
- Custom theme tokens
- Mobile-first approach

---

## 📈 Versionamento

### Arquivos de Documentação

```
README.md           → v2.0.0 (2026-01-30)
AGENTS.md           → v2.0.0 (2026-01-30)
DOCUMENTATION.md    → v2.0.0 (2026-01-30)
CHANGELOG.md        → v2.0.0 (2026-01-30)
STRUCTURE.md        → v2.0.0 (2026-01-30)
```

### Versão do Projeto

**Current:** 2.0.0  
**Next.js:** 15.0.3  
**React:** 19.0.0  
**Prisma:** 7.2.0

---

**Last Updated:** 2026-01-30  
**Maintained by:** AI Development Team
