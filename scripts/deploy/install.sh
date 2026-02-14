#!/bin/bash
#
# SocialBluePro - Script de Instalação/Atualização Automatizado
# Uso: curl -fsSL https://raw.githubusercontent.com/seu-usuario/socialbluepro/main/scripts/deploy/install.sh | sudo bash
#
# Este script detecta automaticamente se é uma instalação nova ou atualização
# e executa o procedimento adequado.

set -euo pipefail

# ============================================
# CONFIGURAÇÕES
# ============================================
INSTALL_DIR="/opt/socialbluepro"
SERVICE_NAME="socialbluepro"
REPO_URL="https://github.com/seu-usuario/socialbluepro.git"  # <-- ALTERE PARA SEU REPO
TEMP_DIR="/tmp/socialbluepro-deploy"
LOG_FILE="/var/log/socialbluepro-install.log"
BACKUP_DIR="/opt/socialbluepro-backups"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURAÇÕES NPM (Silenciar warnings)
# ============================================
export npm_config_audit=false
export npm_config_fund=false
export npm_config_update_notifier=false
export NEXT_TELEMETRY_DISABLED=1

# ============================================
# FUNÇÕES DE UTILIDADE
# ============================================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# ============================================
# VERIFICAÇÃO DE PRIVILÉGIOS
# ============================================
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script precisa ser executado como root (sudo)"
    fi
}

# ============================================
# VERIFICAÇÃO DO SISTEMA
# ============================================
check_system() {
    log "Verificando sistema operacional..."
    
    if ! command -v apt-get &> /dev/null; then
        error "Este script suporta apenas sistemas Debian/Ubuntu com apt"
    fi
    
    # Verificar versão do Ubuntu/Debian
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        log "Sistema detectado: $NAME $VERSION_ID"
        
        case "$ID" in
            ubuntu|debian)
                ;;
            *)
                warning "Sistema não oficialmente suportado. Continuando mesmo assim..."
                ;;
        esac
    fi
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log "Instalando dependências do sistema..."
    
    apt-get update -qq
    
    # Dependências essenciais
    local deps=(
        "curl"
        "git"
        "nodejs"
        "npm"
        "postgresql"
        "postgresql-client"
        "nginx"
        "ufw"
        "certbot"
        "python3-certbot-nginx"
        "ffmpeg"
        "libheif-examples"
    )
    
    for dep in "${deps[@]}"; do
        if ! dpkg -l | grep -q "^ii  $dep "; then
            log "Instalando: $dep"
            apt-get install -y -qq "$dep" || warning "Falha ao instalar $dep"
        fi
    done
    
    # Verificar Node.js versão
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$node_version" -lt 18 ]]; then
        log "Atualizando Node.js para versão 18+..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    success "Dependências instaladas"
}

# ============================================
# CONFIGURAÇÃO DO POSTGRESQL
# ============================================
setup_postgresql() {
    log "Configurando PostgreSQL..."
    
    # Iniciar serviço
    systemctl start postgresql
    systemctl enable postgresql
    
    # Verificar se banco já existe
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw socialbluepro; then
        warning "Banco de dados 'socialbluepro' já existe"
    else
        log "Criando banco de dados..."
        sudo -u postgres psql -c "CREATE DATABASE socialbluepro;"
        sudo -u postgres psql -c "CREATE USER sbp_user WITH PASSWORD 'sbp_password_$(openssl rand -hex 8)';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;"
        success "Banco de dados criado"
    fi
}

# ============================================
# DETECÇÃO DE INSTALAÇÃO EXISTENTE
# ============================================
detect_installation() {
    if [[ -d "$INSTALL_DIR" ]] && [[ -f "$INSTALL_DIR/package.json" ]]; then
        return 0  # Instalação existe
    else
        return 1  # Nova instalação
    fi
}

# ============================================
# BACKUP DA INSTALAÇÃO EXISTENTE
# ============================================
backup_existing() {
    log "Criando backup da instalação existente..."
    
    mkdir -p "$BACKUP_DIR"
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Backup do banco de dados
    sudo -u postgres pg_dump socialbluepro > "$backup_path.sql" 2>/dev/null || warning "Falha no backup do banco"
    
    # Backup dos arquivos (exceto node_modules e .next)
    mkdir -p "$backup_path"
    rsync -av --exclude='node_modules' --exclude='.next' --exclude='*.log' "$INSTALL_DIR/" "$backup_path/" 2>/dev/null || \
        cp -r "$INSTALL_DIR" "$backup_path" 2>/dev/null || warning "Falha no backup de arquivos"
    
    # Backup do .env
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        cp "$INSTALL_DIR/.env" "$backup_path.env"
    fi
    
    success "Backup criado em: $backup_path"
    echo "$backup_path" > /tmp/socialbluepro-last-backup
}

