# Changelog - SocialBluePro

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [2.4.5] - 2026-02-21

### Tracking Pixels & Bot Protection - Correções Críticas (v2.4.5)

#### Tracking Pixels - Funcionalidade Implementada
- **Injeção de pixels no frontend**: Criado componente `TrackingPixelsInjector` que injeta scripts de tracking ativos em todas as páginas
- **API de pixels ativos**: Novo endpoint `/api/tracking-pixels` para buscar pixels habilitados
- **Suporte completo para todos os tipos**:
  - Google Analytics (GA4, UA)
  - Google Ads (AW-)
  - Facebook Pixel
  - TikTok Pixel
  - Custom HTML/Script

#### Tracking Pixels - UI Corrigida
- **Campo "Custom" agora usa textarea**: Permite inserir scripts HTML completos com redimensionamento
- **Modal de edição liberado**: Tipo de pixel pode ser alterado durante edição
- **Labels dinâmicos**: Interface adapta labels conforme tipo de pixel selecionado
- **Textarea redimensionável**: Campo de código para "custom" é redimensionável e suporta múltiplas linhas

#### Bot Protection - Status
- **ReCAPTCHA funcional**: Sistema de validação já estava implementado e funcionando
- **Suporte a múltiplos providers**: Google v2/v3, Cloudflare Turnstile, hCaptcha
- **Validação server-side**: Tokens verificados corretamente no backend

### Fixed Issues
- Tracking Pixels não eram injetados no site (salvos mas não renderizados)
- Campo "custom" usava input de uma linha (impossível editar scripts grandes)
- Botão de editar tipo de pixel estava desabilitado
- Experiência ruim em mobile ao editar pixels custom

### New Files
- `src/app/api/tracking-pixels/route.ts` - API para buscar pixels ativos
- `src/components/TrackingPixelsInjector.tsx` - Componente de injeção de scripts

### Modified Files
- `src/app/layout.tsx` - Adiciona TrackingPixelsInjector
- `src/app/admin/settings/page.tsx` - UI de Tracking Pixels corrigida

---

## [2.4.3] - 2026-02-14

### Correção Crítica: Path Absoluto no Worker (v2.4.3)
- **Fix do path de saída**: Worker agora sempre usa caminho absoluto (`/opt/socialbluepro/public/uploads/...`) ao salvar arquivos convertidos
- **Path relativo vs absoluto**: O job vinha com path relativo (`public/uploads/...`) e o worker salvava em lugar errado
- **API agora encontra arquivos**: Arquivos convertidos são salvos no local correto onde a API procura
- **Banco atualizado com path correto**: Worker atualiza `path` e `url` no banco com valores absolutos/corretos

### Fixed Issues
- Arquivos convertidos não apareciam na UI (404 "Attachment not found")
- Worker salvava em diretório relativo ao invés do absoluto
- Path no banco ficava relativo (`public/uploads/...`) ao invés de absoluto
- Vídeos e imagens convertidos sumiam após processamento

### Modified Files
- `scripts/media-worker.mjs` - Usa path absoluto para salvar arquivos e atualizar banco

---

## [2.4.2] - 2026-02-14

### Correção Crítica: Worker de Mídia (v2.4.2)
- **Fix do Prisma Client no Worker**: Worker agora inicializa Prisma corretamente com driver adapter (`pg` + `@prisma/adapter-pg`)
- **Validação de DATABASE_URL**: Worker falha explicitamente com mensagem clara se `DATABASE_URL` estiver ausente
- **Graceful shutdown melhorado**: Worker desconecta do Prisma e fecha pool de conexões no SIGTERM/SIGINT
- **Worker sobe e processa fila**: Correção resolve crash-loop do worker (Status: activating → active)

### Fixed Issues
- Worker entrava em crash-loop com `PrismaClientInitializationError` por falta de adapter
- Anexos ficavam eternamente em "Processando..." porque worker nunca processava a fila
- `/api/uploads/` retornava 404 porque arquivos convertidos nunca eram gerados

### Modified Files
- `scripts/media-worker.mjs` - Inicialização correta do Prisma com adapter

---

## [2.4.1] - 2026-02-14

