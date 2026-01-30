# SocialBluePro - Sistema de Gestão de Leads e Campanhas de Email

## Visão Geral

SocialBluePro é uma plataforma completa para gestão de leads e campanhas de marketing por email, construída com Next.js 15, PostgreSQL e Prisma ORM.

## Stack Tecnológica

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, Framer Motion
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL 16
- **ORM:** Prisma 7
- **Autenticação:** NextAuth.js 5
- **Email:** Nodemailer
- **Validação:** Validator.js
- **Outros:** Lucide Icons, React Turnstile, hCaptcha

## Estrutura do Projeto (Otimizada)

```
/opt/socialbluepro/                    # Raiz do projeto (681MB após limpeza)
├── src/                              # Código fonte TypeScript/React
│   ├── actions/                      # Server Actions
│   │   ├── auth.ts                  # Autenticação e lockout progressivo
│   │   ├── campaigns.ts             # Gestão de campanhas
│   │   ├── campaign-analytics.ts    # Analytics de campanhas
│   │   ├── email.ts                 # Envio de emails
│   │   ├── leads.ts                 # CRUD de leads
│   │   ├── remarketing.ts           # Segmentação de remarketing
│   │   ├── settings.ts              # Configurações do sistema
│   │   └── users.ts                 # Gestão de usuários
│   ├── app/                         # Next.js App Router
│   │   ├── admin/                   # Painel administrativo
│   │   │   ├── analytics/           # Analytics detalhado (sem LiveIndicator)
│   │   │   ├── campaigns/           # Gestão de campanhas
│   │   │   ├── dashboard/           # Dashboard com métricas
│   │   │   ├── leads/               # Gestão de leads
│   │   │   ├── remarketing/         # Segmentação de remarketing
│   │   │   └── settings/            # Configurações do sistema
│   │   ├── api/                     # API Routes
│   │   └── login/                   # Página de login
│   ├── components/                  # Componentes React
│   │   └── ui/                      # Componentes UI reutilizáveis
│   │       ├── PageContainer.tsx    # Container de página consistente
│   │       ├── PageHeader.tsx       # Cabeçalho de página padronizado
│   │       └── Toast.tsx            # Sistema de notificações
│   └── lib/                         # Utilitários
│       ├── toast.ts                 # Sistema de notificações
│       ├── prisma.ts                # Cliente Prisma
│       └── hooks/                   # Custom hooks
│           └── useRealTimePoll.ts   # Polling automático (30s)
├── public/                          # Arquivos estáticos (imagens, fonts)
├── prisma/                          # ORM Prisma
│   └── schema.prisma               # Schema do banco de dados
├── database/                        # Scripts SQL
│   └── schema.sql                  # Schema inicial
├── .config/                        # Configurações Next.js
│   └── nextjs-nodejs/
│       └── config.json
├── .interface-design/              # Sistema de design
│   └── system.md                   # Guia de design
├── .git/                           # Histórico de versão (Git)
├── node_modules/                   # Dependências (necessárias)
├── .env                            # Variáveis de ambiente
├── next.config.ts                  # Configuração Next.js
├── package.json                    # Dependências e scripts
├── tsconfig.json                   # Configuração TypeScript
├── CHANGELOG.md                    # Histórico de versões
├── DOCUMENTACAO.md                 # Esta documentação
├── README.md                       # Guia de produção
└── REALTIME_IMPLEMENTATION.md      # Documentação de implementação em tempo real
```

## Arquitetura do Sistema

### Fluxo de Autenticação e Middleware

O sistema usa um middleware personalizado (`src/middleware.ts`) para proteger rotas administrativas:

1. **Middleware**: Verifica cookie `sbp_admin_token` em rotas `/admin/**`
2. **Token de Sessão**: Base64Url JSON com ID do usuário, email, timestamp e flag `isDefaultPassword`
3. **Validação**: Token expira após 8 horas (TTL configurável)
4. **Redirecionamento**: Se não autenticado, redireciona para `/login`

### Server Actions Pattern

Todas as operações de banco de dados usam Server Actions do Next.js 15:

