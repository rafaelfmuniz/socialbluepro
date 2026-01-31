#!/bin/bash
#
# SocialBluePro - Instalador
# Sistema de Gestão de Leads
#
# Uso: curl -fsSL https://github.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
#

set -euo pipefail

# ============================================
# CONFIGURAÇÕES
# ============================================
readonly SCRIPT_VERSION="2.0.1"
readonly INSTALL_DIR="/opt/socialbluepro"
readonly SERVICE_NAME="socialbluepro"
readonly REPO_URL="https://github.com/rafaelfmuniz/socialbluepro.git"
readonly REPO_BRANCH="main"
readonly TEMP_DIR="/tmp/socialbluepro-install"
readonly LOG_FILE="/var/log/socialbluepro-install.log"
readonly CREDENTIALS_FILE="/root/.socialbluepro-credentials"

# ============================================
# VARIÁVEIS GLOBAIS
# ============================================
DB_PASSWORD=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
BACKUP_DIR=""
ROLLBACK_POINT=""

# ============================================
# CORES (PROFISSIONAIS - UMA ÚNICA COR PRINCIPAL)
# ============================================
setup_colors() {
    if [[ -t 2 ]] && [[ -z "${NO_COLOR:-}" ]] && [[ "${TERM:-}" != "dumb" ]]; then
        NC='\033[0m'
        DIM='\033[2m'
        BOLD='\033[1m'
        YELLOW='\033[0;33m'
        GREEN='\033[0;32m'
        RED='\033[0;31m'
    else
        NC='' DIM='' BOLD='' YELLOW='' GREEN='' RED=''
    fi
}

setup_colors