# ============================================
# INSTALAÇÃO NOVA
# ============================================
install_new() {
    log "Iniciando instalação nova do SocialBluePro..."
    
    # Criar diretório
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clone do repositório
    log "Clonando repositório..."
    git clone --depth 1 "$REPO_URL" .
    
    # Configurar variáveis de ambiente
    setup_environment
    
    # Instalar apenas dependências de produção
    log "Instalando dependências npm (produção)..."
    export NODE_ENV=production
    npm install --omit=dev
    
    # Configurar Prisma
    log "Configurando Prisma ORM..."
    npx prisma generate
    npx prisma migrate deploy
    
    # Build
    log "Compilando aplicação..."
    
    # Configurar ambiente para o build
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    npm run build
    
    # Criar diretório de uploads
    mkdir -p public/uploads
    chown -R www-data:www-data public/uploads
    chmod 755 public/uploads
    
    success "Instalação concluída!"
}

# ============================================
# ATUALIZAÇÃO
# ============================================
update_existing() {
    log "Atualizando instalação existente..."
    
    cd "$INSTALL_DIR"
    
    # Backup
    backup_existing
    
    # Parar serviço
    log "Parando serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Salvar .env atual
    if [[ -f ".env" ]]; then
        cp .env /tmp/socialbluepro-env-backup
    fi
    
    # Atualizar código
    log "Atualizando código fonte..."
    git fetch origin
    git reset --hard origin/main
    
    # Restaurar .env
    if [[ -f /tmp/socialbluepro-env-backup ]]; then
        cp /tmp/socialbluepro-env-backup .env
    fi
    
    # Atualizar apenas dependências de produção
    log "Atualizando dependências (produção)..."
    export NODE_ENV=production
    npm install --omit=dev
    
    # Atualizar banco de dados
    log "Atualizando banco de dados..."
    npx prisma migrate deploy
    
    # Rebuild
    log "Recompilando aplicação..."
    
    # Configurar ambiente para o build
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    export NEXT_DISABLE_AUTOINSTALL=1
    
    npm run build
    
    # Reiniciar serviço
    log "Reiniciando serviço..."
    systemctl start "$SERVICE_NAME"
    
    success "Atualização concluída!"
}

# ============================================
# CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    if [[ ! -f ".env" ]]; then
        # Gerar chaves aleatórias
        local nextauth_secret=$(openssl rand -base64 32)
        local db_password=$(openssl rand -hex 16)
        
        cat > .env << EOF
# Banco de Dados
DATABASE_URL="postgresql://sbp_user:$db_password@localhost:5432/socialbluepro"

# Autenticação
NEXTAUTH_SECRET="$nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Ambiente
NODE_ENV=production
PORT=3000

# Uploads
UPLOAD_DIR="/opt/socialbluepro/public/uploads"
UPLOAD_TMP_DIR="/opt/socialbluepro/var/uploads-tmp"
MEDIA_QUEUE_DIR="/opt/socialbluepro/var/media-queue"
MAX_FILE_SIZE=1073741824
MAX_VIDEO_UPLOAD_BYTES=1073741824
MAX_VIDEO_DURATION_SECONDS=360
VIDEO_OUTPUT_MAX_HEIGHT=720
VIDEO_OUTPUT_FPS=30
FFMPEG_THREADS=2
FFMPEG_PRESET=veryfast
FFMPEG_CRF=23
FFMPEG_MAXRATE=3.5M
FFMPEG_BUFSIZE=7M
JOB_TIMEOUT_MS=1200000
MAX_RETRIES=1
LOOP_INTERVAL_MS=2000

# Email (configurar depois via interface admin)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# reCAPTCHA (opcional)
# RECAPTCHA_SITE_KEY=
# RECAPTCHA_SECRET_KEY=
EOF
        
        success "Arquivo .env criado"
        warning "Edite o arquivo .env e configure seu domínio e email SMTP"
    fi
}