- **Localização**: `src/actions/` - Separadas por domínio (auth.ts, settings.ts, etc.)
- **Autenticação**: Cada server action verifica sessão via `auth()`
- **Validação**: Validação de entrada com mensagens de erro claras
- **Logs**: Logs detalhados com prefixos como `[AUTH]`, `[SETTINGS]`, etc.

### Sistema de Segurança

#### 1. Detecção de Senha Padrão
- Durante login, verifica se credenciais são `admin@socialbluepro.com` / `admin123`
- Marca `is_default_password = true` no token de sessão
- Exibe `DefaultPasswordWarning` component no painel admin

#### 2. Fluxo de Alteração de Senha
1. **Componente**: `DefaultPasswordWarning` (aparece quando `isDefaultPassword = true`)
2. **Navegação**: Clique navega para `/admin/settings?changePasswordFor=<userId>`
3. **Handler**: `SettingsPage` detecta query param `changePasswordFor` via `useSearchParams()`
4. **Ação**: Abre automaticamente aba "users" e modal de alteração de senha
5. **Limpeza**: Remove parâmetro da URL após uso com `window.history.replaceState()`

#### 3. Bloqueio Progressivo
- Contador de tentativas falhas (`failed_attempts`)
- Lockout progressivo: 1m → 5m → 15m → 30m → 1h
- Reset automático após 24h sem tentativas
- Desbloqueio manual via painel admin

### Sistema de Debug

Logs de debug adicionados para diagnóstico de problemas:

 - **`DefaultPasswordWarning.tsx`**: Logs de navegação quando botão é clicado
 - **`admin/settings/page.tsx`**: Logs do handler de query params
 - **Console**: Filtre por `[DefaultPasswordWarning]` e `[SettingsPage]`

### Infraestrutura de Produção

#### Serviço Systemd
O sistema é gerenciado como um serviço systemd para garantir alta disponibilidade:

**Configuração do Serviço (`/etc/systemd/system/socialbluepro.service`):**
```ini
[Unit]
Description=SocialBluePro
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=socialbluepro
Group=socialbluepro
WorkingDirectory=/opt/socialbluepro
Environment="NODE_ENV=production"
EnvironmentFile=/opt/socialbluepro/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StartLimitIntervalSec=60
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
```

**Características:**
- **Auto-restart:** Reinicia automaticamente em caso de falha
- **Dependências:** Inicia após PostgreSQL estar disponível
- **Segurança:** Executa como usuário dedicado `socialbluepro`
- **Produção:** Usa `npm start` (modo produção) em vez de `npm run dev`

#### Monitoramento
- **Logs:** `sudo journalctl -u socialbluepro -f`
- **Status:** `sudo systemctl status socialbluepro`
- **Health Check:** `curl http://localhost:3000/api/health`

#### Gerenciamento
```bash
# Iniciar/parar/reiniciar
sudo systemctl start|stop|restart socialbluepro

# Habilitar no boot
sudo systemctl enable socialbluepro

# Ver logs recentes
sudo journalctl -u socialbluepro -n 50 --no-pager
```

## Fluxo de Segurança Detalhado

### 1. Detecção e Alerta de Senha Padrão

**Arquivos envolvidos:**
- `src/app/api/login/route.ts` - Detecta credenciais padrão durante login
- `src/auth.ts` - Inclui `isDefaultPassword` no token de sessão
- `src/app/admin/layout.tsx` - Renderiza `DefaultPasswordWarning` se `isDefaultPassword = true`
- `src/components/admin/DefaultPasswordWarning.tsx` - Componente de alerta com botão de ação

**Fluxo:**
1. Login com `admin@socialbluepro.com` / `admin123` → `isDefaultPassword = true`
2. Token de sessão inclui flag `isDefaultPassword`
3. `AdminLayout` verifica flag e renderiza componente de alerta
4. Alerta fixo no topo da tela com mensagem de segurança e botão "Update Password"

### 2. Navegação para Alteração de Senha

**Arquivos envolvidos:**
- `src/components/admin/DefaultPasswordWarning.tsx` - `handleUpdatePassword()` com `router.push()`
- `src/app/admin/settings/page.tsx` - Handler `useEffect` para query param `changePasswordFor`

