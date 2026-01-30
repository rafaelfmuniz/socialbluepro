#!/bin/bash
#
# SocialBluePro - Instalação/Atualização Automatizada
# Gera credenciais aleatórias para o usuário admin
# 
# INSTALAÇÃO NOVA (versão específica):
#   curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/v2.0.0/install.sh | sudo bash
#
# INSTALAÇÃO NOVA (última versão - main):
#   curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
#
# ATUALIZAÇÃO (sempre pega última versão):
#   cd /opt/socialbluepro && sudo git pull origin main && sudo npm install --production && sudo npx prisma migrate deploy && sudo npm run build && sudo systemctl restart socialbluepro

set -e

INSTALL_DIR="/opt/socialbluepro"
SERVICE_NAME="socialbluepro"
REPO_URL="https://github.com/rafaelfmuniz/socialbluepro.git"
SCRIPT_BRANCH="${SCRIPT_BRANCH:-main}"  # Branch do script (v2.0.0, main, etc)

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

log "SocialBluePro - Instalador Seguro"
echo "=================================="
echo ""

# Verificar se é Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    error "Suporta apenas Ubuntu/Debian"
fi

# Detectar se é instalação ou atualização
if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo -e "${YELLOW}⚠️  Instalação existente detectada em $INSTALL_DIR${NC}"
    echo ""
    
    cd "$INSTALL_DIR"
    
    # Verificar se a instalação está funcionando
    INSTALLATION_BROKEN=false
    if ! npm --version &>/dev/null || ! node --version &>/dev/null; then
        INSTALLATION_BROKEN=true
        echo -e "${RED}❌ A instalação anterior parece estar quebrada (Node.js/npm não encontrado)${NC}"
    elif [[ ! -d "node_modules" ]] || [[ ! -f "package-lock.json" ]]; then
        INSTALLATION_BROKEN=true
        echo -e "${RED}❌ A instalação anterior está incompleta (faltam dependências)${NC}"
    fi
    
    # Se estiver quebrada, oferecer reinstalação limpa
    if [[ "$INSTALLATION_BROKEN" == true ]]; then
        echo ""
        echo -e "${YELLOW}⚠️  Instalação quebrada detectada!${NC}"
        echo ""
        echo "Opções:"
        echo "1. ${GREEN}[R]einstalar${NC} - Limpar tudo e instalar do zero (recomendado)"
        echo "2. ${YELLOW}[A]tualizar${NC} - Tentar corrigir a instalação existente"
        echo "3. ${RED}[C]ancelar${NC} - Sair sem fazer nada"
        echo ""
        read -p "Escolha uma opção (R/A/C): " choice
        
        case "$choice" in
            [Rr])
                echo -e "${BLUE}Preparando reinstalação limpa...${NC}"
                # Parar serviço se estiver rodando
                systemctl stop "$SERVICE_NAME" 2>/dev/null || true
                # Backup do banco
                log "Fazendo backup do banco antes da reinstalação..."
                sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-reinstall-$(date +%Y%m%d-%H%M%S).sql" || warning "Falha no backup"
                # Remover instalação antiga (preservando .env se existir)
                cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true
                cd /
                rm -rf "$INSTALL_DIR"
                echo -e "${GREEN}✅ Diretório antigo removido. Continuando com instalação nova...${NC}"
                echo ""
                # Continuar para instalação nova
                ;;
            [Aa])
                echo -e "${BLUE}Tentando atualizar instalação existente...${NC}"
                ;;
            *)
                echo "Operação cancelada."
                exit 0
                ;;
        esac
    else
        # Instalação parece OK, oferecer atualização normal
        CURRENT_VERSION=$(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)
        echo -e "${BLUE}Versão atual:${NC} $CURRENT_VERSION"
        echo -e "${BLUE}Nova versão:${NC} $SCRIPT_BRANCH"
        echo ""
        echo "${YELLOW}Este script vai atualizar seu sistema para a última versão.${NC}"
        echo "${YELLOW}Seu banco de dados e configurações serão preservados.${NC}"
        echo ""
        read -p "Deseja continuar com a atualização? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            echo "Atualização cancelada."
            exit 0
        fi
    fi
    
    echo ""
    
    # Se chegou aqui, é para atualizar (não reinstalar do zero)
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd "$INSTALL_DIR"
        
        # Backup do banco
        log "Backupeando banco..."
        sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-$(date +%Y%m%d-%H%M%S).sql" || warning "Falha no backup"
        
        # Parar serviço
        log "Parando serviço..."
        systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        
        # Salvar .env atual
        cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true
        
        # Atualizar código
        log "Atualizando código..."
        git fetch origin
        git reset --hard origin/$SCRIPT_BRANCH
        
        # Restaurar .env
        cp /tmp/socialbluepro-env-backup .env 2>/dev/null || true
        
        # Atualizar dependências
        log "Atualizando dependências..."
        npm install --production
        
        # Atualizar banco
        log "Atualizando banco de dados..."
        npx prisma migrate deploy
        
        # Rebuild
        log "Compilando..."
        npm run build
        
        # Ajustar permissões
        chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
        
        # Iniciar
        log "Iniciando serviço..."
        systemctl start "$SERVICE_NAME"
    
    # Verificar
    sleep 3
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        success "✅ Atualização concluída com sucesso!"
        echo ""
        echo -e "${GREEN}Versão atualizada:${NC} $(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)"
        echo ""
        echo "🌐 Acesse: http://$(hostname -I | awk '{print $1}'):3000"
        echo ""
        echo "📋 Comandos úteis:"
        echo "  Ver logs: sudo tail -f /var/log/socialbluepro.log"
        echo "  Status: sudo systemctl status $SERVICE_NAME"
        echo ""
    else
        error "❌ Falha ao iniciar serviço após atualização"
    fi
    
    exit 0