# ============================================
# DETECÇÃO DE VERSÃO
# ============================================
get_latest_version() {
    local api_url="https://api.github.com/repos/rafaelfmuniz/socialbluepro/releases/latest"
    local version=""
    
    # Fetch the latest release from GitHub API with timeout
    local response
    response=$(curl -s --max-time 5 "$api_url" 2>/dev/null) || {
        log_warning "Falha ao buscar versão mais recente (timeout ou erro de conexão)"
        echo "$SCRIPT_VERSION"
        return
    }
    
    # Check if response is valid JSON
    if [[ -z "$response" ]] || [[ "$response" == "null" ]]; then
        log_warning "Resposta vazia da API do GitHub"
        echo "$SCRIPT_VERSION"
        return
    fi
    
    # Extract tag_name from JSON response
    version=$(echo "$response" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4) || true
    
    # If version not found or empty, fallback to SCRIPT_VERSION
    if [[ -z "$version" ]]; then
        log_warning "Não foi possível extrair versão da resposta da API"
        echo "$SCRIPT_VERSION"
        return
    fi
    
    # Ensure "v" prefix is present
    if [[ ! "$version" =~ ^v ]]; then
        version="v$version"
    fi
    
    # Validate version format (should be semver-like: vx.y.z)
    if [[ ! "$version" =~ ^v[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
        log_warning "Formato de versão inválido: $version"
        echo "v$SCRIPT_VERSION"
        return
    fi
    
    echo "$version"
}

# ============================================
# FUNÇÕES DE LOG
# ============================================
log_info() {
    echo -e "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "[OK] $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "[!] $1" | tee -a "$LOG_FILE" >&2
}

log_error() {
    echo -e "[ERROR] $1" | tee -a "$LOG_FILE" >&2
}

# ============================================
# TRATAMENTO DE ERROS
# ============================================
error_handler() {
    local line_no=$1
    local bash_lineno=$2
    local exit_code=$3
    
    echo ""
    echo "========================================"
    echo "ERRO FATAL DURANTE A INSTALAÇÃO"
    echo "========================================"
    echo ""
    echo "Linha:   $line_no"
    echo "Comando: ${BASH_COMMAND}"
    echo "Exit:    $exit_code"
    echo ""
    echo "Soluções:"
    echo "  1. Verifique o log: $LOG_FILE"
    echo "  2. Execute novamente com debug:"
    echo "     curl -fsSL $REPO_URL/raw/main/install.sh | sudo bash -s -- --debug"
    echo ""
    
    if [[ -n "$ROLLBACK_POINT" ]]; then
        echo "Tentando rollback..."
        perform_rollback "$ROLLBACK_POINT" 2>/dev/null || true
    fi
    
    exit $exit_code
}

trap 'error_handler ${LINENO} ${BASH_LINENO} $?' ERR

# ============================================
# FUNÇÃO DE LEITURA DE TTY
# ============================================
read_tty() {
    local prompt="$1"
    local response
    
    if [[ -t 0 ]]; then
        read -rp "$prompt" response
    else
        read -rp "$prompt" response < /dev/tty
    fi
    
    echo "$response"
}

# ============================================
# VERIFICAÇÃO DE INSTALAÇÃO EXISTENTE
# ============================================
check_existing_installation() {
    local has_install=0
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        ((has_install++))
    fi
    
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        ((has_install++))
    fi
    
    if [[ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]]; then
        ((has_install++))
    fi
    
    if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw socialbluepro; then
        ((has_install++))
    fi
    
    if [[ $has_install -gt 0 ]]; then
        return 0
    else
        return 1
    fi
}

get_installed_version() {
    if [[ -f "$INSTALL_DIR/package.json" ]]; then
        # Try using node to read package.json (most reliable)
        if command -v node &>/dev/null; then
            local version
            version=$(node -e "console.log(require('$INSTALL_DIR/package.json').version)" 2>/dev/null)
            if [[ -n "$version" && "$version" != "undefined" ]]; then
                echo "v$version"
                return
            fi
        fi
        
        # Fallback to grep
        local version
        version=$(grep '"version"' "$INSTALL_DIR/package.json" 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
        if [[ -n "$version" ]]; then
            echo "v$version"
        else
            echo "unknown"
        fi
    else
        echo "unknown"
    fi
}

# ============================================
# VALIDAÇÃO DO SISTEMA
# ============================================
validate_system() {
    log_info "Validando requisitos do sistema..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "Execute como root: sudo bash install.sh"
        exit 1
    fi
    
    if [[ ! -f /etc/os-release ]]; then
        log_error "Não foi possível identificar o sistema"
        exit 1
    fi
    
    source /etc/os-release
    log_info "Sistema: $PRETTY_NAME"
    
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        log_warning "Sistema não oficialmente suportado: $ID"
        local confirm
        confirm=$(read_tty "Deseja continuar? (s/N): ")
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Instalação cancelada"
            exit 0
        fi
    fi
    
    local total_mem_mb
    total_mem_mb=$(free -m | awk '/^Mem:/{print $2}')
    log_info "RAM: ${total_mem_mb}MB"
    
    if [[ $total_mem_mb -lt 2048 ]]; then
        log_warning "RAM abaixo do recomendado (2GB)"
        local confirm
        confirm=$(read_tty "Deseja continuar? (s/N): ")
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Instalação cancelada"
            exit 0
        fi
    fi
    
    local free_disk_gb
    free_disk_gb=$(df -BG /opt 2>/dev/null | awk 'NR==2{print $4}' | sed 's/G//')
    log_info "Disco: ${free_disk_gb}GB livres"
    
    if [[ $free_disk_gb -lt 5 ]]; then
        log_error "Espaço insuficiente (mínimo: 5GB)"
        exit 1
    fi
    
    check_port 3000 "Aplicação"
    check_port 5432 "PostgreSQL"
    
    if ! ping -c 1 -W 2 github.com &>/dev/null; then
        log_error "Sem conexão com GitHub"
        exit 1
    fi
    
    log_success "Sistema validado"
}

check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_warning "Porta $port em uso pelo processo $pid ($service)"
        local confirm
        confirm=$(read_tty "Matar processo e continuar? (s/N): ")
        if [[ "$confirm" =~ ^[Ss]$ ]]; then
            kill -9 $pid 2>/dev/null || true
        else
            log_info "Instalação cancelada"
            exit 0
        fi
    fi
}

# ============================================
# BACKUP E ROLLBACK
# ============================================
create_backup() {
    local backup_type=$1
    BACKUP_DIR="/tmp/socialbluepro-backup-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Criando backup ($backup_type)..."
    mkdir -p "$BACKUP_DIR"
    
    if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw socialbluepro; then
        sudo -u postgres pg_dump socialbluepro > "$BACKUP_DIR/database.sql" 2>/dev/null || true
    fi
    
    if [[ -d "$INSTALL_DIR" ]]; then
        cp -r "$INSTALL_DIR" "$BACKUP_DIR/installation" 2>/dev/null || true
    fi
    
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        cp "$INSTALL_DIR/.env" "$BACKUP_DIR/.env" 2>/dev/null || true
    fi
    
    log_success "Backup criado"
}

perform_rollback() {
    local backup_dir=$1
    
    log_warning "Rollback de $backup_dir..."
    
    if [[ -f "$backup_dir/database.sql" ]]; then
        sudo -u postgres psql socialbluepro < "$backup_dir/database.sql" 2>/dev/null || true
    fi
    
    if [[ -d "$backup_dir/installation" ]]; then
        rm -rf "$INSTALL_DIR"
        cp -r "$backup_dir/installation" "$INSTALL_DIR" 2>/dev/null || true
    fi
    
    if [[ -f "$backup_dir/.env" ]]; then
        cp "$backup_dir/.env" "$INSTALL_DIR/.env" 2>/dev/null || true
    fi
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log_info "Instalando dependências do sistema..."
    
    apt-get update -qq || {
        log_error "Falha ao atualizar repositórios"
        exit 1
    }
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
        log_error "Falha ao configurar Node.js"
        exit 1
    }
    
    apt-get install -y nodejs postgresql postgresql-client git curl openssl build-essential python3 -qq || {
        log_error "Falha ao instalar pacotes"
        exit 1
    }
    
    log_success "Node.js: $(node --version)"
    log_success "PostgreSQL: $(psql --version | awk '{print $3}')"
}

# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================
setup_database() {
    log_info "Configurando banco de dados..."
    
    systemctl start postgresql
    systemctl enable postgresql
    
    local max_attempts=30
    local attempt=0
    while ! sudo -u postgres psql -c "SELECT 1" &>/dev/null; do
        ((attempt++))
        if [[ $attempt -ge $max_attempts ]]; then
            log_error "PostgreSQL não iniciou"
            exit 1
        fi
        sleep 1
    done
    
    DB_PASSWORD=$(openssl rand -hex 24)
    
    mkdir -p "$TEMP_DIR"
    chmod 700 "$TEMP_DIR"
    
    echo "$DB_PASSWORD" > "$TEMP_DIR/db_password"
    chmod 600 "$TEMP_DIR/db_password"
    
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
CREATE DATABASE socialbluepro;
CREATE USER sbp_user WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;
\c socialbluepro
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT ALL ON SCHEMA public TO sbp_user;
EOF
    
    log_success "Banco de dados configurado"
}

# ============================================
# DOWNLOAD DA APLICAÇÃO
# ============================================
download_application() {
    log_info "Baixando aplicação..."
    
    mkdir -p "$INSTALL_DIR"
    
    git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR" || {
        log_error "Falha ao clonar repositório"
        exit 1
    }
    
    cd "$INSTALL_DIR" || exit 1
    
    if [[ ! -f "$TEMP_DIR/db_password" ]]; then
        log_error "Senha do banco não encontrada"
        exit 1
    fi
    
    DB_PASSWORD=$(cat "$TEMP_DIR/db_password")
    
    cat > "$INSTALL_DIR/.env" <<EOF
DATABASE_URL="postgresql://sbp_user:${DB_PASSWORD}@localhost:5432/socialbluepro"
DIRECT_URL="postgresql://sbp_user:${DB_PASSWORD}@localhost:5432/socialbluepro"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3000
ENCRYPTION_KEY="$(openssl rand -hex 32)"
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=1073741824
EOF
    
    chmod 600 "$INSTALL_DIR/.env"
    
    log_success "Aplicação baixada"
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS NPM
# ============================================
install_npm_dependencies() {
    log_info "Instalando dependências npm..."
    
    cd "$INSTALL_DIR" || exit 1
    
    # Debug: verificar se .env existe
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        log_success "Arquivo .env encontrado"
        log_info "DATABASE_URL configurada"
    else
        log_warning "Arquivo .env não encontrado"
    fi
    
    # Limpar caches AGRESSIVAMENTE
    log_info "Limpando caches AGRESSIVAMENTE..."
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf .next/cache 2>/dev/null || true
    rm -rf .next 2>/dev/null || true
    rm -rf ~/.npm/_cacache 2>/dev/null || true
    rm -rf ~/.npm/.npmrc 2>/dev/null || true
    rm -rf /tmp/npm-* 2>/dev/null || true
    npm cache clean --force || true
    
    # Criar .npmrc para forçar versões corretas
    log_info "Configurando npm..."
    cat > "$INSTALL_DIR/.npmrc" <<'EOF'
cache=/tmp/npm-cache
prefer-offline=false
legacy-peer-deps=false
strict-peer-deps=false
loglevel=warn
fetch-retries=3
fetch-retry-factor=2
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
save-exact=false
EOF
    
    # Remover package-lock.json e node_modules completamente
    log_info "Removendo dependências antigas..."
    rm -f package-lock.json 2>/dev/null || true
    rm -rf node_modules 2>/dev/null || true
    
    # Instalar com --force para garantir versões corretas
    log_info "Instalando pacotes..."
    npm install --force --legacy-peer-deps --no-audit --no-fund || {
        log_error "Falha no npm install"
        exit 1
    }
    
    # Verificar se Prisma Client foi gerado
    if [[ -d node_modules/@prisma/client ]]; then
        log_success "Prisma Client gerado"
    else
        log_warning "Prisma Client não encontrado em node_modules/@prisma/client"
    fi
    
    # Executar prisma generate com caminho completo
    log_info "Gerando Prisma Client..."
    npx prisma generate --schema=./prisma/schema.prisma || {
        log_error "Falha ao gerar Prisma Client"
        log_error "Verifique se o arquivo prisma/schema.prisma existe"
        exit 1
    }
    
    # Criar/atualizar tabelas do banco usando db push
    # db push é mais confiável que migrate deploy para instalações frescas
    log_info "Criando tabelas do banco de dados..."
    npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss || {
        log_error "Falha ao criar tabelas do banco"
        log_error "Verifique se o DATABASE_URL está correto em .env"
        exit 1
    }
    
    # Remover .npmrc após instalação
    rm -f "$INSTALL_DIR/.npmrc"
    
    log_success "Dependências instaladas"
    
    # Dar tempo para o Node.js e caches se estabilizarem
    log_info "Aguardando estabilização do Node.js..."
    sleep 3
}

# ============================================
# CRIAÇÃO DE USUÁRIO ADMIN
# ============================================
create_admin_user() {
    log_info "Criando usuário administrador padrão..."
    
    # Credenciais padrão - usuário DEVE mudar após primeiro login
    ADMIN_EMAIL="admin@local.system"
    ADMIN_PASSWORD="admin123"
    
    sudo -u postgres psql socialbluepro <<EOF 2>/dev/null || true
DELETE FROM admin_users WHERE email = '${ADMIN_EMAIL}';
INSERT INTO admin_users (id, name, email, password_hash, role, is_active, failed_attempts, is_default_password, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Administrator',
    '${ADMIN_EMAIL}',
    crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    'admin',
    true,
    0,
    true,
    NOW(),
    NOW()
);
EOF
    
    log_success "Usuário administrador criado"
}

# ============================================
# BUILD E SERVIÇO
# ============================================
build_and_start_service() {
    log_info "Compilando aplicação..."
    
    cd "$INSTALL_DIR" || exit 1
    
    # Configurar ambiente para o build
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    export TURBOWATCHPACK_NOTIFY=0
    
    npm run build || {
        log_error "Falha no build"
        exit 1
    }
    
    # Copiar arquivos estáticos para o standalone output
    log_info "Copiando arquivos estáticos para standalone..."
    if [[ -d "$INSTALL_DIR/.next/standalone" ]]; then
        # Copiar pasta public (imagens, etc)
        cp -r "$INSTALL_DIR/public" "$INSTALL_DIR/.next/standalone/" 2>/dev/null || true
        # Copiar .next/static (CSS, JS compilados)
        cp -r "$INSTALL_DIR/.next/static" "$INSTALL_DIR/.next/standalone/.next/" 2>/dev/null || true
        log_success "Arquivos estáticos copiados"
    fi
    
    mkdir -p "$INSTALL_DIR/public/uploads"
    chown -R root:root "$INSTALL_DIR/public/uploads"
    
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<'EOF'
[Unit]
Description=SocialBluePro - Sistema de Gestão de Leads
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/socialbluepro
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node /opt/socialbluepro/.next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME" || {
        log_error "Falha ao iniciar serviço"
        exit 1
    }
    
    log_success "Serviço iniciado"
}

# ============================================
# VERIFICAÇÃO DE SAÚDE
# ============================================
health_check() {
    log_info "Verificando aplicação..."
    
    # Verificar se o serviço está rodando
    if ! systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_warning "Serviço não está rodando"
        log_warning "Verifique: sudo systemctl status $SERVICE_NAME"
        log_warning "Verifique os logs: sudo journalctl -u $SERVICE_NAME -n 50"
        return 0
    fi
    
    log_success "Serviço está rodando"
    
    # Verificar se a aplicação está respondendo (tentativa única, sem loop)
    if command -v node &>/dev/null; then
        log_info "Verificando resposta HTTP..."
        
        if node -e "
            const http = require('http');
            http.get('http://localhost:3000', (res) => {
                console.log('OK');
                process.exit(0);
            }).on('error', () => {
                console.log('ERROR');
                process.exit(1);
            }).setTimeout(3000);
        " 2>/dev/null | grep -q "OK"; then
            log_success "Aplicação funcionando e respondendo"
        else
            log_warning "Aplicação pode não estar respondendo"
            log_warning "Verifique os logs: sudo journalctl -u $SERVICE_NAME -n 50"
        fi
    else
        log_warning "Node.js não encontrado"
        log_success "Serviço está rodando"
    fi
    
    return 0
}

# ============================================
# SALVAR CREDENCIAIS
# ============================================
save_credentials() {
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    cat > "$CREDENTIALS_FILE" <<EOF
========================================
SocialBluePro - Credenciais de Acesso
Versão: ${SCRIPT_VERSION}
Gerado: $(date)
========================================

ADMIN:
  Email:    ${ADMIN_EMAIL}
  Senha:    ${ADMIN_PASSWORD}

BANCO DE DADOS:
  Usuário:  sbp_user
  Senha:    ${DB_PASSWORD}

ACESSO:
  Local:    http://localhost:3000
  Rede:     http://${ip_address}:3000

⚠️  IMPORTANTE - AÇÕES OBRIGATÓRIAS APÓS PRIMEIRO LOGIN:

1. MUDE EMAIL E SENHA DO ADMIN:
   • Vá em: Admin > Settings > Users
   • Email atual: ${ADMIN_EMAIL}
   • Senha atual: ${ADMIN_PASSWORD}

2. CONFIGURE O SMTP (ESSENCIAL):
   • Vá em: Admin > Settings > Email
   • Sem SMTP você NÃO poderá:
     - Receber emails de recuperação de senha
     - Enviar campanhas de marketing
     - Notificar leads automaticamente

SEGURANÇA:
- Este arquivo está em: ${CREDENTIALS_FILE}
- Delete este arquivo após anotar as credenciais
- Use senhas fortes e únicas

COMANDOS:
  sudo systemctl start ${SERVICE_NAME}
  sudo systemctl stop ${SERVICE_NAME}
  sudo systemctl restart ${SERVICE_NAME}
  sudo systemctl status ${SERVICE_NAME}
  sudo journalctl -u ${SERVICE_NAME} -f

LOG:
  ${LOG_FILE}
========================================
EOF
    
    chmod 600 "$CREDENTIALS_FILE"
    log_success "Credenciais salvas"
}

# ============================================
# LIMPEZA
# ============================================
cleanup() {
    log_info "Limpando arquivos temporários..."
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    log_success "Limpeza concluída"
}

# ============================================
# MENSAGEM DE SUCESSO
# ============================================
show_success() {
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    local latest_version
    latest_version=$(get_latest_version)
    
    echo ""
    echo "========================================"
    echo "SocialBluePro instalado com sucesso!"
    echo "========================================"
    echo ""
    echo "Versão:   ${latest_version}"
    echo "Data:      $(date '+%d/%m/%Y %H:%M')"
    echo ""
    echo "Credenciais padrão:"
    echo "  Email:   ${ADMIN_EMAIL}"
    echo "  Senha:   ${ADMIN_PASSWORD}"
    echo ""
    echo -e "${RED}⚠️  AVISO IMPORTANTE - AÇÕES NECESSÁRIAS APÓS LOGIN:${NC}"
    echo ""
    echo -e "${RED}1. MUDE O EMAIL E SENHA DO ADMINISTRADOR IMEDIATAMENTE${NC}"
    echo "   Vá em: Admin > Settings > Users"
    echo ""
    echo -e "${RED}2. CONFIGURE O SMTP PARA RECEBER EMAILS${NC}"
    echo "   Vá em: Admin > Settings > Email"
    echo "   ⚠️  Sem SMTP configurado, você NÃO poderá:"
    echo "      • Receber emails de recuperação de senha"
    echo "      • Enviar campanhas de email marketing"
    echo "      • Notificar leads automaticamente"
    echo ""
    echo "Acesse:"
    echo "  Local:   http://localhost:3000"
    echo "  Rede:    http://${ip_address}:3000"
    echo ""
    echo "Credenciais salvas em: ${CREDENTIALS_FILE}"
    echo "Log de instalação: ${LOG_FILE}"
    echo ""
}

# ============================================
# INSTALAÇÃO COMPLETA
# ============================================
install_new() {
    log_info "Iniciando instalação limpa..."
    
    validate_system
    create_backup "pre-install"
    ROLLBACK_POINT="$BACKUP_DIR"
    
    install_dependencies
    setup_database
    download_application
    install_npm_dependencies
    create_admin_user
    build_and_start_service
    
    # Dar tempo ao serviço iniciar completamente
    log_info "Aguardando serviço estabilizar..."
    sleep 5
    
    health_check
    save_credentials
    cleanup
    
    log_info "Instalação concluída com sucesso!"
    echo ""
    show_success
}

# ============================================
# REINSTALAÇÃO
# ============================================
reinstall() {
    log_warning "Iniciando reinstalação..."
    
    echo ""
    echo "========================================"
    echo "ATENÇÃO: Isso removerá TODOS os dados!"
    echo "========================================"
    echo ""
    
    local confirm
    confirm=$(read_tty "Digite 'SIM' para confirmar: ")
    
    if [[ "$confirm" != "SIM" ]]; then
        log_info "Reinstalação cancelada"
        exit 0
    fi
    
    create_backup "pre-reinstall"
    
    log_info "Parando serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload 2>/dev/null || true
    
    log_info "Removendo banco de dados..."
    sudo -u postgres psql <<EOF 2>/dev/null || true
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
EOF
    
    log_info "Removendo arquivos..."
    rm -rf "$INSTALL_DIR"
    rm -rf "$TEMP_DIR"
    npm cache clean --force 2>/dev/null || true
    
    log_success "Limpeza concluída"
    echo ""
    
    install_new
}

# ============================================
# ATUALIZAÇÃO
# ============================================
update() {
    log_info "Iniciando atualização..."
    
    if [[ ! -d "$INSTALL_DIR" ]]; then
        log_error "Instalação não encontrada"
        exit 1
    fi
    
    create_backup "pre-update"
    ROLLBACK_POINT="$BACKUP_DIR"
    
    cd "$INSTALL_DIR" || exit 1
    
    log_info "Parando serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    log_info "Salvando configurações..."
    cp .env /tmp/sbp-env-backup 2>/dev/null || true
    
    log_info "Atualizando código..."
    git fetch origin || {
        log_error "Falha ao buscar atualizações"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    git reset --hard "origin/${REPO_BRANCH}" || {
        log_error "Falha ao atualizar código"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    log_info "Restaurando configurações..."
    cp /tmp/sbp-env-backup .env 2>/dev/null || true
    
    log_info "Atualizando dependências..."
    
    # Criar .npmrc para forçar versões corretas
    cat > "$INSTALL_DIR/.npmrc" <<'EOF'
cache=/tmp/npm-cache
prefer-offline=false
legacy-peer-deps=true
loglevel=warn
fetch-timeout=60000
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
EOF
    
    # Limpar cache do npm para evitar versões antigas
    log_info "Limpando cache do npm..."
    npm cache clean --force || true
    
    # Instalar com --force para garantir versões corretas
    npm install --force || {
        log_error "Falha ao atualizar dependências"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    # Remover .npmrc após instalação
    rm -f "$INSTALL_DIR/.npmrc"
    
    log_info "Atualizando schema do banco de dados..."
    npx prisma db push --accept-data-loss || {
        log_error "Falha ao atualizar banco de dados"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    # Limpar cache do Next.js para garantir build limpo
    log_info "Limpando cache do Next.js..."
    rm -rf "$INSTALL_DIR/.next/cache" 2>/dev/null || true
    rm -rf "$INSTALL_DIR/.next/standalone" 2>/dev/null || true
    
    log_info "Recompilando..."
    npm run build || {
        log_error "Falha no build"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    # Copiar arquivos estáticos para o standalone output
    log_info "Copiando arquivos estáticos para standalone..."
    if [[ -d "$INSTALL_DIR/.next/standalone" ]]; then
        cp -r "$INSTALL_DIR/public" "$INSTALL_DIR/.next/standalone/" 2>/dev/null || true
        cp -r "$INSTALL_DIR/.next/static" "$INSTALL_DIR/.next/standalone/.next/" 2>/dev/null || true
        log_success "Arquivos estáticos copiados"
    fi
    
    # Reiniciar serviço para garantir que usa os novos arquivos
    log_info "Reiniciando serviço..."
    systemctl restart "$SERVICE_NAME" || {
        log_error "Falha ao reiniciar serviço"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    health_check
    cleanup
    
    log_success "Atualização concluída!"
    echo ""
    echo "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
}

# ============================================
# DESINSTALAÇÃO
# ============================================
uninstall() {
    echo ""
    echo "========================================"
    echo "DESINSTALAÇÃO DO SOCIALBLUEPRO"
    echo "========================================"
    echo ""
    echo "Isso removerá:"
    echo "  - Banco de dados (todos os dados)"
    echo "  - Arquivos da aplicação"
    echo "  - Usuário do PostgreSQL"
    echo "  - Serviço systemd"
    echo ""
    
    local confirm
    confirm=$(read_tty "Deseja continuar? (Digite 'SIM'): ")
    
    if [[ "$confirm" != "SIM" ]]; then
        log_info "Desinstalação cancelada"
        exit 0
    fi
    
    local remove_deps
    remove_deps=$(read_tty "Remover dependências do sistema (Node.js, PostgreSQL)? (s/N): ")
    
    if [[ "$remove_deps" =~ ^[Ss]$ ]]; then
        log_info "Parando serviço..."
        systemctl stop postgresql 2>/dev/null || true
        systemctl disable postgresql 2>/dev/null || true
        
        log_info "Removendo PostgreSQL e Node.js..."
        apt-get remove -y postgresql postgresql-client nodejs npm build-essential python3 -qq || true
        apt-get autoremove -y -qq || true
    fi
    
    log_info "Parando serviço SocialBluePro..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload 2>/dev/null || true
    
    log_info "Removendo banco de dados..."
    sudo -u postgres psql <<EOF 2>/dev/null || true
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
EOF
    
    log_info "Removendo arquivos..."
    rm -rf "$INSTALL_DIR"
    rm -rf "$TEMP_DIR"
    rm -f "$CREDENTIALS_FILE"
    npm cache clean --force 2>/dev/null || true
    
    cleanup
    
    echo ""
    echo "========================================"
    echo "SocialBluePro removido com sucesso!"
    echo "========================================"
    echo ""
}

# ============================================
# MENU
# ============================================
show_menu() {
    clear
    
    echo "========================================"
    echo "SocialBluePro - Instalador v${SCRIPT_VERSION}"
    echo "Sistema de Gestão de Leads"
    echo "========================================"
    echo ""
    
    if check_existing_installation; then
        local current_version
        local latest_version
        current_version=$(get_installed_version)
        latest_version=$(get_latest_version)
        echo "Instalação detectada em: $INSTALL_DIR"
        echo "Versão atual:  $current_version"
        echo "Nova versão:   $latest_version"
        echo ""
    fi
    
    echo "Selecione uma opção:"
    echo ""
    echo "  1) Instalar (instalação limpa)"
    echo "  2) Reinstalar (remove tudo e reinstala)"
    echo "  3) Atualizar (mantém dados)"
    echo "  4) Desinstalar (remove tudo)"
    echo "  5) Sair"
    echo ""
}

get_choice() {
    read_tty "Digite uma opção (1-5): "
}

# ============================================
# MAIN
# ============================================
main() {
    log_info "=========================================="
    log_info "Iniciando instalador v${SCRIPT_VERSION}"
    log_info "=========================================="
    
    show_menu
    
    case "$(get_choice)" in
        1)
            echo ""
            if check_existing_installation; then
                log_error "Instalação já existe"
                echo "Use a opção 2 (Reinstalar) para limpar e reinstalar"
                exit 1
            fi
            install_new
            ;;
        2)
            echo ""
            if ! check_existing_installation; then
                log_error "Nenhuma instalação encontrada"
                echo "Use a opção 1 (Instalar) para nova instalação"
                exit 1
            fi
            reinstall
            ;;
        3)
            echo ""
            if ! check_existing_installation; then
                log_error "Nenhuma instalação encontrada"
                echo "Use a opção 1 (Instalar) para nova instalação"
                exit 1
            fi
            update
            ;;
        4)
            echo ""
            if ! check_existing_installation; then
                log_error "Nenhuma instalação encontrada"
                exit 1
            fi
            uninstall
            ;;
        5)
            echo ""
            log_info "Instalação cancelada"
            exit 0
            ;;
        *)
            echo ""
            log_error "Opção inválida"
            exit 1
            ;;
    esac
}

main "$@"
