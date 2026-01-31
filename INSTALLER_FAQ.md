# Perguntas Frequentes - Instalador SocialBluePro

## 1. "Created symlink" - O que isso significa?

```
Created symlink /etc/systemd/system/multi-user.target.wants/socialbluepro.service → /etc/systemd/system/socialbluepro.service.
```

### ✅ Isso é normal e bom!

O **symlink (symbolic link)** é o que o systemd usa para habilitar o serviço para iniciar automaticamente no boot do sistema.

### O que significa:
- O serviço `socialbluepro.service` foi **habilitado** para iniciar automaticamente
- Na próxima vez que o servidor for reiniciado, o SocialBluePro vai iniciar sozinho
- Não precisa fazer nada adicional

---

## 2. "Mismatching @next/swc version" - É um erro?

```
⚠ Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11.
```

### ⚠️ É apenas um aviso, não um erro!

### O que significa:
- O **SWC** é o compilador do Next.js (como o Webpack, mas mais rápido)
- Há um mismatch (diferença) entre a versão do SWC (15.5.7) e do Next.js (15.5.11)
- **Isso não impede o funcionamento da aplicação**
- O build completou com sucesso: `✓ Compiled successfully in 10.3s`

### Correção aplicada:
No package.json v2.0.1, atualizamos todas as versões para 15.5.11 para eliminar este aviso.

---

## 3. "A instalação completou com sucesso?"

### Como verificar:

#### Verifique se o serviço está rodando:
```bash
sudo systemctl status socialbluepro
```

**Esperado:**
```
● socialbluepro.service - SocialBluePro - Sistema de Gestão de Leads
     Loaded: loaded (/etc/systemd/system/socialbluepro.service; enabled; vendor preset: enabled)
     Active: active (running) since ...
```

#### Verifique se a aplicação responde:
```bash
curl http://localhost:3000
```

**Esperado:** HTML da aplicação (página inicial)

#### Verifique os logs se houver erro:
```bash
sudo journalctl -u socialbluepro -n 50
```

---

## 4. "Cade o aviso de instalação completa?"

### Possíveis causas:

#### Causa 1: health_check falhou
O instalador verifica se a aplicação está respondendo em `http://localhost:3000`.

**Se o health_check falhar:**
```bash
# Verifique o status do serviço
sudo systemctl status socialbluepro

# Verifique os logs
sudo journalctl -u socialbluepro -n 50
```

#### Causa 2: Script foi interrompido
Se o usuário pressionou `Ctrl+C` ou houve algum erro, o instalador pode ter parado antes de mostrar a mensagem final.

**Para ver as credenciais salvas:**
```bash
sudo cat /root/.socialbluepro-credentials
```

#### Causa 3: Erro no serviço systemd
Se o serviço systemd não conseguiu iniciar a aplicação, a instalação pode ter falhado silenciosamente.

**Solução:**
```bash
# Verifique o status
sudo systemctl status socialbluepro

# Se mostrar erro, tente reiniciar manualmente
sudo systemctl restart socialbluepro
```

---

## 5. Como acessar a aplicação?

### Via terminal (no servidor):
```bash
http://localhost:3000
```

### Via rede (de outro computador):
```bash
# Primeiro descubra o IP do servidor
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1

# Depois acesse no navegador
http://SEU-IP:3000
```

### Exemplo:
Se o IP for `192.168.1.100`, acesse:
```
http://192.168.1.100:3000
```

---

## 6. Onde estão as credenciais?

### Arquivo de credenciais:
```bash
sudo cat /root/.socialbluepro-credentials
```

### Conteúdo do arquivo:
```
========================================
SocialBluePro - Credenciais de Acesso
Versão: 2.0.0
Gerado: ...
========================================

ADMIN:
  Email:    admin-a3f5@local.system
  Senha:    xK9mP2nQ7rT5vWjL

BANCO DE DADOS:
  Usuário:  sbp_user
  Senha:    [senha-gerada-aleatoriamente]

ACESSO:
  Local:    http://localhost:3000
  Rede:     http://SEU-IP:3000
```

---

## 7. Comandos úteis

### Gerenciar o serviço:
```bash
sudo systemctl start socialbluepro   # Iniciar
sudo systemctl stop socialbluepro    # Parar
sudo systemctl restart socialbluepro  # Reiniciar
sudo systemctl status socialbluepro  # Status
```

### Verificar logs:
```bash
# Logs recentes (últimas 50 linhas)
sudo journalctl -u socialbluepro -n 50

# Logs em tempo real
sudo journalctl -u socialbluepro -f

# Logs completos
sudo journalctl -u socialbluepro
```

### Log de instalação:
```bash
sudo cat /var/log/socialbluepro-install.log
```

---

## 8. Resolução de problemas

### Problema: Serviço não inicia
```bash
# Verificar status
sudo systemctl status socialbluepro

# Verificar logs
sudo journalctl -u socialbluepro -n 50

# Tentar iniciar manualmente para ver erro
cd /opt/socialbluepro
sudo npm start
```

### Problema: Porta 3000 ocupada
```bash
# Encontrar processo usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Reiniciar serviço
sudo systemctl restart socialbluepro
```

### Problema: Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar se banco existe
sudo -u postgres psql -lqt

# Testar conexão
sudo -u postgres psql socialbluepro
```

---

## 9. Quando executar o instalador novamente?

### Execute o instalador quando:
- Quiser **reinstalar** tudo (opção 2)
- Quiser **atualizar** o código mantendo dados (opção 3)
- Quiser **desinstalar** o sistema (opção 4)

### Não execute quando:
- Apenas quiser reiniciar o serviço → `sudo systemctl restart socialbluepro`
- Quiser verificar logs → `sudo journalctl -u socialbluepro -f`
- Quiser acessar credenciais → `sudo cat /root/.socialbluepro-credentials`

---

**Última atualização:** 2026-01-30  
**Versão do instalador:** v2.0.0
