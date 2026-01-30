# SocialBluePro 🌿

> Sistema Profissional de Gestão de Leads e Marketing para Empresas de Paisagismo

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**Versão:** 2.0.0 | **Status:** Production Ready ✅

---

## ✨ Recursos

### 🌐 Website de Conversão
- Landing page otimizada com design moderno
- Formulário de orçamento com validações avançadas
- Upload de fotos/vídeos (até 1GB)
- 8 serviços configuráveis
- Totalmente responsivo (mobile-first)

### 🔐 Sistema Admin Completo
- **CRM**: Gestão de leads com filtros avançados
- **Email Marketing**: 6 templates profissionais
- **Analytics**: Métricas de email em tempo real
- **Remarketing**: Segmentação automática
- **Multi-usuário**: Com proteção brute-force

### 🚀 Tecnologias Modernas
- Next.js 15 com App Router
- React 19 com Server Components
- TypeScript 5 (Strict Mode)
- Tailwind CSS 4
- PostgreSQL + Prisma ORM
- NextAuth.js v5

---

## 🚀 Instalação Automatizada

### Método 1: Instalação via curl (Recomendado)

Execute este comando no seu servidor Ubuntu/Debian:

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/socialbluepro/main/scripts/deploy/install.sh | sudo bash
```

**O que este script faz:**
1. ✅ Detecta automaticamente instalação nova vs atualização
2. ✅ Instala todas as dependências (Node.js, PostgreSQL, Nginx)
3. ✅ Configura o banco de dados
4. ✅ Faz build da aplicação
5. ✅ Configura systemd para iniciar automaticamente
6. ✅ Configura Nginx como proxy reverso
7. ✅ Configura firewall (UFW)
8. ✅ Cria backups automáticos

**Requisitos:**
- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM mínimo (4GB recomendado)
- 20GB espaço em disco
- Acesso root

---

## 📦 Instalação Manual

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/socialbluepro.git
cd socialbluepro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Configure o banco de dados

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Execute o build

```bash
npm run build
```

### 6. Inicie a aplicação

```bash
npm start
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/socialbluepro"

# Autenticação
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="https://seu-dominio.com"

# Email SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"

# Opcional: reCAPTCHA
RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."
```

### SSL/HTTPS com Certbot

```bash
sudo certbot --nginx -d seu-dominio.com
```

---

## 🔄 Atualização

### Atualização Automatizada

```bash
cd /opt/socialbluepro
sudo ./scripts/deploy/update.sh
```

### Atualização via curl

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/socialbluepro/main/scripts/deploy/install.sh | sudo bash
```

---

## 💾 Backup

### Backup Automatizado

```bash
sudo /opt/socialbluepro/scripts/deploy/backup.sh
```

### Backup Manual

```bash
# Backup do banco
sudo -u postgres pg_dump socialbluepro > backup.sql

# Backup dos arquivos
tar -czf backup.tar.gz /opt/socialbluepro --exclude='node_modules' --exclude='.next'
```

---

## 📁 Estrutura do Projeto

```
socialbluepro/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Componentes React
│   ├── actions/          # Server Actions
│   └── lib/              # Utilitários e hooks
├── prisma/
│   └── schema.prisma     # Schema do banco
├── scripts/deploy/       # Scripts de deploy
│   ├── install.sh        # Instalação automatizada
│   ├── update.sh         # Atualização rápida
│   └── backup.sh         # Backup
└── public/               # Assets estáticos
```

---

## 🛠️ Comandos Úteis

```bash
# Iniciar serviço
sudo systemctl start socialbluepro

# Parar serviço
sudo systemctl stop socialbluepro

# Reiniciar
sudo systemctl restart socialbluepro

# Ver status
sudo systemctl status socialbluepro

# Ver logs
sudo tail -f /var/log/socialbluepro.log

# Logs em tempo real
sudo journalctl -u socialbluepro -f
```

---

## 🌟 Funcionalidades

### Website Público
- ✅ Landing page moderna e responsiva
- ✅ Formulário de orçamento com validações
- ✅ Upload de mídia (fotos/vídeos)
- ✅ SEO otimizado
- ✅ Performance otimizada (lazy loading, code splitting)

### Área Administrativa
- ✅ Dashboard com métricas em tempo real
- ✅ CRM completo com filtros avançados
- ✅ Sistema de email marketing
- ✅ Templates HTML profissionais
- ✅ Tracking de emails (abertura/clique)
- ✅ Segmentação de remarketing
- ✅ Gestão de usuários multi-nível
- ✅ Proteção brute-force

---

## 🔒 Segurança

- ✅ Autenticação segura com NextAuth.js v5
- ✅ Proteção brute-force com bloqueio progressivo
- ✅ Validação rigorosa de formulários
- ✅ Sanitização de inputs
- ✅ Headers de segurança configurados
- ✅ Firewall (UFW) integrado

---

## 📊 Performance

- ✅ Server Components por padrão
- ✅ Imagens otimizadas (WebP/AVIF)
- ✅ Lazy loading de componentes
- ✅ Polling a cada 30s para dados em tempo real
- ✅ Cache configurado
- ✅ Bundle otimizado

---

## 🧪 Testes

```bash
# Linting
npm run lint

# Build de produção
npm run build
```

---

## 📝 Documentação

- [📖 Documentação Técnica](./DOCUMENTATION.md)
- [🤖 Guidelines para Agents](./AGENTS.md)
- [📁 Estrutura do Projeto](./STRUCTURE.md)
- [📋 Changelog](./CHANGELOG.md)

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

Consulte o arquivo [AGENTS.md](./AGENTS.md) para guidelines de desenvolvimento.

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 📞 Suporte

- 🌐 Website: https://socialbluepro.com
- 📧 Email: suporte@socialbluepro.com
- 📱 Telefone: (720) 555-0123

---

**Desenvolvido com ❤️ para empresas de paisagismo**

[⬆️ Voltar ao topo](#socialbluepro-)