### Correções de HEIC/HEIF e Fluxo de Upload (v2.4.1)
- **Corrigido fluxo de upload**: `/request` e `QuoteModal` agora usam POST `/api/leads` (streaming) em vez de `captureLeadWithAttachments()`
- **Conversão HEIC/HEIF via heif-convert**: Worker agora usa `libheif-examples` como caminho principal para HEIC/HEIF (ffmpeg do Ubuntu não suporta)
- **Instalação automática de libheif-examples**: Installer e update.sh agora instalam `libheif-examples` automaticamente
- **Worker atualiza banco ao concluir**: Worker agora atualiza `Lead.attachments` no Postgres com status, tipo, tamanho, meta e erro
- **Preview de HEIC convertido**: UI detecta imagem por `att.kind`/`att.type`/extensão de `att.url` (não por `att.name`)

### Fixed Issues
- HEIC/HEIF não eram convertidos porque o upload ia pelo caminho legado (`captureLeadWithAttachments`)
- Worker falhava em converter HEIC porque ffmpeg no Ubuntu não tem decoder HEIF
- Status de processamento não era atualizado no banco de dados
- Preview de imagens convertidas mostrava ícone de arquivo em vez de thumbnail

### Modified Files
- `src/app/request/page.tsx` - Usa fetch POST /api/leads
- `src/components/ui/QuoteModal.tsx` - Usa fetch POST /api/leads
- `scripts/media-worker.mjs` - heif-convert para HEIC, atualização do Prisma
- `install.sh` - Instala libheif-examples
- `scripts/deploy/install.sh` e `update.sh` - Instalam libheif-examples

---

## [2.4.0] - 2026-02-14

### Automatic Media Conversion (v2.4.0)
- **Conversão automática de mídia**: HEIC/HEIF → JPEG e vídeos → MP4 (720p, 30fps)
- **Worker de processamento separado**: Processa conversões em background com controle de CPU
- **Upload streaming via busboy**: Suporta arquivos até 1GB sem estourar memória
- **Fila em disco**: Sistema de jobs persistente (pending/processing/done/failed)
- **Status de processamento**: UI mostra "Processando..." ou "Falha" durante conversão
- **Fast-path para vídeos compatíveis**: Remux sem re-encode quando possível (H.264/AAC ≤720p)
- **FFmpeg integrado**: Instalação e configuração automática via installer
- **Variáveis de ambiente**: Configurações flexíveis para limites e qualidade de conversão
- **Serviço systemd do worker**: CPUQuota=40%, Nice=10, FFMPEG_THREADS=2 (padrão seguro)

### Technical Changes
- Upload de leads reescrito com parser multipart streaming (busboy)
- API de uploads otimizada para streaming de arquivos grandes
- Sistema de attachments expandido com campos: id, status, kind, meta, error
- Compatibilidade retroativa: attachments antigos tratados como "ready"
- Instalador atualizado: injeta automaticamente novas variáveis de ambiente
- Scripts de deploy atualizados: install.sh e update.sh com suporte ao worker

### Security & Limits
- Restrição de path em /api/uploads: apenas diretório leads/ é servido
- Validação de duração máxima de vídeo (6 minutos = 360s)
- Hard cap de upload: 1GB por arquivo
- Cleanup automático de arquivos temporários
- Timeout de jobs: 20 minutos

### New Files
- `scripts/media-worker.mjs` - Worker de processamento de mídia com FFmpeg
- `src/lib/media-queue.ts` - Utilitários da fila de processamento
- `@types/busboy` e `busboy` - Parser multipart streaming

### Modified Files
- `src/app/api/leads/route.ts` - Upload streaming com busboy
- `src/app/api/uploads/[...path]/route.ts` - Streaming otimizado para arquivos grandes
- `src/actions/leads.ts` - Integração com novo sistema de attachments
- `src/components/ui/LeadDetailModal.tsx` - Status de processamento na UI
- `install.sh` - Instalação automática do FFmpeg e variáveis de ambiente
- `scripts/deploy/install.sh` e `update.sh` - Suporte ao worker de mídia

---

## [2.3.1] - 2026-02-13

### Marketing Tools UX Fixes & UI Standardization
- **Correções de UX/UI no Marketing Tools:**
  - Modal de QR Code para links da lista
  - Botões de copiar URL corrigidos (builder e lista)
  - Botão de download de PNG do QR Code funcional
  - Ícone "Eye" substituído por "Power" para ativar/desativar links
  - Responsividade de URLs melhorada com `break-all` e `min-w-0`
