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
    
    cd "$INSTALL_DIR" 2>/dev/null || true
    
    # Mostrar versão atual
    CURRENT_VERSION=$(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "desconhecida")
    echo -e "${BLUE}Versão atual:${NC} $CURRENT_VERSION"
    echo -e "${BLUE}Nova versão disponível:${NC} $SCRIPT_BRANCH"
    echo ""
    
    # Menu simples
    echo "Escolha uma opção:"
    echo ""
    echo "${GREEN}[1] Reinstalar${NC} - Limpar tudo e instalar do zero (RECOMENDADO se deu erro)"
    echo "${YELLOW}[2] Atualizar${NC} - Manter dados e atualizar código"
    echo "${RED}[3] Cancelar${NC} - Sair sem fazer alterações"
    echo ""
    read -p "Digite 1, 2 ou 3: " choice
    
    case "$choice" in
        1)
            echo ""
            echo -e "${BLUE}🧹 Preparando reinstalação limpa...${NC}"
            echo ""
            
            # Parar serviço
            systemctl stop "$SERVICE_NAME" 2>/dev/null || true
            
            # Backup do banco
            log "Fazendo backup do banco..."
            sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-reinstall-$(date +%Y%m%d-%H%M%S).sql" || warning "Falha no backup"
            
            # Salvar .env se existir
            [[ -f "$INSTALL_DIR/.env" ]] && cp "$INSTALL_DIR/.env" /tmp/socialbluepro-env-backup
            
            # Remover diretório antigo
            log "Removendo instalação antiga..."
            cd /
            rm -rf "$INSTALL_DIR"
            
            success "✅ Diretório antigo removido"
            echo ""
            echo -e "${GREEN}🚀 Continuando com instalação nova...${NC}"
            echo ""
            
            # Continuar para instalação nova (SAIR DO IF E CONTINUAR)
            ;;
        2)
            echo ""
            echo -e "${BLUE}🔄 Atualizando instalação existente...${NC}"
            echo ""
            
            # Verificar se diretório existe e entramos nele
            if [[ ! -d "$INSTALL_DIR/.git" ]]; then
                error "❌ Diretório de instalação não encontrado"
            fi
            
            cd "$INSTALL_DIR"
            
            # Backup do banco
            log "Backupeando banco..."
            sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-$(date +%Y%m%d-%H%M%S).sql" || warning "Falha no backup"
            
            # Parar serviço
            log "Parando serviço..."
            systemctl stop "$SERVICE_NAME" 2>/dev/null || true
            
            # Salvar .env
            cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true
            
            # Atualizar código
            log "Baixando código novo..."
            git fetch origin
            git reset --hard origin/$SCRIPT_BRANCH
            
            # Restaurar .env
            cp /tmp/socialbluepro-env-backup .env 2>/dev/null || true
            
            # Instalar dependências
            log "Atualizando dependências..."
            npm install --production
            
            # Banco de dados
            log "Atualizando banco de dados..."
            npx prisma migrate deploy
            
            # Build
            log "Compilando..."
            npm run build
            
            # Permissões
            chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
            
            # Iniciar
            log "Iniciando serviço..."
            systemctl start "$SERVICE_NAME"
            
            # Verificar
            sleep 3
            if systemctl is-active --quiet "$SERVICE_NAME"; then
                success "✅ Atualização concluída!"
                echo ""
                echo "🌐 Acesse: http://$(hostname -I | awk '{print $1}'):3000"
                echo ""
                exit 0
            else
                error "❌ Falha ao iniciar serviço"
            fi
            ;;
        3|*)
            echo ""
            echo "Operação cancelada pelo usuário."
            exit 0
            ;;
    esac
    
    # Se escolheu opção 1 (reinstalar), o código continua aqui para instalação nova
    # Se escolheu opção 2, já terminou acima com exit 0
    # Se escolheu 3 ou outra, saiu com exit 0
fi
    
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