**Fluxo:**
1. Clique em "Update Password" → `router.push(/admin/settings?changePasswordFor=${userId})`
2. `SettingsPage` detecta query param via `useSearchParams()`
3. Handler: `setActiveTab("users")` + `setChangingPasswordFor(userId)`
4. Limpeza: `window.history.replaceState()` remove parâmetro da URL
5. Renderização: Modal de alteração de senha aparece automaticamente

### 3. Modal de Alteração de Senha

**Localização:** `src/app/admin/settings/page.tsx` (linhas 1559-1621)

**Funcionalidades:**
- Campos com toggle para mostrar/ocultar senha (Eye/EyeOff icons)
- Validação: Nova senha deve ser diferente da atual
- Confirmação: Dois campos devem coincidir
- Submit: Chama `handleChangePassword(userId)` server action
- Feedback: Toast notification de sucesso/erro

### 4. Server Action: `changePassword()`

**Localização:** `src/actions/users.ts`

**Funcionalidades:**
- Validação de força da senha (mínimo 6 caracteres)
- Hash com bcrypt antes de salvar
- Atualização de `is_default_password = false` no banco
- Logs detalhados de operação

### 5. Debug e Troubleshooting

**Problema comum:** Link "Update Password" retorna 404

**Causas possíveis:**
1. **Cache do navegador**: Página antiga em cache
2. **Autenticação**: Sessão não passando `userId` corretamente
3. **Query params**: Handler não detectando parâmetro
4. **Modal não renderizando**: Estado `changingPasswordFor` não atualizando

**Passos para diagnóstico:**
1. **Console do navegador (F12)**: Filtrar logs por `[DefaultPasswordWarning]` e `[SettingsPage]`
2. **Verificar URL**: Deve conter `?changePasswordFor=<userId>`
3. **Inspecionar DOM**: Buscar modal com `z-[200]`
4. **Limpar cache**: Ctrl+F5 ou limpar cache do navegador
5. **Verificar logs do servidor**: `tail -f /opt/socialbluepro/next.log`

## Modelo de Dados

### Tabela: AdminUser
Usuários administrativos do sistema com autenticação e bloqueio progressivo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome completo |
| email | String @unique | Email de acesso |
| password_hash | String | Hash da senha (bcrypt) |
| failed_attempts | Int @default(0) | Tentativas falhas consecutivas |
| locked_until | DateTime? | Bloqueio até este timestamp |
| last_failed_attempt | DateTime? | Última tentativa falha |
| role | String @default("admin") | Perfil do usuário |
| is_active | Boolean @default(true) | Status ativo/inativo |
| is_default_password | Boolean @default(false) | Está usando senha padrão |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

**Lockout Progressivo:**
- 3 tentativas: 1 minuto
- 5 tentativas: 5 minutos
- 8 tentativas: 15 minutos
- 12 tentativas: 30 minutos
- 20 tentativas: 1 hora
- Reset automático após 24h sem tentativas

### Tabela: SmtpAccount
Configurações de servidores SMTP para envio de emails.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome da conta SMTP |
| host | String | Host do servidor SMTP |
| port | Int | Porta (ex: 587, 465) |
| username | String | Usuário de autenticação |
| password | String | Senha de autenticação |
| from_email | String | Email de remetente |
| from_name | String? | Nome de exibição |
| is_default | Boolean @default(false) | Conta padrão |
| is_active | Boolean @default(true) | Status ativo |
| encryption | String @default("auto") | Tipo de criptografia |
| purposes | String[] @default(["general"]) | Propósitos de uso |
| reply_to | String? | Email de resposta |
| secure | Boolean @default(false) | Conexão segura |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

**Tipos de Encryption:**
- `auto` - Detecta automaticamente baseado na porta
- `ssl` - SSL/TLS (porta 465)
- `starttls` - STARTTLS (porta 587)
- `none` - Sem criptografia (não recomendado)

**Propósitos (Purposes):**
- `general` - Notificações gerais do sistema
- `marketing` - Campanhas de marketing
- `transactional` - Emails transacionais
- `notifications` - Alertas e atividades
- `password_reset` - Redefinição de senha