- **Padronização visual do painel admin:**
  - Uso de `PageContainer` e `PageHeader` em todas as páginas admin
  - Páginas `MessagesPage` e `MarketingToolsPage` padronizadas
- **Correções de UI mobile:**
  - Footer harmonizado no mobile (alinhamento de Navigation e Contact)
  - Dropdown de Service Areas corrigido
  - Layout mobile do footer modernizado

### Modified Files
- `src/app/admin/tools/page.tsx` - Refatoração completa da UX
- `src/components/admin/AdminFooter.tsx` - Melhorias visuais
- `src/components/Footer.tsx` - Harmonização mobile
- `src/components/Navbar.tsx` - Correção do dropdown

---

## [2.3.0] - 2026-02-13

### Contact Message System & Local SEO v2.3.0
- **Sistema de Mensagens de Contato:**
  - Modelo `ContactMessage` no Prisma
  - Dashboard de mensagens em `/admin/messages`
  - Validação robusta e anti-bot no formulário de contato
  - Página de contato dedicada em `/contact`
- **Expansão de SEO Local:**
  - Páginas institucionais: `/about`, `/faq`
  - Páginas de serviço detalhadas: `/services/[slug]`
  - Páginas de localização: `/locations/[city]`
  - Dados de localidades do Colorado em `src/lib/locations-data.ts`
  - Dados de serviços em `src/lib/services-data.ts`
- **Footer atualizado:**
  - Versão com nomes de cidades (SEO local)
  - Links para páginas institucionais
  - Design modernizado

### New Files
- `src/actions/contact.ts` - Server actions para mensagens de contato
- `src/app/admin/messages/page.tsx` - Dashboard de mensagens
- `src/app/admin/messages/[id]/page.tsx` - Detalhe da mensagem
- `src/app/contact/page.tsx` - Página de contato pública
- `src/app/about/page.tsx` - Página Sobre nós
- `src/app/faq/page.tsx` - Página de FAQ
- `src/app/services/page.tsx` - Página de serviços
- `src/app/services/[slug]/page.tsx` - Página de serviço individual
- `src/app/locations/[city]/page.tsx` - Página de cidade
- `src/lib/locations-data.ts` - Dados das cidades do Colorado
- `src/lib/services-data.ts` - Dados dos serviços

### Database Changes
- Adicionado modelo `ContactMessage` ao Prisma schema
- Migration criada para tabela `contact_messages`

---

## [2.2.0] - 2026-02-12

### Local SEO Architecture v2.2.0
- **Arquitetura de Páginas de Serviço:**
  - Estrutura dinâmica para páginas de serviço individuais
  - Client components otimizados para SEO: `ServicePageClient.tsx`
  - Slugs otimizados: sod-installation, hardscaping, weed-control, etc.
- **Página de Solicitação de Orçamento Reformulada:**
  - Estilo `QuoteModal` aplicado à página `/request`
  - Design consistente com o modal do Hero
  - Validações em tempo real mantidas
- **Rastreamento de Leads Aprimorado:**
  - Leads orgânicos/diretos rastreados com `source=direct`
  - Integração de marketing analytics ao dashboard

### New Files
- `src/app/services/[slug]/ServicePageClient.tsx` - Client component para páginas de serviço
- `src/app/request/page.tsx` - Reformulada com estilo QuoteModal

### Modified Files
- `src/app/admin/page.tsx` - Adicionado Marketing Analytics ao dashboard
- `src/actions/leads.ts` - Rastreamento de source=direct
- `src/components/ui/QuoteModal.tsx` - Estilos reutilizáveis extraídos

---

## [2.1.0] - 2026-02-12

### Marketing Intelligence & Tools
- **UTM Tracking:** Full UTM parameter capture (source, medium, campaign, term, content) for all leads
- **URL Simplification:** Renamed `/request-service` to `/request` for cleaner marketing URLs
- **Internal URL Shortener:** Create short links like `/r/verao` → `https://example.com/request?utm_source=instagram`
- **QR Code Generator:** Generate QR codes for marketing materials (flyers, business cards)
- **Source Badges:** Color-coded badges for lead sources (Google, Instagram, Facebook, etc.)
- **Marketing Data Section:** New section in Lead Detail Modal showing UTM parameters and first touchpoint

