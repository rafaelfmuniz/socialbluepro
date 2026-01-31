# 🚀 Release Notes - SocialBluePro

## v2.0.1 - Admin Panel UI & Installer Fixes (2026-01-31)

### ✨ Novidades
- Admin Panel completamente em inglês ("Painel Admin" → "Admin Panel")
- Menu mobile sticky que permanece visível ao scrollar
- Header mobile com logo + "Admin Panel"
- Header desktop: "SocialBluePro Landscaping"
- Sidebar mostra nome real do usuário logado
- Avatar com primeira letra do nome do usuário

### 🔧 Correções
- Instalador usa `prisma db push` (mais confiável)
- Credenciais padrão fixas: admin@local.system / admin123
- Aviso VERMELHO para mudar credenciais após login
- Recomendação de configurar SMTP
- Correção do footer para ficar no rodapé

---

## v2.0.0 - Sistema Completo de Gestão de Leads (2026-01-30)

### ✨ Funcionalidades Principais
- Website de Conversão com landing otimizada
- CRM completo com filtros avançados
- Email Marketing com templates profissionais
- Analytics em tempo real
- Remarketing Automation

### 🛡️ Segurança
- Credenciais aleatórias geradas automaticamente
- Sem dados sensíveis expostos
- Proteção brute-force

### 📦 Instalação
```bash
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

**Credenciais:**
- Email: admin@local.system
- Senha: admin123

⚠️ **Mude imediatamente após o primeiro login!**

---

**Veja o CHANGELOG.md para detalhes completos de todas as mudanças.**

## 📋 Files Changed

### Core Application
- `src/app/admin/AdminNavigation.tsx` - UI improvements and user data display
- `src/app/admin/layout.tsx` - Pass user data to navigation component
- `src/components/admin/AdminFooter.tsx` - Version update and positioning fix

### Installer
- `install.sh` - Database setup, user creation, and post-install warnings

### Version & Documentation
- `package.json` - Version bump to 2.0.1
- `CHANGELOG.md` - Updated with all v2.0.1 changes
- `RELEASE_NOTES.md` - This file (new)

---

## 🚀 Installation

```bash
# Fresh installation
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash

# Or reinstall
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
# Select option 2 - Reinstall
```

**Default Credentials:**
- Email: `admin@local.system`
- Password: `admin123`

**⚠️ Important:** Change these credentials immediately after first login!

---

## 📝 Migration Notes

If upgrading from v2.0.0:
- The database schema remains compatible
- Run the installer and select "Update" (option 3) to preserve data
- The new UI improvements will be applied automatically

---

## 🐛 Bug Fixes

- Fixed login failures caused by missing database tables (using db push instead of migrate deploy)
- Fixed admin user creation with proper timestamp fields
- Fixed footer positioning in admin pages
- Fixed mobile menu visibility during scroll

---

## 📞 Support

For issues or questions:
- Check the log: `/var/log/socialbluepro-install.log`
- View credentials: `/root/.socialbluepro-credentials`
- Service status: `sudo systemctl status socialbluepro`

---

**Full Changelog:** See [CHANGELOG.md](CHANGELOG.md)