### Tabela: Lead
Leads capturados do formulário de contato.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome do lead |
| email | String | Email do lead |
| phone | String | Telefone |
| address_line1 | String? | Endereço |
| city | String? | Cidade |
| state | String? | Estado |
| zip_code | String | CEP |
| service_interest | String? | Serviço de interesse |
| description | String? | Descrição |
| notes | String? | Anotações |
| status | String @default("new") | Status do lead |
| assigned_to | String? | ID do admin atribuído |
| assigned_at | DateTime? | Data de atribuição |
| attachments | Json @default("[]") | Arquivos anexados |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

**Status do Lead:**
- `new` - Novo lead
- `contacted` - Contato iniciado
| `qualified` - Qualificado |
| `converted` - Convertido em cliente |
| `lost` - Perdido |
| `closed` - Fechado |

### Tabela: Campaign
Campanhas de email marketing.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome da campanha |
| subject | String | Assunto do email |
| content | String | Conteúdo HTML |
| target_audience | String | Público-alvo |
| status | String @default("draft") | Status |
| sent_count | Int @default(0) | Emails enviados |
| opened_count | Int @default(0) | Emails abertos |
| clicked_count | Int @default(0) | Cliques |
| total_recipients | Int @default(0) | Total de destinatários |
| total_opens | Int @default(0) | Total de aberturas |
| total_clicks | Int @default(0) | Total de cliques |
| open_rate | Float? @default(0) | Taxa de abertura |
| click_rate | Float? @default(0) | Taxa de clique |
| archived | Boolean @default(false) | Arquivado |
| created_by | String? | ID do criador |
| admin_id | String? | ID do admin |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |
| sent_at | DateTime? | Data de envio |

**Status da Campanha:**
- `draft` - Rascunho
- `scheduled` - Agendada
- `sent` - Enviada
- `paused` - Pausada
- `completed` - Concluída

### Tabela: EmailTracking
Rastreamento de emails enviados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| lead_id | String? | ID do lead |
| campaign_id | String? | ID da campanha |
| recipient_email | String | Email do destinatário |
| tracking_id | String @unique | ID de rastreamento |
| purpose | String | Propósito do email |
| sent_at | DateTime @default(now()) | Data de envio |
| opened_at | DateTime? | Data de abertura |
| clicked_at | DateTime? | Data de clique |
| delivery_status | String? @default("sent") | Status de entrega |
| delivery_error | String? | Erro de entrega |
| subject | String? | Assunto |
| device_type | String? | Tipo de dispositivo |
| client_type | String? | Tipo de cliente |

### Tabela: RemarketingSegment
Segmentos de remarketing.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome do segmento |
| description | String? | Descrição |
| criteria | Json @default("{}") | Critérios de segmentação |
| lead_count | Int @default(0) | Número de leads |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

**Segmentos Pré-definidos:**
- `hot` - Engajados nos últimos 30 dias
- `warm` - Sem contato por 30-60 dias
- `cold` - Inativos por 90+ dias
- `no_conversion` - Status "new" há mais de 7 dias

### Tabela: ScheduledCampaign
Campanhas agendadas para envio em lote.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome |
| subject | String | Assunto |
| body | String | Conteúdo |
| audience_segment | String | Segmento de público |
| custom_audience | Json @default("[]") | Audiência customizada |
| schedule_type | String | Tipo de agendamento |
| scheduled_at | DateTime | Data agendada |
| emails_per_day | Int @default(100) | Emails por dia |
| total_count | Int @default(1000) | Total de emails |
| status | String @default("scheduled") | Status |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

### Tabela: RecaptchaSetting
Configurações de CAPTCHA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| provider | String | Provedor (google_v2, google_v3, cloudflare_turnstile, hcaptcha) |
| site_key | String | Chave do site |
| secret_key | String | Chave secreta |
| is_enabled | Boolean @default(false) | Habilitado |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

### Tabela: TrackingPixel
Pixels de rastreamento de analytics.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String @id @default(uuid()) | ID único |
| name | String | Nome do pixel |
| type | String | Tipo (google_analytics, google_ads, facebook_pixel, tiktok_pixel, custom) |
| code | String | Código do pixel |
| is_enabled | Boolean @default(true) | Habilitado |
| created_at | DateTime @default(now()) | Data de criação |
| updated_at | DateTime @updatedAt | Data de atualização |

## Rotas da Aplicação

