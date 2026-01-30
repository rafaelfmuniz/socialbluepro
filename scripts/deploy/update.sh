#!/bin/bash
#
# SocialBluePro - Script de Atualização Rápida
# Uso: sudo ./update.sh
#
# Este script atualiza uma instalação existente de forma rápida

set -euo pipefail

INSTALL_DIR="/opt/socialbluepro"
SERVICE_NAME="socialbluepro"
BACKUP_DIR="/opt/socialbluepro-backups"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}SocialBluePro - Atualização Rápida${NC}"
echo "====================================="
echo ""

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 
   exit 1
fi

# Verificar se instalação existe
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    echo -e "${RED}Instalação não encontrada em $INSTALL_DIR${NC}"
    echo "Execute o script de instalação primeiro"
    exit 1
fi

cd "$INSTALL_DIR"

# Criar backup
echo "📦 Criando backup..."
mkdir -p "$BACKUP_DIR"
backup_name="backup-$(date +%Y%m%d-%H%M%S)"
sudo -u postgres pg_dump socialbluepro > "$BACKUP_DIR/${backup_name}.sql" 2>/dev/null || echo "⚠️  Aviso: Falha no backup do banco"
tar -czf "$BACKUP_DIR/${backup_name}.tar.gz" --exclude='node_modules' --exclude='.next' . 2>/dev/null || echo "⚠️  Aviso: Falha no backup de arquivos"

# Parar serviço
echo "🛑 Parando serviço..."
systemctl stop "$SERVICE_NAME" || true

# Salvar .env
cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true

# Atualizar código
echo "⬇️  Atualizando código..."
git fetch origin
git reset --hard origin/main

# Restaurar .env
cp /tmp/socialbluepro-env-backup .env 2>/dev/null || true

# Atualizar dependências
echo "📦 Atualizando dependências..."
npm install --production

# Atualizar banco
echo "🗄️  Atualizando banco de dados..."
npx prisma migrate deploy

# Rebuild
echo "🔨 Compilando..."
npm run build

# Ajustar permissões
chown -R www-data:www-data public/uploads

# Iniciar serviço
echo "🚀 Iniciando serviço..."
systemctl start "$SERVICE_NAME"

# Verificar
sleep 3
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Atualização concluída com sucesso!${NC}"
    echo ""
    echo "Backup salvo em: $BACKUP_DIR/${backup_name}.sql"
    echo ""
    echo "Comandos úteis:"
    echo "  Ver logs: sudo tail -f /var/log/socialbluepro.log"
    echo "  Status: sudo systemctl status $SERVICE_NAME"
    echo "  Reiniciar: sudo systemctl restart $SERVICE_NAME"
else
    echo -e "${RED}❌ Falha ao iniciar serviço${NC}"
    echo "Verifique: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi
