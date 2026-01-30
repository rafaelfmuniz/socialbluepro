#!/bin/bash
#
# SocialBluePro - Script de Backup
# Uso: sudo ./backup.sh

set -euo pipefail

INSTALL_DIR="/opt/socialbluepro"
BACKUP_DIR="/opt/socialbluepro-backups"
RETENTION_DAYS=30

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}SocialBluePro - Backup${NC}"
echo "======================="
echo ""

# Verificar root
if [[ $EUID -ne 0 ]]; then
   echo "Execute como root (sudo)"
   exit 1
fi

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Timestamp
timestamp=$(date +%Y%m%d-%H%M%S)
echo "📅 Backup iniciado: $timestamp"

# Backup do banco
echo "💾 Backupeando banco de dados..."
sudo -u postgres pg_dump socialbluepro | gzip > "$BACKUP_DIR/db-${timestamp}.sql.gz"

# Backup dos arquivos
echo "📁 Backupeando arquivos..."
tar -czf "$BACKUP_DIR/files-${timestamp}.tar.gz" -C "$INSTALL_DIR" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    .

# Backup do .env
cp "$INSTALL_DIR/.env" "$BACKUP_DIR/env-${timestamp}"

echo -e "${GREEN}✅ Backup concluído!${NC}"
echo ""
echo "Arquivos criados:"
ls -lh "$BACKUP_DIR"/*-${timestamp}*

# Limpar backups antigos
echo ""
echo "🧹 Limpando backups antigos (> ${RETENTION_DAYS} dias)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "env-*" -mtime +$RETENTION_DAYS -delete

echo ""
echo "Backups disponíveis:"
ls -lh "$BACKUP_DIR"