### Públicas
- `/` - Página inicial com formulário de solicitação de serviço
- `/login` - Página de login para administradores
- `/request-service` - Formulário detalhado de solicitação de serviço
- `/privacy` - Política de privacidade
- `/terms` - Termos de uso

### Admin
- `/admin` - Painel administrativo principal
- `/admin/dashboard` - Dashboard com métricas
- `/admin/leads` - Gestão de leads
- `/admin/campaigns` - Gestão de campanhas de email
- `/admin/analytics` - Analytics detalhado
- `/admin/remarketing` - Segmentação de remarketing
- `/admin/settings` - Configurações do sistema

### APIs
- `/api/auth/[...nextauth]` - Autenticação NextAuth
- `/api/health` - Health check
- `/api/leads` - CRUD de leads
- `/api/login` - Login de administradores
- `/api/logout` - Logout
- `/api/notifications` - Notificações do sistema
- `/api/send-email` - Envio de emails
- `/api/track/open/[trackingId]` - Rastreamento de abertura
- `/api/track/click/[trackingId]` - Rastreamento de clique

## Server Actions

### src/actions/auth.ts

**`loginUser(email: string, password: string)`**
Autentica usuário com sistema de bloqueio progressivo.

**Retorna:**
```typescript
{
  success: boolean;
  attemptsRemaining?: number;
  lockedUntil?: string;
  error?: string;
  warning?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
```

**Comportamento:**
- Valida credenciais usando bcrypt
- Incrementa contador de tentativas falhas
- Bloqueia progressivamente após tentativas falhas
- Retorna tempo restante de bloqueio
- Detecta senha padrão e emite warning
- Reseta contador após login bem-sucedido

**`createAdminUser(data: { name, email, password, role })`**
Cria novo usuário administrativo.

**Retorna:**
```typescript
{
  success: boolean;
  user?: any;
  error?: string;
}
```

**Validação:**
- Nome obrigatório
- Email obrigatório e válido
- Senha obrigatória, mínimo 6 caracteres
- Email deve ser único

### src/actions/settings.ts

**`getSmtpAccounts()`**
Retorna todas as contas SMTP configuradas.

**`saveSmtpAccount(account)`**
Cria ou atualiza conta SMTP.

**Parâmetros:**
```typescript
{
  id?: string;              // Opcional para edição
  name: string;             // Nome da conta
  host: string;             // Host SMTP
  port: number;             // Porta
  username: string;         // Usuário
  password: string;         // Senha
  encryption: string;       // 'auto', 'ssl', 'starttls', 'none'
  from_name?: string;       // Nome do remetente
  reply_to?: string;        // Email de resposta
  purposes: string[];       // Propósitos de uso
  is_default: boolean;      // Conta padrão
}
```

**`deleteSmtpAccount(id: string)`**
Remove conta SMTP.

**`getRecaptchaConfig()`**
Retorna configurações do CAPTCHA.

**`saveRecaptchaConfig(siteKey, secretKey, isEnabled, provider)`**
Salva configurações do CAPTCHA.

**`getTrackingPixels()`**
Retorna todos os pixels de rastreamento.

**`saveTrackingPixel(pixel)`**
Cria novo pixel de rastreamento.

**`updateTrackingPixel(id, pixel)`**
Atualiza pixel existente.

**`deleteTrackingPixel(id)`**
Remove pixel de rastreamento.

**`toggleTrackingPixel(id, isEnabled)`**
Ativa/desativa pixel.

**`getAllSettingsData()`**
Retorna todos os dados de configurações em uma única chamada.

**Retorna:**
```typescript
{
  smtp: SmtpConfig;
  accounts: SmtpAccount[];
  users: AdminUser[];
  recaptcha: RecaptchaConfig | null;
  pixels: TrackingPixel[];
}
```

### src/actions/email.ts

**`sendEmail(to, subject, body, isHtml, purpose, textOverride)`**
Envia email usando configuração SMTP ativa.

**Parâmetros:**
- `to: string | string[]` - Destinatário(s)
- `subject: string` - Assunto
- `body: string` - Conteúdo
- `isHtml: boolean` - Conteúdo é HTML
- `purpose: string` - Propósito (para selecionar conta SMTP)
- `textOverride: string` - Texto alternativo