### New Files
- `src/components/ui/SourceBadge.tsx` - Badge component for lead sources
- `src/actions/shortlinks.ts` - Server actions for URL shortener CRUD
- `src/app/r/[slug]/route.ts` - Redirect handler for short links
- `src/app/admin/tools/page.tsx` - Marketing Tools admin page

### Modified Files
- `prisma/schema.prisma` - Added UTM fields to Lead model, added ShortLink model
- `src/actions/leads.ts` - Updated to capture UTM parameters
- `src/components/ui/QuoteModal.tsx` - Added useSearchParams, captures UTMs
- `src/app/request/page.tsx` - Renamed from request-service, updated UTM capture
- `src/app/admin/leads/page.tsx` - Added Source column
- `src/components/ui/LeadDetailModal.tsx` - Added Marketing Data section

### Database Changes
- Added `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` fields to `Lead` model
- Added `ShortLink` model for URL shortener

---

## [2.0.1] - 2026-01-31

### Admin Panel UI Improvements
- **Admin Navigation:** Changed "Painel Admin" to "Admin Panel" (English translation)
- **Admin Navigation:** Mobile menu now shows logo + "Admin Panel" text
- **Admin Navigation:** Desktop header changed from "SocialBluePro" to "SocialBluePro Landscaping" (matching landing page)
- **Admin Navigation:** Sidebar now displays real user name and role instead of "Admin User / Super User"
- **Admin Navigation:** User avatar now shows first letter of user's name instead of fixed "A"
- **Admin Footer:** Fixed footer positioning - now properly stays at bottom of page using `mt-auto`
- **Admin Footer:** Updated version to v2.0.1

### Installer Fixes
- **Database Setup:** Changed from `prisma migrate deploy` to `prisma db push` exclusively (more reliable for fresh installs)
- **Admin User Creation:** Changed default name from "Administrador" (Portuguese) to "Administrator" (English)
- **Admin User Creation:** Fixed credentials - now uses admin@local.system / admin123
- **Install Success Message:** Added RED warning to change default credentials after first login
- **Install Success Message:** Added SMTP configuration recommendation with explanation
- **Credentials File:** Updated with detailed post-install instructions

## [2.0.0] - 2026-01-30

### Removido
- **Supabase do projeto:** Removido todos os pacotes e referências do Supabase
  - Removido `@supabase/ssr` de package.json
  - Removido `@supabase/supabase-js` de package.json  
  - Removido arquivo `src/lib/supabase-ssr.ts`
  - Removido `@supabase/storage-js` de next.config.ts (externals)
  - Removido `@supabase/storage-js` de next.config.ts (webpack externals)
