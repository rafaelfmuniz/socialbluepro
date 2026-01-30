# Documentação Técnica - SocialBluePro

> Documentação detalhada da arquitetura, fluxos e decisões técnicas do projeto.

---

## 🏗️ Arquitetura de Dados

### Fluxo de Captura de Lead

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Visitante     │────▶│  Formulário Web  │────▶│   Validação     │
│   (Landing)     │     │  (/request-svc)  │     │   Client-side   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                           ┌──────────────────────────────┘
                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Notificação    │◀────│   Server Action  │◀────│    API Route    │
│   (Admin+Lead)  │     │  (createLead)    │     │  (/api/leads)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Prisma     │
                        │     ORM      │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │    (Leads)   │
                        └──────────────┘
```

### Fluxo de Email Marketing

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin User     │────▶│  Campaign Editor │────▶│  Template Sel.  │
│  (/admin/camp)  │     │   (Compose UI)   │     │   (6 options)   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                           ┌──────────────────────────────┘
                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Tracking DB    │◀────│   Send Email     │◀────│  Merge Tags     │
│ (open/click)    │     │  (nodemailer)    │     │ ({name},{city}) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌──────────────────┐
│    Leads        │◀────│   SMTP Server    │
│   (Inbox)       │     │  (Configurable)  │
└─────────────────┘     └──────────────────┘
```

---

## 📊 Modelos de Dados (Prisma)

### Lead Lifecycle

```prisma
model Lead {
  id               String   @id @default(uuid())
  name             String
  email            String
  phone            String
  
  // Endereço
  address_line1    String?
  city             String?
  state            String?
  zip_code         String
  
  // Interesse
  service_interest String?
  description      String?
  notes            String?
  
  // Workflow
  status           String   @default("new")  // new → contacted → closed
  assigned_to      String?  // FK para AdminUser
  assigned_at      DateTime?
  
  // Anexos (JSON array)
  attachments      Json     @default("[]")
  
  // Relações
  emailTrackings   EmailTracking[]
  leadNotes        LeadNote[]
  assignedToUser   AdminUser? @relation("AssignedLeads")
  
  // Timestamps
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}
```

### Email Tracking

```prisma
model EmailTracking {
  id              String   @id @default(uuid())
  tracking_id     String   @unique
  
  // Relações
  lead_id         String?
  campaign_id     String?
  recipient_email String
  
  // Tracking
  sent_at         DateTime @default(now())
  opened_at       DateTime?
  clicked_at      DateTime?
  
  // Status
  delivery_status String   @default("sent")  // sent/delivered/bounced
  delivery_error  String?
  
  // Metadados
  subject         String?
  device_type     String?  // mobile/desktop
  client_type     String?  // gmail/outlook/etc
  
  // Relações
  campaign        Campaign? @relation(fields: [campaign_id], references: [id])
  lead            Lead?     @relation(fields: [lead_id], references: [id])
  events          EmailTrackingEvent[]
}
```

---

## 🎨 Sistema de Design

### Tokens de Design

```typescript
// Cores principais
const colors = {
  accent: {
    DEFAULT: '#22c55e',      // green-500
    dark: '#16a34a',         // green-600
    accessible: '#15803d',   // green-700 (contraste WCAG)
  },
  primary: '#0f172a',        // slate-900
  background: '#ffffff',
  
  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

// Tipografia
const typography = {
  sans: 'Inter, system-ui, sans-serif',
  serif: 'Playfair Display, serif',
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  }
}

// Espaçamento
const spacing = {
  touchTarget: '44px',  // Mínimo para acessibilidade
  section: {
    sm: '1rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem',
  }
}

// Breakpoints (Tailwind)
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### Componentes UI

#### Hierarquia de Componentes

```
📁 components/
├── 📁 ui/                    # Design System (reutilizáveis)
│   ├── Button.tsx           # Variantes: primary, secondary, danger
│   ├── Card.tsx             # Container com sombra
│   ├── Table.tsx            # Tabela responsiva
│   ├── Toast.tsx            # Notificações
│   ├── Modal components     # QuoteModal, LeadDetailModal, ConfirmModal
│   └── Navigation           # BackToTop
│
├── 📁 sections/             # Seções da Landing Page
│   └── AboutSection.tsx
│
├── 📁 admin/                # Componentes específicos admin
│   └── DefaultPasswordWarning.tsx
│
└── 📄 [Páginas]             # Componentes de página
    ├── Hero.tsx
    ├── Services.tsx
    ├── Navbar.tsx
    ├── Footer.tsx
    └── ...