**Retorna:**
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
  details?: {
    response: any;
    accepted: string[];
    rejected: string[];
  };
}
```

**`sendDiagnosticTestEmail(config, to)`**
Envia email de teste para diagnóstico SMTP.

**`sendEmailWithConfig(config, options, purpose)`**
Envia email usando configuração específica.

### src/actions/leads.ts

**`getLeads(filters?)`**
Retorna leads com filtros opcionais.

**Filtros:**
```typescript
{
  status?: string;
  limit?: number;
  offset?: number;
}
```

**Retorna:**
```typescript
{
  success: boolean;
  data: Lead[];
  error?: string;
}
```

**`createLead(data)`**
Cria novo lead.

**`updateLead(id, data)`**
Atualiza lead existente.

**`deleteLead(id)`**
Remove lead.

**`assignLead(id, userId)`**
Atribui lead a usuário.

### src/actions/campaigns.ts

**`getCampaigns(filters?)`**
Retorna campanhas com filtros.

**`createCampaign(data)`**
Cria nova campanha.

**`updateCampaign(id, data)`**
Atualiza campanha.

**`deleteCampaign(id)`**
Remove campanha.

**`sendCampaign(id)`**
Envia campanha para destinatários.

### src/actions/remarketing.ts

**`getRemarketingSegments()`**
Retorna todos os segmentos de remarketing.

**`createRemarketingSegment(data)`**
Cria novo segmento.

**`updateRemarketingSegment(id, data)`**
Atualiza segmento.

**`deleteRemarketingSegment(id)`**
Remove segmento.

**`createCampaign(data)`**
Cria campanha a partir de segmento.

**`createScheduledCampaign(data)`**
Agenda campanha em lote.

### src/actions/users.ts

**`getUsers()`**
Retorna todos os usuários administrativos.

**`createUser(data)`**
Cria novo usuário.

**`updateUser(id, data)`**
Atualiza usuário.

**`deleteUser(id)`**
Remove usuário.

**`unlockUser(id)`**
Desbloqueia usuário.

**`changePassword(userId, newPassword)`**
Altera senha do usuário.

## Componentes UI

### Toast Notification System

**Localização:** `src/lib/toast.ts` e `src/components/ui/Toast.tsx`

**Uso:**
```tsx
import { useToast } from "@/lib/toast";

function MyComponent() {
  const { addToast } = useToast();
  
  const handleClick = () => {
    addToast("Operação realizada com sucesso!", "success");
    addToast("Ocorreu um erro", "error");
    addToast("Aviso importante", "warning");
    addToast("Informação", "info");
  };
}
```

**Tipos de Toast:**
- `success` - Verde
- `error` - Vermelho
- `warning` - Amarelo
- `info` - Azul

**Configurações:**
- Duração padrão: 5000ms
- Máximo simultâneo: 5 toasts
- Animação: Slide-up com fade
- Design: `rounded-3xl`, `shadow-2xl`, borda branca



## Deploy para Produção

### Pré-requisitos

1. Node.js 20+ instalado
2. PostgreSQL 16 instalado
3. NPM ou Yarn

### Configuração do Banco de Dados

#### Iniciar PostgreSQL (Windows)

```powershell
# PowerShell como Administrador
Start-Service postgresql-x64-16

# Verificar status
sc query postgresql-x64-16

# Configurar auto-start
sc config postgresql-x64-16 start=auto
```

### Configuração do Ambiente

1. Crie arquivo `.env`:
```env
# PostgreSQL
DATABASE_URL=postgresql://socialbluepro:socialbluepro_pass@localhost:5432/socialbluepro?sslmode=disable

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Secrets (Mude em produção!)
PGRST_JWT_SECRET=change_this_to_secure_random_string_min_32_chars
NEXTAUTH_SECRET=change_this_to_secure_random_string_min_32_chars

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@socialbluepro.com
SMTP_FROM_NAME=SocialBluePro
```

### Passos do Deploy

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Sincronizar schema com banco
npx prisma db push

# 4. Build
npm run build

# 5. Iniciar servidor
npm start
```

## Otimização e Manutenção

### Limpeza e Organização do Projeto

O projeto passou por uma limpeza completa para remover arquivos desnecessários e otimizar a estrutura:

