# SocialBluePro - Instalador

Instalador profissional e automatizado para deploy do SocialBluePro em servidores Linux baremetal (Debian/Ubuntu).

## Quick Start

### Instalação Limpa (RECOMENDADO - Instalador Simplificado)

⚠️ **Use o instalador simplificado** `install-simple.sh` para instalações novas ou reinstalações completas.

```bash
# Transferir a pasta prod (contém código + instalador)
scp -r prod/ user@server:/tmp/

# Acessar servidor
ssh user@server

# Verificar estrutura
ls -la /tmp/prod/
# Deve mostrar: src/, public/, prisma/, socialbluepro-install/

# Executar instalador simplificado
cd /tmp/prod/socialbluepro-install
chmod +x install-simple.sh
sudo ./install-simple.sh
```

### Atualização (Use `install.sh`)

Para atualizações mantendo dados existentes:

```bash
# O mesmo comando detecta instalação existente e atualiza
cd /tmp/prod/socialbluepro-install
chmod +x install.sh
sudo ./install.sh
```

## Estrutura

```
socialbluepro-install/
├── install-simple.sh      # Instalador simplificado (RECOMENDADO para instalação limpa)
├── install.sh              # Script principal de instalação/atualização (para updates)
├── config/
│   └── .env.example        # Exemplo de configuração
├── services/
│   └── socialbluepro.service # Configuração do systemd
├── scripts/
│   ├── backup.sh           # Script de backup
│   ├── restore.sh          # Script de restore
│   └── update.sh           # Script de atualização standalone
```

### Diferença entre `install-simple.sh` e `install.sh`

- **`install-simple.sh`**: Para instalações limpas ou reinstalações completas. Mais simples, menos passos, mais confiável.
- **`install.sh`**: Para atualizações mantendo dados existentes. Mais complexo, inclui backup e rollback.

## Características

- ✅ Instalação automática (zero interação)
- ✅ Detecção inteligente (instalação limpa ou atualização)
- ✅ Backup automático antes de atualizar
- ✅ Rollback fácil
- ✅ Firewall configurado (UFW)
- ✅ Systemd service configurado

## Comandos Úteis

### Gerenciamento do Serviço

```bash
# Iniciar serviço
sudo systemctl start socialbluepro

# Parar serviço
sudo systemctl stop socialbluepro

# Reiniciar serviço
sudo systemctl restart socialbluepro

# Ver status
sudo systemctl status socialbluepro

# Ver logs
sudo journalctl -u socialbluepro -f
```

### Backup e Restore

```bash
# Criar backup
sudo /opt/socialbluepro-install/scripts/backup.sh

# Restaurar backup
sudo /opt/socialbluepro-install/scripts/restore.sh /var/backups/socialbluepro/backup_YYYYMMDD_HHMMSS
```

### Atualização Manual

```bash
# Usar script de atualização standalone
sudo /opt/socialbluepro-install/scripts/update.sh
```

## Requisitos do Sistema

### Mínimos

- **SO**: Debian 10+ ou Ubuntu 20.04+
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB
- **Rede**: Conexão com internet

### Portas Utilizadas

| Porta | Protocolo | Uso |
|-------|-----------|-----|
| 22 | TCP | SSH |
| 3000 | TCP | Aplicação |
| 5432 | TCP | PostgreSQL (interna) |

## Após a Instalação

### Credenciais Salvas

⚠️ **IMPORTANTE**: As credenciais são salvas automaticamente em:
```
/root/socialbluepro-credentials.txt
```

Este arquivo contém:
- URL de acesso à aplicação
- Credenciais do admin (email e senha)
- Credenciais do banco de dados
- Comandos úteis

O arquivo tem permissões restritas (600) e só pode ser lido pelo root.

### Acessar as Credenciais

```bash
# Como root
cat /root/socialbluepro-credentials.txt
```

### Acesso à Aplicação

Após a instalação bem-sucedida:

- **URL**: `http://seu-ip-servidor:3000`

Faça login usando as credenciais salvas em `/root/socialbluepro-credentials.txt`.

### Primeiros Passos

1. Fazer login com as credenciais salvas
2. Configurar SMTP em Settings > Email Channels
3. Importar leads ou cadastrar manualmente
4. Criar campanhas de email marketing

---

**Versão do Instalador**: 2.0.0 (install-simple.sh + install.sh melhorado)  
**Última Atualização**: 21/01/2026