fi

# ===== INSTALAÇÃO NOVA =====
log "Iniciando instalação nova..."
echo ""

# Gerar credenciais aleatórias para o admin
ADMIN_EMAIL="admin-$(openssl rand -hex 4)@local.system"
ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
ADMIN_HASH=$(echo -n "$ADMIN_PASSWORD" | openssl dgst -sha256 -binary | openssl base64)

log "Credenciais do administrador geradas (serão mostradas no final)"

# Instalar dependências
log "Instalando Node.js LTS mais recente e PostgreSQL..."
apt-get update -qq

# Detectar e instalar Node.js LTS mais recente (automático)
# O script detecta a distro e instala a versão LTS apropriada
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_current.x | bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null

apt-get install -y -qq nodejs postgresql postgresql-client git curl

# Verificar versão instalada
NODE_VERSION=$(node --version 2>/dev/null || echo "N/A")
log "Node.js instalado: $NODE_VERSION"

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

# Criar usuário admin via script SQL seguro
log "Criando usuário administrador..."
sudo -u postgres psql socialbluepro << EOF
INSERT INTO admin_users (id, name, email, password_hash, role, is_active, failed_attempts, is_default_password)
VALUES (
    gen_random_uuid(),
    'Administrador',
    '$ADMIN_EMAIL',
    crypt('$ADMIN_PASSWORD', gen_salt('bf')),
    'admin',
    true,
    0,
    true
)
ON CONFLICT (email) DO NOTHING;
EOF

# Build
log "Compilando aplicação..."
npm run build || error "Falha no build"

# Diretório de uploads
mkdir -p public/uploads
chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads

# Criar arquivo com credenciais (apenas root pode ler)
CRED_FILE="/root/.socialbluepro-credentials"
cat > "$CRED_FILE" << EOF
====================================
SocialBluePro - Credenciais de Acesso
Gerado em: $(date)
====================================

Email: $ADMIN_EMAIL
Senha: $ADMIN_PASSWORD

IMPORTANTE:
- Este arquivo está em /root/.socialbluepro-credentials
- Apenas root pode ler este arquivo
- Altere a senha após o primeiro login
- Delete este arquivo após anotar as credenciais

Acesso: http://$(hostname -I | awk '{print $1}'):3000
====================================
EOF
chmod 600 "$CRED_FILE"

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
    INSTALLED_VERSION=$(git describe --tags --exact-match 2>/dev/null || echo "$SCRIPT_BRANCH")
    
    success "Instalação concluída!"
    echo ""
    echo "========================================"
    echo -e "${GREEN}SocialBluePro v$INSTALLED_VERSION instalado!${NC}"
    echo "========================================"
    echo ""
    echo -e "${YELLOW}🔐 CREDENCIAIS DE ACESSO (GUARDE ISSO):${NC}"
    echo ""
    echo -e "${GREEN}Email:${NC} $ADMIN_EMAIL"
    echo -e "${GREEN}Senha:${NC} $ADMIN_PASSWORD"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   - Altere a senha após o primeiro login"
    echo "   - Credenciais salvas em: /root/.socialbluepro-credentials"
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
    echo "🔄 Atualizações futuras:"
    echo "   curl -fsSL $REPO_URL/raw/main/install.sh | sudo bash"
    echo ""
else
    error "Falha ao iniciar serviço"
fi