```

---

## 🔐 Segurança

### Autenticação

```typescript
// Fluxo de Login
1. POST /api/auth/callback/credentials
2. Validação de credenciais (bcryptjs)
3. Verificação de tentativas falhas (brute-force protection)
4. Criação de sessão (JWT + cookie)
5. Redirect para /admin

// Proteção de Rotas (middleware.ts)
export function middleware(request: NextRequest) {
  const token = request.cookies.get("sbp_admin_token");
  
  if (!token && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

### Brute-Force Protection

```typescript
// Lógica de bloqueio progressivo
const lockoutDurations = [
  1 * 60 * 1000,   // 1 minuto (1ª falha)
  5 * 60 * 1000,   // 5 minutos (2ª falha)
  15 * 60 * 1000,  // 15 minutos (3ª falha)
  30 * 60 * 1000,  // 30 minutos (4ª falha)
  60 * 60 * 1000,  // 60 minutos (5ª+ falha)
];

// Campos no banco
model AdminUser {
  failed_attempts      Int       @default(0)
  locked_until         DateTime?
  last_failed_attempt  DateTime?
}
```

### Validações

| Campo | Validação | Biblioteca |
|-------|-----------|------------|
| Email | Sintaxe + Domínios descartáveis | `validator` + lista custom |
| Telefone | Formato US, DDD válido | `libphonenumber-js` |
| ZIP | Códigos postais do Colorado | Lista estática |
| Endereço | Formato mínimo | Regex custom |

---

## ⚡ Performance

### Otimizações Implementadas

1. **Imagens**
   - Formato WebP/AVIF
   - Lazy loading
   - Responsive sizes

2. **Código**
   - Server Components por padrão
   - Dynamic imports para modais
   - Tree shaking

3. **Dados**
   - Polling a cada 30s (useRealTimePoll)
   - Caching de queries Prisma
   - Paginação em listas grandes

4. **Build**
   ```javascript
   // next.config.ts
   {
     images: {
       formats: ['image/avif', 'image/webp'],
       deviceSizes: [640, 750, 828, 1080, 1200],
     },
     experimental: {
       serverActions: {
         bodySizeLimit: '1gb',  // Para uploads
       },
     },
   }
   ```

---

## 🔧 Configurações

### Next.js (next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
  
  // Pacotes externos
  serverExternalPackages: [
    'pg',
    '@prisma/adapter-pg',
    '@prisma/client',
  ],
  
  // Imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 🧪 Testes

> **Nota:** O projeto atualmente não possui framework de testes configurado (Jest/Vitest).

### Estratégia de Testes Manuais

1. **Lint**: `npm run lint`
2. **Build**: `npm run build`
3. **Testes de integração**: Server Actions com logs
4. **Testes de UI**: Verificação visual manual

### Logs de Debug

```typescript
// Padrão de logging
console.log("[MODULE] Ação específica:", dados);
console.error("[MODULE] Error:", error);

// Exemplos:
console.log("[LEADS] Creating new lead:", leadData);
console.error("[CAMPAIGNS] Failed to send:", error);
console.error("[SETTINGS] SMTP test failed:", config);
```

---

## 🚀 Deploy

### Checklist de Deploy

- [ ] `npm run lint` sem erros
- [ ] `npm run build` sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Uploads directory criado
- [ ] SMTP configurado e testado

### Ambientes

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| Desenvolvimento | `http://localhost:3000` | Desenvolvimento local |
| Produção | `https://socialbluepro.com` | Ambiente ao vivo |

### Processo de Deploy

```bash
# 1. Build
npm run build

# 2. Verificar build
ls -la .next/

# 3. Deploy (via init.sh)
./init.sh prod

# 4. Verificar status
curl https://socialbluepro.com/api/health
```

---

## 📝 Convenções de Commit

### Formato

```
[type]: [descrição curta]

[descrição detalhada - opcional]
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração
- `perf`: Performance
- `test`: Testes
- `chore`: Tarefas de build/dependências

### Exemplos

```
feat: add campaign scheduling
fix: resolve email tracking pixel
docs: update README with new features
refactor: optimize lead filtering
```

---

## 📞 Suporte e Contato

### Recursos

- **Documentação**: `/README.md`
- **Guidelines**: `/AGENTS.md`
- **Documentação Técnica**: `/DOCUMENTATION.md` (este arquivo)

### Contato

- Email: suporte@socialbluepro.com
- Telefone: (720) 555-0123

---

**Last Updated:** 2026-01-30  
**Version:** 2.0.0
