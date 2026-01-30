#!/bin/bash
#
# SocialBluePro - Instalação Simplificada
# Roda diretamente em localhost:3000 ou IP:3000
# Uso: curl -fsSL https://raw.githubusercontent.com/seu-usuario/socialbluepro/main/install.sh | sudo bash

set -e

INSTALL_DIR="/opt/socialbluepro"
SERVICE_NAME="socialbluepro"
REPO_URL="https://github.com/rafaelfmuniz/socialbluepro.git"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warning() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Verificar root
if [[ $EUID -ne 0 ]]; then
   error "Execute como root: sudo curl ... | sudo bash"
fi

log "SocialBluePro - Instalador"
echo "=========================="
echo ""

# Verificar se é Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    error "Suporta apenas Ubuntu/Debian"
fi

# Detectar se é instalação ou atualização
if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo -e "${YELLOW}Instalação existente detectada${NC}"
    echo "Atualizando..."
    echo ""
    
    cd "$INSTALL_DIR"
    
    # Backup do banco
    log "Backupeando banco..."
    sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-$(date +%Y%m%d).sql" || warning "Falha no backup"
    
    # Parar serviço
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Atualizar código
    log "Atualizando código..."
    git fetch origin
    git reset --hard origin/main
    
    # Atualizar dependências
    log "Atualizando dependências..."
    npm install --production
    
    # Atualizar banco
    log "Atualizando banco de dados..."
    npx prisma migrate deploy
    
    # Rebuild
    log "Compilando..."
    npm run build
    
    # Iniciar
    log "Iniciando serviço..."
    systemctl start "$SERVICE_NAME"
    
    success "Atualização concluída!"
    echo ""
    echo "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    exit 0
fi

# ===== INSTALAÇÃO NOVA =====
log "Iniciando instalação nova..."
echo ""

# Instalar dependências
log "Instalando Node.js e PostgreSQL..."
apt-get update -qq
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>/dev/null
apt-get install -y -qq nodejs postgresql postgresql-client git curl

# Configurar PostgreSQL
log "Configurando banco de dados..."
systemctl start postgresql
systemctl enable postgresql

DB_PASS=$(openssl rand -hex 16)
sudo -u postgres psql -c "CREATE DATABASE socialbluepro;" 2>/dev/null || warning "Banco já existe"
sudo -u postgres psql -c "CREATE USER sbp_user WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;"

# Criar diretório
log "Baixando projeto..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone
git clone --depth 1 "$REPO_URL" . || error "Falha ao clonar repositório"

# Criar .env
log "Configurando ambiente..."
cat > .env << EOF
DATABASE_URL="postgresql://sbp_user:$DB_PASS@localhost:5432/socialbluepro"
DIRECT_URL="postgresql://sbp_user:$DB_PASS@localhost:5432/socialbluepro"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3000
ENCRYPTION_KEY="$(openssl rand -hex 32)"
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=1073741824
EOF

# Instalar dependências
log "Instalando dependências..."
npm install --production

# Prisma
log "Configurando Prisma..."
npx prisma generate
npx prisma migrate deploy

# Build
log "Compilando aplicação..."
npm run build || error "Falha no build"

# Diretório de uploads
mkdir -p public/uploads
chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads

# Criar serviço systemd
log "Criando serviço..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << 'EOF'
[Unit]
Description=SocialBluePro
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/socialbluepro
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Aguardar
sleep 3

# Verificar
if systemctl is-active --quiet "$SERVICE_NAME"; then
    success "Instalação concluída!"
    echo ""
    echo "========================================"
    echo -e "${GREEN}SocialBluePro está rodando!${NC}"
    echo "========================================"
    echo ""
    echo "🌐 Acesse:"
    echo "   Local: http://localhost:3000"
    echo "   Rede:  http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📝 Comandos:"
    echo "   sudo systemctl start $SERVICE_NAME  - Iniciar"
    echo "   sudo systemctl stop $SERVICE_NAME   - Parar"
    echo "   sudo systemctl status $SERVICE_NAME - Status"
    echo ""
else
    error "Falha ao iniciar serviço"
fi