# ============================================
# CONFIGURAÇÃO DO SYSTEMD
# ============================================
setup_systemd() {
    log "Configurando serviço systemd..."
    
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" << 'EOF'
[Unit]
Description=SocialBluePro - Lead Management System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/socialbluepro
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/socialbluepro.log
StandardError=append:/var/log/socialbluepro-error.log

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    
    # Configurar serviço do worker de mídia (v2.4.0+)
    cat > "/etc/systemd/system/${SERVICE_NAME}-media-worker.service" << 'EOF'
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

    systemctl enable "${SERVICE_NAME}-media-worker"
    
    success "Serviços systemd configurados"
}

# ============================================
# CONFIGURAÇÃO DO NGINX
# ============================================
setup_nginx() {
    log "Configurando Nginx..."
    
    # Remover default
    rm -f /etc/nginx/sites-enabled/default
    
    cat > "/etc/nginx/sites-available/${SERVICE_NAME}" << 'EOF'
server {
    listen 80;
    server_name _;  # Aceita qualquer host
    
    client_max_body_size 1G;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        alias /opt/socialbluepro/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    ln -sf "/etc/nginx/sites-available/${SERVICE_NAME}" "/etc/nginx/sites-enabled/"
    nginx -t && systemctl restart nginx
    
    success "Nginx configurado"
}

# ============================================
# CONFIGURAÇÃO DO FIREWALL
# ============================================
setup_firewall() {
    log "Configurando firewall..."
    
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    
    # Habilitar se não estiver ativo
    if ! ufw status | grep -q "Status: active"; then
        echo "y" | ufw enable
    fi
    
    success "Firewall configurado"
}

# ============================================
# MENSAGEM FINAL
# ============================================
show_completion() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}SocialBluePro Instalado com Sucesso!${NC}"
    echo "=========================================="
    echo ""
    echo "📁 Diretório: $INSTALL_DIR"
    echo "🌐 Acesse: http://$(hostname -I | awk '{print $1}')"
    echo "📝 Logs: tail -f /var/log/socialbluepro.log"
    echo ""
    echo "Comandos úteis:"
    echo "  sudo systemctl start $SERVICE_NAME    # Iniciar"
    echo "  sudo systemctl stop $SERVICE_NAME     # Parar"
    echo "  sudo systemctl status $SERVICE_NAME   # Status"
    echo "  sudo systemctl restart $SERVICE_NAME  # Reiniciar"
    echo ""
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo "1. Configure o domínio no .env: sudo nano $INSTALL_DIR/.env"
    echo "2. Configure SSL: sudo certbot --nginx -d seu-dominio.com"
    echo "3. Acesse a interface admin e configure o SMTP"
    echo "4. Crie um usuário admin via interface"
    echo ""
    if detect_installation; then
        echo -e "${GREEN}✓ Esta foi uma atualização. Backup salvo em:${NC}"
        cat /tmp/socialbluepro-last-backup 2>/dev/null || echo "   $BACKUP_DIR/"
    fi
    echo ""
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================
main() {
    echo "=========================================="
    echo -e "${BLUE}SocialBluePro - Deploy Automatizado${NC}"
    echo "=========================================="
    echo ""
    
    # Verificações iniciais
    check_root
    check_system
    
    # Instalar dependências do sistema
    install_dependencies
    
    # Configurar PostgreSQL
    setup_postgresql
    
    # Detectar tipo de operação
    if detect_installation; then
        echo -e "${YELLOW}⚠  Instalação existente detectada em $INSTALL_DIR${NC}"
        echo -e "${YELLOW}   Será realizada uma ATUALIZAÇÃO${NC}"
        echo ""
        read -p "Continuar com a atualização? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log "Operação cancelada pelo usuário"
            exit 0
        fi
        update_existing
    else
        echo -e "${GREEN}✓ Nova instalação detectada${NC}"
        echo ""
        install_new
        setup_systemd
        setup_nginx
        setup_firewall
    fi
    
    # Iniciar serviço
    log "Iniciando serviço..."
    systemctl start "$SERVICE_NAME"
    sleep 3
    
    # Verificar status
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        success "Serviço está rodando!"
    else
        error "Falha ao iniciar serviço. Verifique os logs: journalctl -u $SERVICE_NAME"
    fi
    
    # Mensagem final
    show_completion
}

# Executar
main "$@"
