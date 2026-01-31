#!/bin/bash
#
# SocialBluePro - Instalador Profissional
# Uso: curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
#

set -euo pipefail

# ============================================
# CONFIGURAÇÕES GLOBAIS
# ============================================
readonly INSTALL_DIR="/opt/socialbluepro"
readonly SERVICE_NAME="socialbluepro"
readonly REPO_URL="https://github.com/rafaelfmuniz/socialbluepro.git"
readonly SCRIPT_BRANCH="main"
readonly SCRIPT_VERSION="2.0.2"
readonly TEMP_DIR="/tmp/socialbluepro-install"

# ============================================
# VARIÁVEIS GLOBAIS
# ============================================
DB_PASSWORD=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

# ============================================
# CORES
# ============================================
setup_colors() {
    if [[ -t 2 ]] && [[ -z "${NO_COLOR:-}" ]] && [[ "${TERM:-}" != "dumb" ]]; then
        RED=$(tput setaf 1)
        GREEN=$(tput setaf 2)
        YELLOW=$(tput setaf 3)
        BLUE=$(tput setaf 4)
        BOLD=$(tput bold)
        RESET=$(tput sgr0)
    else
        RED='' GREEN='' YELLOW='' BLUE='' BOLD='' RESET=''
    fi
}

setup_colors