- **Instalador v2.0.0:** Cores profissionais - esquema simples com uma única cor principal
- **Instalador v2.0.0:** Layout formatado - códigos de escape não aparecem mais literalmente
- **Instalador v2.0.0:** Versão do instalador agora segue a versão do sistema (2.0.0)
- **Instalador v2.0.0:** Detecção robusta de instalação existente (4 indicadores)
- **Instalador v2.0.0:** Desinstalação completa com opção de remover dependências do sistema
- **next.config.ts:** Adicionado `output: 'standalone'` (CRÍTICO para serviço systemd)
- **package.json:** Adicionados pacotes @swc/* explícitos para forçar versões compatíveis
- **package.json:** Adicionado overrides para forçar @swc/* versões corretas
- **Instalador health_check:** Removido loop infinito que causava travamento
- **Instalador health_check:** Simplificado para uma única verificação HTTP (3 segundos)
- **Instalador health_check:** Adicionado sleep 5 segundos antes da verificação (estabilização do serviço)
- **Instalador npm:** Limpeza agressiva de todos os caches (node_modules, .next, npm, ~/.npm)
- **Instalador npm:** Remover package-lock.json e node_modules para forçar nova resolução
- **Instalador npm:** Set legacy-peer-deps=false (permitir resolução de peer deps)
- **Instalador npm:** Adicionado sleep 3 segundos após npm install (estabilização do Node.js)
- **Instalador build:** Desabilitar warnings do Next.js (NEXT_TELEMETRY_DISABLED=1)
- **Instalador build:** Set SWC_BINARY_PATH para forçar binário correto
- **package.json:** Mover `@tailwindcss/postcss` e `tailwindcss` de devDependencies para dependencies
- **package.json:** Atualizar `next` de 15.0.3 para 15.5.11
- **package.json:** Atualizar `@next/bundle-analyzer` de 16.1.6 para 15.5.11
- **package.json:** Atualizar `eslint-config-next` de 15.0.3 para 15.5.11
- **Instalador:** `npm install --production` → `npm install` (instala todas as dependências)
- **Erro de build:** Corrigido "Cannot find module '@tailwindcss/postcss'"
- **Erro de build:** Corrigido "Cannot read 'image.png'" (falso positivo do Supabase Storage-JS)
- **Erro de serviço:** Corrigido "Cannot find module '.../standalone/server.js'"
- **Aviso SWC:** Corrigido mismatch de versões do @next/swc (15.5.7 vs 15.5.11)
- **Instalador travado:** Corrigido problema onde instalador parava sem mostrar mensagem final

### Mudanças
- **next.config.ts:** Adicionado `output: 'standalone'` para gerar servidor independente
- **package.json:** Removidos pacotes Supabase
- **src/lib/:** Removido arquivo `supabase-ssr.ts`
- **health_check():** Removido loop while (causava travamento)
- **npm install:** Adicionado --no-audit --no-fund (mais rápido)
- **Ambiente de build:** Adicionadas variáveis para desabilitar warnings do Next.js
- **Caches:** Limpeza completa de node_modules/.cache, .next/cache, npm cache, ~/.npm/_cacache
- **install.sh:** Removido ~/.npm/.npmrc durante limpeza de cache

### CRÍTICO
- **output: 'standalone'** é obrigatório para o serviço systemd funcionar
- Sem essa opção, o Next.js não gera `.next/standalone/server.js`
- O serviço systemd falharia com: "Cannot find module '.../standalone/server.js'"
- Supabase removido completamente do projeto (user request)
- **Instalador v2.0.0:** Cores profissionais - esquema simples com uma única cor principal
- **Instalador v2.0.0:** Layout formatado - códigos de escape não aparecem mais literalmente
- **Instalador v2.0.0:** Versão do instalador agora segue a versão do sistema (2.0.0)
- **Instalador v2.0.0:** Detecção robusta de instalação existente (4 indicadores)
- **Instalador v2.0.0:** Desinstalação completa com opção de remover dependências do sistema
- **next.config.ts:** Módulo `@next/bundle-analyzer` agora é opcional (não causa erro se não instalado)
- **next.config.ts:** Resolve problema de build com `npm install --production`

### Mudanças
- **Instalador:** Reduzido de 764 linhas para 531 linhas (mais limpo e eficiente)
- **Instalador:** Cores simplificadas - apenas uma cor principal, cores diferentes apenas para avisos e erros
- **Instalador:** Detecção de instalação baseada em 4 indicadores (diretório git, serviço systemd, arquivo de serviço, banco de dados)
- **Instalador:** Opção de desinstalação agora pergunta se deseja remover Node.js e PostgreSQL

### Detecção de Instalação
O instalador agora verifica 4 indicadores:
1. Diretório `/opt/socialbluepro/.git` existe
2. Serviço systemd `socialbluepro` está ativo
3. Arquivo `/etc/systemd/system/socialbluepro.service` existe
4. Banco de dados PostgreSQL `socialbluepro` existe

Se qualquer um destes indicadores existir, a instalação é detectada.

### Desinstalação Completa
A opção 4 (Desinstalar) agora:
- Permite remover todas as dependências do sistema (opcional)
- Remove: Node.js, PostgreSQL, npm, build-essential, python3
- Remove completamente: banco de dados, usuário PostgreSQL, serviço systemd, arquivos

### Esquema de Cores
- **Principal:** Branco/Cinza (aparência profissional limpa)
- **Aviso:** Amarelo (para avisos importantes)
- **Erro:** Vermelho (para erros)
- **Sucesso:** Verde (para mensagens de sucesso)
- **Sem carrossel de cores** - tema profissional único

## [2.1.0] - 2026-01-30

### Adicionado
- **Instalador Profissional v2.1.0:** Rewrite completo com features modernas
- **4 Modos de Instalação:** Install, Reinstall, Update, Uninstall
- **Validações de Sistema:** RAM, disco, portas, conectividade
- **Backup Automático:** Criado antes de operações destrutivas
- **Rollback Automático:** Restaura estado anterior em caso de falha
- **Logging Avançado:** Logs detalhados com timestamps e níveis (INFO, DEBUG, TRACE)
- **Health Check:** Verificação de saúde pós-instalação
- **Menu Interativo:** Interface amigável com opções claras
- **Mensagens de Erro Específicas:** Com soluções sugeridas
- **Progress Indicators:** Spinners e feedback visual
- **Debug Mode:** Opção para execução com logs detalhados
- **Log de Instalação:** Salvo em `/var/log/socialbluepro-install.log`

### Corrigido
- **TEMP_DIR não criado:** Diretório temporário agora é criado antes de qualquer uso
- **Erro de navegação:** Problemas com diretório `/tmp` resolvidos
- **Erro no db_password:** Arquivo de senha não encontrado - corrigido com criação garantida
- **Portas ocupadas:** Agora detecta e pede confirmação para matar processos
- **Recursos insuficientes:** Valida RAM e disco antes de iniciar instalação

### Mudanças
- **Node.js:** Atualizado para 20 LTS (de 24.x不稳定)
- **Experiência do Usuário:** Diálogos claros e confirmações antes de operações destrutivas
- **Segurança:** Credenciais salvas em arquivo com permissões 600
- **Depuração:** Stack trace completo em caso de erro fatal
- **Documentação:** README atualizado com novos comandos e features

### Instalador
- Instalação: `curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash`
- Logs: `/var/log/socialbluepro-install.log`
- Credenciais: `/root/.socialbluepro-credentials`

## [2.0.0] - 2026-01-30

### Adicionado
- **Documentação completa do projeto:** README.md, AGENTS.md, DOCUMENTATION.md atualizados
- **Organização estrutural:** Estrutura de pastas documentada e padronizada
- **Design System:** Tokens de design documentados (cores, tipografia, espaçamento)
- **Arquitetura de dados:** Fluxos de dados diagramados e documentados
- **API documentation:** Endpoints documentados com exemplos

### Modificado
- **README.md:** Reescrito com documentação técnica completa
- **AGENTS.md:** Atualizado para versão 2.0.0 com guidelines detalhados
- **Estrutura visual:** Árvore de diretórios documentada

### Documentação
- Guia completo de instalação e setup
- Documentação de todas as páginas e rotas
- Documentação do banco de dados (Prisma schema)
- Guia de contribuição e convenções
- Checklist pré-commit
- Troubleshooting guide

---

## [1.2.0] - 2026-01-21

### Adicionado
- Sistema de notificações com dropdown no header
- Console de diagnóstico SMTP em tempo real
- Sistema de remarketing com segmentação pré-definida
- Campanhas agendadas em lote com limite de emails por dia
- Pixel de tracking para Google Analytics, Ads, Facebook, TikTok
- Configuração de reCAPTCHA (Google v2/v3, Cloudflare Turnstile, hCaptcha)

### Corrigido
- **Email Channels - Falha ao salvar configuração:** Campo `encryption` como enum TypeScript causava erro de serialização. Mudado para tipo `string`.
- **Email Channels - Erro em teste de diagnóstico:** Mapeamento incorreto entre `username`/`password` e `user`/`pass`.
- **Remarketing - Failed to load data:** `getLeads()` retorna objeto `{ success, data }` mas código esperava array.
- **Login - Email real como placeholder:** Placeholder mudado de `admin@socialbluepro.com` para `user@domain.com`.
- **Admin Users - UI não atualizava:** `createAdminUser` agora retorna `{ success: boolean, user?, error? }`.
- **SMTP Delete - Sem confirmação:** Adicionado modal de confirmação com warning.
- **Bell Icon - Não funcional:** Sistema de notificações implementado com dropdown.
- **Login Cooldown - Fixo 15 minutos:** Sistema progressivo com tiers de lockout (1m, 5m, 15m, 30m, 1h) e recuperação automática após 24h.

 ### Mudanças
 - Sistema de toast redesenhado com design moderno (`rounded-3xl`, `shadow-2xl`)
 - Remoção de emojis dos toasts (usando ícones coloridos)
 - Interface de administração atualizada com indicadores visuais
 - Melhoria no sistema de validação de formulários

## [1.2.2] - 2026-01-29

### Adicionado
- **Servidor de produção otimizado:** Build de produção com Next.js 15.5.9, servidor rodando em modo produção (`npm start`)
- **Sistema de limpeza automatizado:** Scripts para remover arquivos temporários, logs, backups e caches desnecessários
- **Documentação atualizada:** Guia completo de estrutura do projeto após limpeza e otimização

### Removido
- **Componente LiveIndicator:** Seção problemática "Updated: Just now Refresh" removida do painel administrativo
- **Arquivos desnecessários:** Logs antigos, relatórios Lighthouse, caches do Next.js, arquivos de backup temporários
- **Diretório de instalação:** `socialbluepro-install/` removido (projeto já instalado)
- **Cache npm:** Diretório `.npm/` removido para economia de espaço

### Corrigido
- **Build de produção:** Erros de TypeScript resolvidos em todas as páginas administrativas
- **Estrutura do projeto:** Organização limpa com apenas arquivos essenciais mantidos
- **Performance:** Redução de tamanho do projeto após limpeza completa
- **Interface administrativa:** Remoção de elementos não funcionais que poluíam a UI

### Mudanças
- **Projeto otimizado:** Estrutura limpa com 681MB (reduzido de ~700MB+)
- **Serviço de produção:** Configuração atualizada para reinício automático e logs em `/tmp/socialbluepro-prod.log`
- **Componentes atualizados:** Páginas admin usam consistentemente `PageContainer` e `PageHeader`
- **Mobile-first design:** Responsividade implementada em todas as páginas administrativas

## [1.2.1] - 2026-01-23

### Adicionado
 - **Sistema de debug para diagnóstico de segurança:** Logs detalhados no fluxo de alteração de senha
 - **Documentação de troubleshooting:** Guia para problema de link "Update Password" quebrado
 - **Documentação de deploy com systemd:** Configuração completa do serviço systemd para produção

### Corrigido
 - **Link "Update Password" retorna 404:** Adicionados logs de debug em `DefaultPasswordWarning.tsx` e `SettingsPage` para identificar causas
 - **Melhoria na documentação:** Seções detalhadas sobre arquitetura e fluxo de segurança
 - **Problema de deploy - serviço não reinicia após reboot:** Corrigida configuração do systemd service (modo produção, usuário dedicado, dependência PostgreSQL)

### Mudanças
- **Documentação expandida:** Adicionadas seções "Arquitetura do Sistema", "Fluxo de Segurança Detalhado" e "Debug & Troubleshooting"
- **Logs de debug:** Console logs com prefixos `[DefaultPasswordWarning]` e `[SettingsPage]` para diagnóstico

## [1.1.0] - 2025-XX-XX

### Adicionado
- Sistema de polling em tempo real (30 segundos)
- Indicador Live/Offline em painéis administrativos
- Sistema de notificações toast com animações
- Detecção de senha padrão (admin123)
- Recuperação de senha por email
- Contador de tentativas de login visível
- Botão de visualizar senha em todos os campos
- Lockout progressivo após tentativas falhas

### Corrigido
- Gerenciamento SMTP - Remoção de "Example SMTP" hardcodido
- Remarketing - Erro de autenticação ao carregar dados
- Campaigns/Analytics - Falta de autenticação nas ações
- User Management - Queries não otimizadas e mensagens de erro genéricas

### Mudanças
- Reescrito `src/actions/users.ts` com queries otimizadas
- Sistema de autenticação reescrito em `src/actions/auth.ts`
- Adicionado hook `useRealTimePoll.ts` para polling automático

## [1.0.0] - 2025-XX-XX

### Lançamento Inicial
- Sistema de gestão de leads completo
- Campanhas de email marketing
- Dashboard com métricas
- Configurações SMTP múltiplas
- Rastreamento de aberturas e cliques
- Painel administrativo
- Formulário de solicitação de serviço público
- Login de administradores
- Sistema de autenticação com NextAuth.js

---

## Versão

Versão atual: **2.3.1**

## Próximas Lançamentos

### [1.3.0] - Planejado
- Integração WebSocket para updates em tempo real
- API REST completa documentada com Swagger
- Testes automatizados com Jest
- CI/CD com GitHub Actions
- Multi-tenancy
- Exportação de leads em CSV/Excel

### [1.4.0] - Futuro
- Mobile app (React Native)
- Integração com WhatsApp Business API
- Automação de campanhas com triggers
- AI-powered lead scoring
- Dashboard de clientes (portal para leads)