#### Arquivos Removidos:
- **Logs e temporários**: `.npm/_logs/*.log`, `build.log`, `server.log`, `next.log`, `server.pid`, `cookies.txt`
- **Backups**: `socialbluepro.service.backup`, `.env.template.local.backup`, `page.tsx.backup`
- **Relatórios de teste**: `lighthouse-*.json` (8 arquivos, ~4.5MB total)
- **Caches**: `.next/`, `tsconfig.tsbuildinfo`, `.npm/`
- **Diretório de instalação**: `socialbluepro-install/` (projeto já instalado)

#### Componentes Removidos:
- **`LiveIndicator`**: Componente problemático com seção "Updated: Just now Refresh" que não funcionava corretamente
  - **Arquivo removido**: `src/components/ui/LiveIndicator.tsx`
  - **Referências removidas**: `src/app/admin/analytics/page.tsx`, `src/app/admin/campaigns/page.tsx`
  - **Funcionalidade mantida**: Polling automático continua (30s) sem interface visual problemática

#### Estrutura Otimizada:
```
/opt/socialbluepro/ (681MB)
├── src/                    # Código fonte (TypeScript/React)
├── public/                 # Arquivos estáticos
├── prisma/                 # Schema do banco de dados  
├── database/               # Scripts SQL
├── .config/               # Configurações Next.js
├── .interface-design/     # Sistema de design
├── .git/                  # Histórico de versão
├── node_modules/          # Dependências necessárias
└── arquivos de configuração
```

#### Práticas de Manutenção:

1. **Build de Produção:**
   ```bash
   npm run build  # Gera build otimizado
   npm start      # Inicia servidor em modo produção
   ```

2. **Monitoramento:**
   ```bash
   tail -f /tmp/socialbluepro-prod.log  # Logs do servidor
   ps aux | grep -E "(next|node)"       # Processos em execução
   ```

3. **Limpeza Periódica:**
   ```bash
   # Remover caches do Next.js
   rm -rf .next tsconfig.tsbuildinfo
   
   # Remover logs antigos
   find . -name "*.log" -type f -delete
   
   # Remover arquivos temporários
   find . -name "*.backup" -o -name "*.tmp" -o -name "*.temp" -delete
   ```

4. **Verificação de Integridade:**
   - Build sem erros de TypeScript
   - Todas as páginas administrativas com layout responsivo
   - Componentes `PageContainer` e `PageHeader` consistentes
   - Design mobile-first implementado em todas as páginas

### Serviço de Produção Atualizado

O servidor está configurado para execução em modo produção com as seguintes características:

- **Modo**: Next.js produção (`npm start`)
- **Porta**: 3000 (acessível em `http://localhost:3000`)
- **Logs**: `/tmp/socialbluepro-prod.log`
- **PID**: `/tmp/socialbluepro.pid`
- **Performance**: Build otimizado com 21 páginas geradas
- **Disponibilidade**: Reinício automático em caso de falha

#### Comandos de Gerenciamento:
```bash
# Iniciar servidor
cd /opt/socialbluepro && npm start

# Parar servidor
pkill -f "next start"

# Verificar status
curl -s http://localhost:3000/api/health
```



## Comandos Úteis

### Prisma
```bash
npx prisma studio              # Interface visual do banco
npx prisma migrate dev         # Criar migração
npx prisma db push             # Sincronizar schema com banco
npx prisma generate            # Regenerar cliente
```

### Next.js
```bash
npm run dev                    # Desenvolvimento
npm run build                  # Build de produção
npm run start                  # Servidor de produção
```

### Banco de Dados
```bash
pg_dump -U socialbluepro socialbluepro > backup.sql       # Backup
psql -U socialbluepro socialbluepro < backup.sql         # Restore
```

## Segurança

### Em Produção

1. **Mude os secrets padrão:**
   - `NEXTAUTH_SECRET` - Mínimo 32 caracteres aleatórios
   - `DB_PASSWORD` - Senha forte do PostgreSQL

2. **Configure HTTPS:**
   - Use certificados SSL válidos
   - Atualize `NEXTAUTH_URL` para HTTPS

