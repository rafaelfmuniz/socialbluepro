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
BLUE='\033[0;34m'
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

# Parar serviços
echo "🛑 Parando serviços..."
systemctl stop "$SERVICE_NAME" || true
systemctl stop "${SERVICE_NAME}-media-worker" 2>/dev/null || true

# Salvar .env
cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true

# Garantir FFmpeg e libheif (v2.4.0+)
echo "📹 Verificando FFmpeg..."
if ! command -v ffmpeg &> /dev/null || ! command -v ffprobe &> /dev/null; then
    echo "⬇️  Instalando FFmpeg..."
    apt-get update -qq
    apt-get install -y ffmpeg -qq
fi
echo -e "${GREEN}✓ FFmpeg:$(ffmpeg -version | head -1 | awk '{print $3}')${NC}"

echo "🖼️  Verificando suporte a HEIC/HEIF..."
if ! command -v heif-convert &> /dev/null; then
    echo "⬇️  Instalando libheif-examples..."
    apt-get install -y libheif-examples -qq || echo "⚠️  Aviso: Falha ao instalar libheif-examples"
fi
if command -v heif-convert &> /dev/null; then
    echo -e "${GREEN}✓ heif-convert instalado${NC}"
else
    echo -e "${YELLOW}⚠️  heif-convert não disponível (HEIC pode não converter)${NC}"
fi

# Atualizar código
echo "⬇️  Atualizando código..."
git fetch origin
git reset --hard origin/main

# Restaurar .env
cp /tmp/socialbluepro-env-backup .env 2>/dev/null || true

# Atualizar/garantir variáveis de ambiente (v2.4.0+)
echo "⚙️  Verificando variáveis de ambiente..."
declare -a env_vars=(
    "UPLOAD_TMP_DIR=/opt/socialbluepro/var/uploads-tmp"
    "MEDIA_QUEUE_DIR=/opt/socialbluepro/var/media-queue"
    "MAX_VIDEO_UPLOAD_BYTES=1073741824"
    "MAX_VIDEO_DURATION_SECONDS=360"
    "VIDEO_OUTPUT_MAX_HEIGHT=720"
    "VIDEO_OUTPUT_FPS=30"
    "FFMPEG_THREADS=2"
    "FFMPEG_PRESET=veryfast"
    "FFMPEG_CRF=23"
    "FFMPEG_MAXRATE=3.5M"
    "FFMPEG_BUFSIZE=7M"
    "JOB_TIMEOUT_MS=1200000"
    "MAX_RETRIES=1"
    "LOOP_INTERVAL_MS=2000"
)

for var_def in "${env_vars[@]}"; do
    var_name="${var_def%%=*}"
    var_value="${var_def#*=}"
    if ! grep -q "^${var_name}=" .env 2>/dev/null; then
        echo "➕ Adicionando $var_name"
        echo "${var_name}=\"${var_value}\"" >> .env
    fi
done

# Criar diretórios necessários
upload_tmp_dir=$(grep "^UPLOAD_TMP_DIR=" .env | cut -d'"' -f2)
media_queue_dir=$(grep "^MEDIA_QUEUE_DIR=" .env | cut -d'"' -f2)
mkdir -p "$upload_tmp_dir" 2>/dev/null || true
mkdir -p "$media_queue_dir"/{pending,processing,done,failed} 2>/dev/null || true

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
chown -R www-data:www-data public/uploads 2>/dev/null || true

# Configurar/atualizar serviço do worker (v2.4.0+)
echo "⚙️  Configurando worker de mídia..."
cat > "/etc/systemd/system/${SERVICE_NAME}-media-worker.service" <<'EOF'
[Unit]
Description=SocialBluePro - Media Processing Worker
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/socialbluepro
EnvironmentFile=-/opt/socialbluepro/.env
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /opt/socialbluepro/scripts/media-worker.mjs
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

# Iniciar serviços
echo "🚀 Iniciando serviços..."
systemctl start "$SERVICE_NAME"
systemctl enable "${SERVICE_NAME}-media-worker" 2>/dev/null || true
systemctl start "${SERVICE_NAME}-media-worker" || echo "⚠️  Aviso: Worker não iniciado"

# Verificar
sleep 3
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo ""
    echo -e "${GREEN}✅ Atualização concluída com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}Versão 2.4.0+ - Novidades:${NC}"
    echo "  • Conversão automática HEIC/HEIF → JPEG"
    echo "  • Vídeos convertidos para MP4 720p 30fps"
    echo "  • Upload streaming (suporta até 1GB)"
    echo "  • Worker de processamento separado"
    echo ""
    echo "Backup salvo em: $BACKUP_DIR/${backup_name}.sql"
    echo ""
    echo "Serviços:"
    echo "  App:    sudo systemctl status $SERVICE_NAME"
    echo "  Worker: sudo systemctl status ${SERVICE_NAME}-media-worker"
    echo ""
    echo "Logs:"
    echo "  sudo journalctl -u $SERVICE_NAME -f"
    echo "  sudo journalctl -u ${SERVICE_NAME}-media-worker -f"
else
    echo -e "${RED}❌ Falha ao iniciar serviço${NC}"
    echo "Verifique: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi
