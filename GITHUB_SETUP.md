# 🚀 Guia de Deploy no GitHub

> Instruções completas para subir o projeto no GitHub e configurar deploy automatizado

---

## 📋 Checklist Antes de Subir

- [ ] Atualizar `REPO_URL` no `scripts/deploy/install.sh`
- [ ] Atualizar URLs no `GITHUB_README.md`
- [ ] Verificar se `.env` está no `.gitignore`
- [ ] Scripts de deploy com permissão de execução
- [ ] Testar build local: `npm run build`
- [ ] Testar lint: `npm run lint`

---

## 🔧 Configuração do GitHub

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `socialbluepro`
3. Visibilidade: **Private** (recomendado para projeto comercial)
4. Não inicialize com README (já temos um)
5. Clique em **Create repository**

### 2. Configurar Git Local

```bash
# No diretório do projeto
cd /caminho/para/socialbluepro

# Inicializar git (se ainda não estiver)
git init

# Configurar remote
git remote add origin https://github.com/SEU-USUARIO/socialbluepro.git

# Verificar remote
git remote -v
```

### 3. Preparar Arquivos

```bash
# Criar/atualizar .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env.production

# Uploads
public/uploads/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Backup
*.backup
*.bak
*~

# Test coverage
coverage/

# Temporary files
*.tmp
*.temp
.tmp/
temp/

# Cache
.cache/
.npm/

# Misc
*.pid
*.seed
*.pid.lock
EOF

# Dar permissão aos scripts (Linux/Mac)
chmod +x scripts/deploy/*.sh
chmod +x init.sh
```

### 4. Commit e Push

```bash
# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "feat: initial release v2.0.0

- Sistema completo de gestão de leads
- Email marketing com templates
- Analytics em tempo real
- Remarketing automation
- Deploy automatizado via curl
- Documentação completa"

# Push para GitHub
git push -u origin master
# ou se usar main:
# git push -u origin main
```

---

## 🔄 Configurar Deploy Automatizado

### Atualizar URL do Repositório

Edite o arquivo `scripts/deploy/install.sh` e altere:

```bash
REPO_URL="https://github.com/SEU-USUARIO/socialbluepro.git"
```

Substitua `SEU-USUARIO` pelo seu usuário do GitHub.

### Atualizar README

No `GITHUB_README.md`, substitua todas as ocorrências de:
- `seu-usuario` → seu usuário do GitHub
- `seu-dominio.com` → seu domínio real

---

## 🧪 Testar Instalação

### 1. Testar Script Localmente

```bash
# Simular instalação (dry-run)
bash -n scripts/deploy/install.sh

# Verificar sintaxe
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/socialbluepro/main/scripts/deploy/install.sh | bash -n
```

### 2. Testar em Servidor de Staging

```bash
# Em um servidor Ubuntu/Debian limpo:
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/socialbluepro/main/scripts/deploy/install.sh | sudo bash
```

---

## 🔒 Configurações de Segurança no GitHub

### Branch Protection

1. Vá em **Settings** → **Branches**
2. Clique em **Add rule**
3. Branch name pattern: `main` (ou `master`)
4. ✅ **Require pull request reviews before merging**
5. ✅ **Require status checks to pass**
6. ✅ **Require conversation resolution before merging**
7. Salve

### Secrets (Opcional - para deploy automático)

Se quiser deploy automático via GitHub Actions:

1. **Settings** → **Secrets and variables** → **Actions**
2. Adicione:
   - `SSH_HOST` - IP do servidor
   - `SSH_USER` - Usuário SSH
   - `SSH_KEY` - Chave SSH privada

---

## 📊 GitHub Actions (CI/CD)

O projeto já inclui workflow em `.github/workflows/ci-cd.yml`:

### Funcionalidades:
- ✅ Testes automáticos em push/PR
- ✅ Linting
- ✅ Build verification
- ✅ Testes com PostgreSQL
- 🔄 Deploy automático (opcional)

### Ativar Deploy Automático:

1. Descomente a seção `deploy` no arquivo `.github/workflows/ci-cd.yml`
2. Configure os secrets mencionados acima
3. Push para `main` vai deployar automaticamente

---

## 📝 Comandos Úteis

### Manter Repositório Atualizado

```bash
# Verificar status
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "tipo: descrição"

# Push
git push

# Pull (atualizar local)
git pull
```

### Convenções de Commit

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
perf: performance
test: testes
chore: tarefas
```

---

## 🚀 Comando de Instalação Final

Após tudo configurado, seu comando de instalação será:

```bash
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/socialbluepro/main/scripts/deploy/install.sh | sudo bash
```

Substitua `SEU-USUARIO` pelo seu usuário do GitHub.

---

## ✅ Verificação Pós-Push

Após subir para o GitHub, verifique:

1. **Código:**
   - [ ] Todos os arquivos aparecem no repositório
   - [ ] `.env` NÃO está no repositório
   - [ ] `.env.example` está presente

2. **Scripts:**
   - [ ] `scripts/deploy/install.sh` está acessível
   - [ ] `scripts/deploy/update.sh` está acessível
   - [ ] `scripts/deploy/backup.sh` está acessível

3. **Documentação:**
   - [ ] README.md está formatado corretamente
   - [ ] Links funcionam
   - [ ] Badges aparecem

4. **Funcional:**
   - [ ] Testar comando curl em servidor limpo
   - [ ] Verificar se instalação completa sem erros

---

## 🆘 Troubleshooting

### Problema: "Permission denied" nos scripts

```bash
# Solução: Arquivos criados no Windows podem não ter permissão Unix
# No servidor Linux, execute:
chmod +x /opt/socialbluepro/scripts/deploy/*.sh
```

### Problema: "Repository not found"

```bash
# Verifique se o repositório é privado e você está logado
curl -H "Authorization: token SEU_TOKEN" ...

# Ou torne o repositório público temporariamente para teste
```

### Problema: "npm not found"

```bash
# O script instala Node.js automaticamente
# Se falhar, instale manualmente:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `/var/log/socialbluepro-install.log`
2. Consulte a documentação: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Abra uma issue no GitHub

---

**Próximo passo:** [Guia de Deploy no Servidor](./DEPLOY_SERVER.md)
