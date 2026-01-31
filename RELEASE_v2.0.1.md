# 🚀 Release v2.0.1 - SocialBluePro

> **Data:** 31 de Janeiro de 2026  
> **Status:** Production Ready ✅  
> **Código:** [v2.0.1](https://github.com/rafaelfmuniz/socialbluepro/releases/tag/v2.0.1)

---

## ✨ Sobre esta Release

Esta release foca em **melhorias de UI no painel administrativo** e **correções críticas no instalador** para garantir uma experiência de instalação e uso mais fluida e profissional.

---

## 🎨 Melhorias no Painel Administrativo

### 🔄 Internacionalização Completa
- **Sidebar:** "Painel Admin" → "Admin Panel" (padronização em inglês)
- **Usuário Padrão:** "Administrador" → "Administrator"
- Todo o sistema agora está 100% em inglês, consistente com a landing page

### 📱 Menu Mobile Aprimorado
- **Header mobile sticky:** Agora flutua no topo e permanece visível durante scroll
- **Nova identidade visual:** Logo + texto "Admin Panel" ao invés de apenas "Painel"
- **Melhor usabilidade:** Acesso rápido ao menu em qualquer ponto da página

### 🖥️ Desktop Header Atualizado
- **Texto atualizado:** "SocialBluePro" → "SocialBluePro Landscaping"
- **Consistência de marca:** Alinhado com a identidade visual da landing page

### 👤 Experiência do Usuário
- **Sidebar informativa:** Mostra nome real do usuário logado (ex: "Administrator") ao invés de "Admin User"
- **Role dinâmico:** Exibe o papel real (ex: "admin") ao invés de "Super User"
- **Avatar personalizado:** Mostra a primeira letra do nome do usuário ao invés de "A" fixo

### 📍 Footer Corrigido
- **Posicionamento fixo:** Agora permanece no rodapé real da página usando `mt-auto`
- **Versão atualizada:** Display atualizado para v2.0.1

---

## 🔧 Correções no Instalador

### 🗄️ Setup do Banco de Dados
- **Método atualizado:** `prisma migrate deploy` → `prisma db push`
  - Mais confiável para instalações frescas
  - Elimina erros de sincronização de migrações
  - Cria tabelas diretamente do schema

### 👤 Criação do Usuário Admin
- **Credenciais padrão fixas:**
  - Email: `admin@local.system`
  - Senha: `admin123`
- **Campos obrigatórios:** Adicionado `created_at` e `updated_at` com `NOW()`
- **Extensão pgcrypto:** Habilitada automaticamente para criptografia bcrypt

### ⚠️ Avisos Pós-Instalação
- **Alerta em VERMELHO:** Usuário deve mudar email e senha imediatamente após primeiro login
- **Recomendação SMTP:** Explicação detalhada das consequências de não configurar SMTP:
  - Impossibilidade de receber emails de recuperação de senha
  - Impossibilidade de enviar campanhas de email marketing
  - Impossibilidade de notificar leads automaticamente

### 📄 Arquivo de Credenciais
- Instruções detalhadas de pós-instalação
- Navegação clara para mudar credenciais (Admin > Settings > Users)
- Navegação clara para configurar SMTP (Admin > Settings > Email)

---

## 📦 Instalação e Atualização

### Requisitos
- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM mínimo (4GB recomendado)
- 20GB espaço em disco
- Acesso root

### Instalação Automatizada

```bash
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

**Credenciais Padrão:**
- Email: `admin@local.system`
- Senha: `admin123`

⚠️ **MUDE IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!**

### Atualização (preserva dados)

```bash
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
# Selecione opção 3 - Atualizar
```

---

## 🐛 Bug Fixes

- ✅ **Login falhando:** Corrigido erro de tabelas não criadas (P3005)
- ✅ **Timestamp nulo:** Corrigido erro de campos `created_at`/`updated_at` obrigatórios
- ✅ **Versão dinâmica:** Script agora detecta versão automaticamente do GitHub
- ✅ **Update quebrado:** Corrigido uso de `migrate deploy` → `db push` na função de update

---

## 🛠️ Tecnologias Atualizadas

| Componente | Versão |
|------------|--------|
| Next.js | 15.5.0 |
| React | 19.0.0 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| PostgreSQL | 14+ |
| Prisma | 7.3.0 |
| NextAuth.js | 5.0.0-beta.30 |

---

## 📋 Arquivos Alterados

### Core Application
- `src/app/admin/AdminNavigation.tsx` - UI improvements
- `src/app/admin/layout.tsx` - User data passing
- `src/components/admin/AdminFooter.tsx` - Footer fix

### Instalador
- `install.sh` - Database setup, user creation, post-install warnings
- `install.sh` - Dynamic version detection

### Documentação
- `package.json` - Version bump to 2.0.1
- `CHANGELOG.md` - Updated with v2.0.1 changes
- `RELEASE_NOTES.md` - Comprehensive release notes
- `RELEASE_v2.0.1.md` - This file

---

## 📝 Notas de Migração

**De v2.0.0 para v2.0.1:**
- Schema do banco permanece compatível
- Use opção "3 - Atualizar" para preservar dados
- UI melhorada será aplicada automaticamente
- Credenciais existentes serão mantidas

---

## 📞 Suporte

Para problemas ou dúvidas:
- Log de instalação: `/var/log/socialbluepro-install.log`
- Credenciais: `/root/.socialbluepro-credentials`
- Status: `sudo systemctl status socialbluepro`
- Logs: `sudo journalctl -u socialbluepro -n 50`

---

**Changelog Completo:** Veja [CHANGELOG.md](https://github.com/rafaelfmuniz/socialbluepro/blob/main/CHANGELOG.md)

---

*SocialBluePro - Sistema Profissional de Gestão de Leads para Empresas de Paisagismo*
