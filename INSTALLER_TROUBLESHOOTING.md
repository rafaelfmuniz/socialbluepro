# Troubleshooting do Instalador - SocialBluePro v2.1.0

## 📋 Índice

1. [Erros Comuns](#erros-comuns)
2. [Problemas de Conectividade](#problemas-de-conectividade)
3. [Problemas de Recursos](#problemas-de-recursos)
4. [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
5. [Problemas de Serviço](#problemas-de-serviço)
6. [Debug Avançado](#debug-avançado)

---

## 🔴 Erros Comuns

### Erro: "Este script deve ser executado como root (use sudo)"

**Causa:** O script não está sendo executado com permissões de root.

**Solução:**
```bash
# Errado
bash install.sh

# Correto
sudo bash install.sh

# Ou via curl
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

---

### Erro: "Espaço em disco insuficiente"

**Causa:** Menos de 5GB livres no disco.

**Solução:**
```bash
# Verificar espaço em disco
df -h /

# Liberar espaço
sudo apt-get clean
sudo apt-get autoremove

# Limpar cache do npm (se existir)
sudo rm -rf ~/.npm
```

---

### Erro: "Sem conexão com GitHub"

**Causa:** Sem conectividade com a internet ou firewall bloqueando.

**Solução:**
```bash
# Testar conectividade
ping github.com
ping deb.nodesource.com

# Verificar firewall
sudo ufw status

# Se bloqueado, permitir:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

### Erro: "Porta 3000 já está em uso"

**Causa:** Outro processo está usando a porta 3000.

**Solução:**
```bash
# Encontrar processo usando a porta 3000
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou usar outra porta (editar .env após instalação)
```

---

### Erro: "Senha do banco não encontrada em /tmp/socialbluepro-install/db_password"

**Causa:** Diretório temporário não foi criado ou foi removido prematuramente.

**Solução:**
```bash
# Verificar se o diretório existe
ls -la /tmp/socialbluepro-install/

# Se não existir, executar novamente (o instalador v2.1.0 garante criação)
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

---

## 🌐 Problemas de Conectividade

### Falha ao configurar NodeSource

**Sintoma:** Erro durante `curl -fsSL https://deb.nodesource.com/setup_20.x`

**Soluções:**
```bash
# 1. Verificar DNS
ping deb.nodesource.com

# 2. Tentar mirror alternativo
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -

# 3. Verificar proxy (se houver)
export http_proxy=http://your-proxy:port
export https_proxy=http://your-proxy:port
```

---

### Falha ao clonar repositório

**Sintoma:** Erro durante `git clone`

**Soluções:**
```bash
# 1. Testar conexão com GitHub
ssh -T git@github.com

# 2. Usar HTTPS em vez de SSH
git clone https://github.com/rafaelfmuniz/socialbluepro.git

# 3. Verificar firewall/proxy
ping github.com
```

---

## 💾 Problemas de Recursos

### RAM abaixo do recomendado

**Sintoma:** Aviso de RAM insuficiente (< 2GB)

**Soluções:**
```bash
# Verificar RAM disponível
free -h

# Opcional: Criar swap file (se RAM muito baixa)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Para desativar swap após instalação
sudo swapoff /swapfile
sudo rm /swapfile
```

---

### Instalação lenta no npm install

**Sintoma:** `npm install` demora muito

**Soluções:**
```bash
# 1. Verificar conexão
ping registry.npmjs.org

# 2. Usar mirror CNPM (se na China)
npm config set registry https://registry.npm.taobao.org

# 3. Aumentar timeout
npm install --production --timeout=180000

# 4. Verificar uso de CPU/RAM
htop
```

---

## 🗄️ Problemas de Banco de Dados

### PostgreSQL não inicia

**Sintoma:** Erro "PostgreSQL não iniciou após X tentativas"

**Soluções:**
```bash
# 1. Verificar status do PostgreSQL
sudo systemctl status postgresql

# 2. Reiniciar PostgreSQL
sudo systemctl restart postgresql

# 3. Verificar logs
sudo tail -n 50 /var/log/postgresql/postgresql-*.log

# 4. Verificar se há outros PostgreSQL rodando
sudo netstat -tulpn | grep 5432
```

---

### Erro de autenticação PostgreSQL

**Sintoma:** `psql: FATAL: password authentication failed`

**Soluções:**
```bash
# 1. Testar conexão como postgres
sudo -u postgres psql

# 2. Se falhar, resetar autenticação
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'newpassword';"

# 3. Verificar pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# 4. Deve ter linha:
# local   all             all                                     md5
```

---

### Banco de dados corrompido

**Sintoma:** Erros de corrupção durante migrações

**Solução:**
```bash
# 1. Fazer backup (se possível)
sudo -u postgres pg_dump socialbluepro > backup.sql

# 2. Recompor banco
sudo -u postgres psql -c "DROP DATABASE socialbluepro;"
sudo -u postgres psql -c "CREATE DATABASE socialbluepro;"

# 3. Restaurar backup
sudo -u postgres psql socialbluepro < backup.sql
```

---

## 🚀 Problemas de Serviço

### Serviço não inicia

**Sintoma:** `systemctl start socialbluepro` falha

**Soluções:**
```bash
# 1. Verificar logs do serviço
sudo journalctl -u socialbluepro -n 50

# 2. Verificar se o .next/standalone/server.js existe
ls -la /opt/socialbluepro/.next/standalone/

# 3. Se não existe, fazer build
cd /opt/socialbluepro
sudo npm run build

# 4. Verificar permissões
sudo chown -R root:root /opt/socialbluepro
sudo chmod -R 755 /opt/socialbluepro
```

---

### Erro "Cannot find module"

**Sintoma:** Serviço inicia mas retorna erro de módulo não encontrado

**Soluções:**
```bash
# 1. Reinstalar dependências
cd /opt/socialbluepro
sudo npm install --production

# 2. Limpar cache do Next.js
sudo rm -rf .next
sudo npm run build

# 3. Reiniciar serviço
sudo systemctl restart socialbluepro
```

---

### Aplicação não acessível

**Sintoma:** Serviço rodando mas não acessível no navegador

**Soluções:**
```bash
# 1. Verificar se está rodando
sudo systemctl status socialbluepro

# 2. Verificar se porta está aberta
sudo netstat -tulpn | grep 3000

# 3. Testar localmente
curl http://localhost:3000

# 4. Verificar firewall
sudo ufw allow 3000

# 5. Verificar logs de erro
sudo journalctl -u socialbluepro -f
```

---

## 🔍 Debug Avançado

### Executar instalador em modo DEBUG

```bash
# Adicionar flag --debug para logs detalhados
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash -s -- --debug
```

### Verificar log completo de instalação

```bash
# Log de instalação
sudo cat /var/log/socialbluepro-install.log

# Logs do serviço em tempo real
sudo journalctl -u socialbluepro -f

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Verificar arquivos de configuração

```bash
# .env (não deve estar no git)
sudo cat /opt/socialbluepro/.env

# Verificar DATABASE_URL
sudo grep DATABASE_URL /opt/socialbluepro/.env

# Credenciais de admin
sudo cat /root/.socialbluepro-credentials
```

### Reset completo (Reinstalação limpa)

```bash
# 1. Parar serviço
sudo systemctl stop socialbluepro
sudo systemctl disable socialbluepro

# 2. Remover serviço
sudo rm /etc/systemd/system/socialbluepro.service
sudo systemctl daemon-reload

# 3. Remover banco
sudo -u postgres psql -c "DROP DATABASE socialbluepro;"
sudo -u postgres psql -c "DROP USER sbp_user;"

# 4. Remover arquivos
sudo rm -rf /opt/socialbluepro
sudo rm -rf /tmp/socialbluepro-install

# 5. Reinstalar
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
```

---

## 📞 Obter Ajuda

Se você não conseguiu resolver o problema:

1. **Cole o erro completo** no GitHub Issues
2. **Inclua informações do sistema:**
   ```bash
   cat /etc/os-release
   uname -a
   node --version
   psql --version
   ```
3. **Inclua os logs relevantes:**
   - `/var/log/socialbluepro-install.log`
   - `sudo journalctl -u socialbluepro -n 50`
4. **Descreva o que você tentou**

---

**Última atualização:** 2026-01-30  
**Versão do instalador:** v2.1.0
