# Changelog - SocialBluePro

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [2.0.1] - 2026-01-30

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

Versão atual: **2.0.1**

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