# ============================================
# FUNÇÕES DE LOG
# ============================================
log() { echo "${BLUE}[$(date +'%H:%M:%S')]${RESET} $1"; }
success() { echo "${GREEN}[✓]${RESET} $1"; }
warn() { echo "${YELLOW}[!]${RESET} $1" >&2; }
error_exit() { echo "${RED}[✗]${RESET} $1" >&2; exit 1; }

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================
check_requirements() {
    [[ $EUID -ne 0 ]] && error_exit "Execute como root: sudo bash install.sh"
    ! command -v apt-get &>/dev/null && error_exit "Ubuntu/Debian apenas"
    
    # Criar diretório temporário
    mkdir -p "$TEMP_DIR"
    chmod 700 "$TEMP_DIR"
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_system_deps() {
    log "Atualizando repositórios..."
    apt-get update -qq || error_exit "Falha ao atualizar repositórios"
    
    log "Instalando Node.js e PostgreSQL..."
    
    # NodeSource
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - 2>/dev/null || \
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    apt-get install -y -qq nodejs postgresql postgresql-client git curl openssl
    
    success "Node.js $(node --version) instalado"
}

# ============================================
# CONFIGURAÇÃO POSTGRESQL
# ============================================
setup_database() {
    log "Configurando PostgreSQL..."
    
    systemctl start postgresql
    systemctl enable postgresql
    
    # Gerar senha segura
    DB_PASSWORD=$(openssl rand -hex 24)
    
    # Salvar senha em arquivo seguro no temp
    echo "$DB_PASSWORD" > "$TEMP_DIR/db_password"
    chmod 600 "$TEMP_DIR/db_password"
    
    # Configurar banco e usuário
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
CREATE DATABASE socialbluepro;
CREATE USER sbp_user WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;
\c socialbluepro
GRANT ALL ON SCHEMA public TO sbp_user;
EOF
    
    success "PostgreSQL configurado"
}

# ============================================
# DOWNLOAD E CONFIGURAÇÃO
# ============================================
download_and_configure() {
    log "Baixando projeto..."
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR" || error_exit "Não foi possível acessar $INSTALL_DIR"
    
    git clone --depth 1 "$REPO_URL" . || error_exit "Falha ao clonar"
    
    log "Configurando ambiente..."
    
    # Ler senha do arquivo temporário
    if [[ -f "$TEMP_DIR/db_password" ]]; then
        DB_PASSWORD=$(cat "$TEMP_DIR/db_password")
    else
        error_exit "Senha do banco não encontrada"
    fi
    
    # Criar .env
    cat > .env <<EOF
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
    
    chmod 600 .env
    success "Ambiente configurado"
}

# ============================================
# INSTALAÇÃO NPM
# ============================================
install_app() {
    log "Instalando dependências..."
    npm install --production || error_exit "Falha no npm install"
    
    log "Configurando Prisma..."
    npx prisma generate || error_exit "Falha ao gerar Prisma Client"
    npx prisma migrate deploy || error_exit "Falha na migração"
    
    success "Prisma configurado"
}

# ============================================
# CRIAR USUÁRIO ADMIN
# ============================================
create_admin_user() {
    log "Criando administrador..."
    
    ADMIN_EMAIL="admin-$(openssl rand -hex 4)@local.system"
    ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
    
    sudo -u postgres psql socialbluepro <<EOF
INSERT INTO admin_users (id, name, email, password_hash, role, is_active, failed_attempts, is_default_password)
VALUES (
    gen_random_uuid(),
    'Administrador',
    '${ADMIN_EMAIL}',
    crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    'admin',
    true,
    0,
    true
)
ON CONFLICT (email) DO NOTHING;
EOF
    
    success "Administrador criado"
}

# ============================================
# BUILD E SERVIÇO
# ============================================
build_and_service() {
    log "Compilando aplicação..."
    npm run build || error_exit "Falha no build"
    
    mkdir -p public/uploads
    chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
    
    log "Criando serviço systemd..."
    
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<'EOF'
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
    systemctl start "$SERVICE_NAME" || error_exit "Falha ao iniciar serviço"
    
    success "Serviço iniciado"
}

# ============================================
# SALVAR CREDENCIAIS
# ============================================
save_credentials() {
    local cred_file="/root/.socialbluepro-credentials"
    local ip
    ip=$(hostname -I | awk '{print $1}')
    
    cat > "$cred_file" <<EOF
========================================
SocialBluePro - Credenciais de Acesso
Gerado em: $(date)
========================================

ADMIN:
  Email:    ${ADMIN_EMAIL}
  Senha:    ${ADMIN_PASSWORD}

BANCO DE DADOS:
  Usuário:  sbp_user
  Senha:    ${DB_PASSWORD}

ACESSO:
  Local:    http://localhost:3000
  Rede:     http://${ip}:3000

IMPORTANTE:
- Altere a senha do admin após o primeiro login
- Este arquivo está em: ${cred_file}
- Apenas root pode ler este arquivo
- Delete este arquivo após anotar as credenciais

COMANDOS:
  sudo systemctl start ${SERVICE_NAME}
  sudo systemctl stop ${SERVICE_NAME}
  sudo systemctl status ${SERVICE_NAME}
========================================
EOF
    
    chmod 600 "$cred_file"
}

# ============================================
# LIMPEZA
# ============================================
cleanup() {
    rm -rf "$TEMP_DIR"
}

# ============================================
# INSTALAÇÃO COMPLETA
# ============================================
install_new() {
    log "Iniciando instalação..."
    
    install_system_deps
    setup_database
    download_and_configure
    install_app
    create_admin_user
    build_and_service
    save_credentials
    cleanup
    
    # Verificar se está rodando
    sleep 3
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        local ip
        ip=$(hostname -I | awk '{print $1}')
        
        echo ""
        echo "========================================"
        echo "${GREEN}SocialBluePro instalado com sucesso!${RESET}"
        echo "========================================"
        echo ""
        echo "${BOLD}Credenciais:${RESET}"
        echo "  Email: ${GREEN}${ADMIN_EMAIL}${RESET}"
        echo "  Senha: ${GREEN}${ADMIN_PASSWORD}${RESET}"
        echo ""
        echo "Acesse: http://${ip}:3000"
        echo ""
        echo "Credenciais salvas em: /root/.socialbluepro-credentials"
        echo "========================================"
        echo ""
    else
        error_exit "Serviço não iniciou. Verifique: sudo systemctl status $SERVICE_NAME"
    fi
}

# ============================================
# REINSTALAÇÃO
# ============================================
reinstall() {
    warn "Isso removerá TUDO permanentemente!"
    echo ""
    
    # Parar e remover serviço
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload 2>/dev/null || true
    
    # Backup (se existir)
    if [[ -d "$INSTALL_DIR" ]]; then
        sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-$(date +%Y%m%d-%H%M%S).sql" || true
    fi
    
    # Dropar banco e usuário
    sudo -u postgres psql <<EOF 2>/dev/null || true
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
EOF
    
    # Remover arquivos
    rm -rf "$INSTALL_DIR"
    rm -rf "$TEMP_DIR"
    npm cache clean --force 2>/dev/null || true
    
    success "Limpeza concluída"
    echo ""
    
    # Instalar do zero
    install_new
}

# ============================================
# ATUALIZAÇÃO
# ============================================
update() {
    log "Atualizando instalação..."
    
    cd "$INSTALL_DIR" || error_exit "Instalação não encontrada"
    
    # Backup
    sudo -u postgres pg_dump socialbluepro > "/tmp/sbp-backup-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || warn "Falha no backup"
    
    # Parar serviço
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Salvar .env
    cp .env /tmp/sbp-env-backup 2>/dev/null || true
    
    # Atualizar código
    git fetch origin
    git reset --hard "origin/${SCRIPT_BRANCH}"
    
    # Restaurar .env
    cp /tmp/sbp-env-backup .env 2>/dev/null || true
    
    # Atualizar dependências
    npm install --production || warn "Falha ao atualizar dependências"
    npx prisma migrate deploy || warn "Falha na migração"
    npm run build || error_exit "Falha no build"
    
    # Permissões
    chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
    
    # Iniciar
    systemctl start "$SERVICE_NAME" || error_exit "Falha ao iniciar"
    
    sleep 3
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        success "Atualização concluída!"
        echo ""
        echo "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
    else
        error_exit "Serviço não iniciou"
    fi
}

# ============================================
# MENU
# ============================================
show_menu() {
    echo ""
    echo "${BOLD}Escolha uma opção:${RESET}"
    echo ""
    echo "${GREEN}1${RESET} - Reinstalar (limpa tudo)"
    echo "${YELLOW}2${RESET} - Atualizar (mantém dados)"
    echo "${RED}3${RESET} - Cancelar"
    echo ""
}

get_choice() {
    local choice
    if [[ -t 0 ]]; then
        read -rp "Digite 1, 2 ou 3: " choice
    else
        read -rp "Digite 1, 2 ou 3: " choice < /dev/tty
    fi
    echo "$choice"
}

# ============================================
# MAIN
# ============================================
main() {
    check_requirements
    
    echo ""
    echo "${BOLD}SocialBluePro - Instalador v${SCRIPT_VERSION}${RESET}"
    echo "=================================="
    echo ""
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        warn "Instalação existente detectada em $INSTALL_DIR"
        echo ""
        
        cd "$INSTALL_DIR" 2>/dev/null || true
        local current
        current=$(git describe --tags 2>/dev/null || echo "unknown")
        
        echo "Versão atual: $current"
        echo "Nova versão:  $SCRIPT_BRANCH"
        
        show_menu
        
        case "$(get_choice)" in
            1) echo "" && reinstall ;;
            2) echo "" && update ;;
            *) echo "" && echo "Cancelado." && exit 0 ;;
        esac
    else
        install_new
    fi
}

main "$@"