3. **Configure SMTP real:**
   - Use serviços como SendGrid, AWS SES, Mailgun
   - Nunca use senhas de email pessoal (use App Passwords do Gmail)

4. **Configure CAPTCHA:**
   - Configure reCAPTCHA v2/v3 ou Turnstile
   - Protege formulários públicos contra bots

## Troubleshooting

### PostgreSQL não inicia
```powershell
# PowerShell como Administrador
Start-Service postgresql-x64-16
```

### Porta 3000 em uso
```bash
npx kill-port 3000
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
netstat -ano | findstr :5432

# Testar conexão
psql -U socialbluepro -h localhost -p 5432 -d socialbluepro
```

 ### Build falha
```bash
rm -rf .next node_modules/.prisma
npx prisma generate
npm run build
```

### Link "Update Password" retorna 404
**Sintoma:** Clique no botão "Update Password" no alerta de segurança redireciona para página 404.

**Causas possíveis:**
1. **Cache do navegador:** Página antiga em cache
2. **Autenticação:** Sessão não passando `userId` corretamente
3. **Query params:** Handler não detectando parâmetro `changePasswordFor`
4. **Modal não renderizando:** Estado `changingPasswordFor` não atualizando

**Solução:**
1. **Verificar logs de debug:** Abrir console do navegador (F12) e filtrar por `[DefaultPasswordWarning]` e `[SettingsPage]`
2. **Limpar cache:** Ctrl+F5 ou limpar cache do navegador
3. **Verificar URL:** Deve conter `?changePasswordFor=<userId>` (ex: `/admin/settings?changePasswordFor=12ebc918-00d8-47e7-b47c-a530ed2b568b`)
4. **Inspecionar DOM:** Buscar modal com `z-[200]` após navegação
5. **Verificar autenticação:** Certificar que está logado como admin
6. **Testar com curl:** 
```bash
curl -b cookies.txt -I "http://localhost:3000/admin/settings?changePasswordFor=<userId>"
```
Deve retornar HTTP 200 OK

**Arquivos com logs de debug:**
- `src/components/admin/DefaultPasswordWarning.tsx:17-19`
- `src/app/admin/settings/page.tsx:124-135`

### Serviço não reinicia após reboot ou fica offline
**Sintoma:** Aplicação fica offline após reinício do servidor, serviço systemd não inicia automaticamente, erro `ENOENT: no such file or directory, open '/opt/socialbluepro/.next/required-server-files.json'`.

**Causas possíveis:**
1. **Modo desenvolvimento em produção:** Serviço configurado com `npm run dev` em vez de `npm start`
2. **Build incompleto:** Arquivos de build faltando no diretório `.next/`
3. **Permissões incorretas:** Serviço executando como `root` em vez de usuário dedicado
4. **Dependências faltando:** Serviço não configurado para depender do PostgreSQL

**Solução:**
1. **Corrigir ExecStart no serviço systemd:**
   ```bash
   sudo sed -i 's|ExecStart=/usr/bin/npm run dev|ExecStart=/usr/bin/npm start|' /etc/systemd/system/socialbluepro.service
   ```

2. **Executar build de produção:**
   ```bash
   cd /opt/socialbluepro
   npm run build
   ```

3. **Configurar usuário dedicado:**
   ```bash
   sudo chown -R socialbluepro:socialbluepro /opt/socialbluepro
   sudo sed -i 's/User=root/User=socialbluepro/' /etc/systemd/system/socialbluepro.service
   sudo sed -i '/User=socialbluepro/a Group=socialbluepro' /etc/systemd/system/socialbluepro.service
   ```

4. **Adicionar dependência do PostgreSQL:**
   ```bash
   sudo sed -i '/After=.*/a Wants=postgresql.service' /etc/systemd/system/socialbluepro.service
   ```

5. **Recarregar e reiniciar:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart socialbluepro
   sudo systemctl enable socialbluepro
   ```

**Prevenção:**
- Sempre use `npm start` para produção (não `npm run dev`)
- Configure usuário dedicado para segurança
- Adicione `Wants=postgresql.service` para garantir ordem de inicialização
- Teste o serviço após cada alteração

---

**Última atualização:** 29 de Janeiro de 2026
**Versão:** 1.2.2
**Status:** Produção (Servidor rodando em modo produção)
