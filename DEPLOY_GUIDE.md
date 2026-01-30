# 🚀 Guia de Deploy - Como Enviar Alterações para o GitHub

> Fluxo completo: Desenvolvimento Local → Testes → GitHub → Nova Versão

---

## 📋 Fluxo de Trabalho

### 1️⃣ **FAZER ALTERAÇÕES NO CÓDIGO**

Edite os arquivos normalmente no seu ambiente local (VS Code, etc).

---

### 2️⃣ **TESTAR ANTES DE COMMITAR** ⚠️ OBRIGATÓRIO

```bash
# No terminal, na pasta do projeto:
cd D:\Dev-Projetos\socialbluepro

# 1. Verificar erros de lint
npm run lint

# 2. Verificar se build funciona
npm run build
```

**✅ Se passar nos testes:** Continue para o commit  
**❌ Se der erro:** Corrija os erros antes de continuar

---

### 3️⃣ **VERIFICAR O QUE MUDOU**

```bash
# Ver quais arquivos foram alterados
git status

# Ver as alterações em detalhes
git diff
```

---

### 4️⃣ **ADICIONAR ARQUIVOS ALTERADOS**

```bash
# Adicionar TODOS os arquivos alterados
git add .

# Ou adicionar arquivos específicos
git add src/actions/auth.ts
```

---

### 5️⃣ **CRIAR COMMIT (FOTO DO MOMENTO)**

```bash
# Criar commit com mensagem descritiva
git commit -m "tipo: descrição curta

Descrição mais detalhada do que foi alterado"
```

**Tipos de commit:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação/código
- `refactor:` - Refatoração
- `security:` - Segurança

**Exemplos:**
```bash
git commit -m "feat: add sistema de notificações push"

git commit -m "fix: corrigir validação de email no formulário

- Adiciona validação de domínios descartáveis
- Melhora mensagens de erro"

git commit -m "docs: atualizar README com novas instruções"
```

---

### 6️⃣ **ENVIAR PARA O GITHUB**

```bash
# Push para o repositório remoto
git push origin main
```

**Pronto!** Suas alterações agora estão no GitHub!

---

## 🔄 **FLUXO COMPLETO EM UMA LINHA**

```bash
npm run lint && npm run build && git add . && git commit -m "feat: descrição" && git push origin main
```

---

## 🏷️ **VERSIONAMENTO (Opcional mas recomendado)**

Quando quiser marcar uma nova versão oficial:

```bash
# Criar uma tag de versão
git tag -a v2.1.0 -m "Versão 2.1.0 - Sistema de notificações"

# Enviar tag para GitHub
git push origin v2.1.0
```

**Regras de versionamento (SemVer):**
- `v2.0.0` → Mudanças grandes (breaking changes)
- `v2.1.0` → Novas funcionalidades
- `v2.1.1` → Correções de bugs

---

## 📝 **CHECKLIST ANTES DO PUSH**

- [ ] Código testado localmente (`npm run dev`)
- [ ] Lint passou (`npm run lint`)
- [ ] Build passou (`npm run build`)
- [ ] Mensagem de commit clara e descritiva
- [ ] Não commitou `.env` (dados sensíveis)

---

## 🆘 **COMANDOS ÚTEIS**

```bash
# Ver histórico de commits
git log --oneline -10

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Desfazer alterações em um arquivo
 git checkout -- nome-do-arquivo

# Ver diferença entre local e GitHub
git diff origin/main

# Atualizar local com GitHub (antes de trabalhar)
git pull origin main
```

---

## 🎯 **EXEMPLO COMPLETO**

**Cenário:** Você adicionou uma nova funcionalidade de exportação CSV

```bash
# 1. Verifica alterações
git status

# 2. Adiciona arquivos
git add src/actions/leads.ts src/app/admin/leads/page.tsx

# 3. Commit
git commit -m "feat: add exportação de leads em CSV

- Adiciona botão de export na página de leads
- Implementa server action para gerar CSV
- Inclui todos os campos do lead na exportação"

# 4. Push
git push origin main

# 5. (Opcional) Criar versão
git tag -a v2.1.0 -m "v2.1.0 - Exportação CSV de leads"
git push origin v2.1.0
```

---

## 🌿 **TRABALHANDO COM BRANCHES (Avançado)**

Para funcionalidades grandes, crie uma branch separada:

```bash
# Criar nova branch
git checkout -b feature/novo-sistema-notificacoes

# Trabalhar normalmente...
# ...fazer alterações...

# Commit na branch
git add . && git commit -m "feat: sistema de notificações"

# Push da branch
git push origin feature/novo-sistema-notificacoes

# No GitHub: criar Pull Request para mesclar na main
```

---

**Dica:** Sempre faça `git pull origin main` antes de começar a trabalhar para pegar as últimas alterações! 🚀
