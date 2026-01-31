#!/bin/bash
#
# SocialBluePro - Instalador Moderno e Robusto
# Uso: curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
#

set -euo pipefail

# ============================================
# CONFIGURAÇÕES
# ============================================
INSTALL_DIR="/opt/socialbluepro"
SERVICE_NAME="socialbluepro"
REPO_URL="https://github.com/rafaelfmuniz/socialbluepro.git"
SCRIPT_BRANCH="main"
SCRIPT_VERSION="2.0.1"

# ============================================
# CORES (usando tput para compatibilidade)
# ============================================
setup_colors() {
    if [[ -t 2 ]] && [[ -z "${NO_COLOR-}" ]] && [[ "${TERM-}" != "dumb" ]]; then
        RED=$(tput setaf 1)
        GREEN=$(tput setaf 2)
        YELLOW=$(tput setaf 3)
        BLUE=$(tput setaf 4)
        BOLD=$(tput bold)
        RESET=$(tput sgr0)
    else
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        BOLD=''
        RESET=''
    fi
}

setup_colors

# ============================================
# FUNÇÕES DE LOG
# ============================================
log() {
    echo "${BLUE}[$(date +'%H:%M:%S')]${RESET} $1"
}

success() {
    echo "${GREEN}[✓]${RESET} $1"
}

warning() {
    echo "${YELLOW}[!]${RESET} $1" >&2
}

error() {
    echo "${RED}[✗]${RESET} $1" >&2
    exit 1
}

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script precisa ser executado como root. Use: sudo"
    fi
}

check_system() {
    if ! command -v apt-get &>/dev/null; then
        error "Este script suporta apenas Ubuntu/Debian"
    fi
}

# Função para input (funciona com pipe)
get_input() {
    local prompt="$1"
    local var_name="$2"
    
    if [[ -t 0 ]]; then
        # Terminal interativo
        read -rp "$prompt" "$var_name"
    else
        # Piped input - tentar /dev/tty
        if [[ -r /dev/tty ]]; then
            read -rp "$prompt" "$var_name" < /dev/tty
        else
            error "Não foi possível ler input. Execute o script sem pipe: sudo bash install.sh"
        fi
    fi
}

# ============================================
# INSTALAÇÃO DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log "Atualizando repositórios..."
    apt-get update -qq || error "Falha ao atualizar repositórios"
    
    log "Instalando Node.js..."
    # Tentar instalar LTS mais recente
    if ! curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - 2>/dev/null; then
        log "Tentando versão alternativa..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || error "Falha ao configurar NodeSource"
    fi
    
    apt-get install -y -qq nodejs postgresql postgresql-client git curl || error "Falha ao instalar pacotes"
    
    local NODE_VERSION
    NODE_VERSION=$(node --version 2>/dev/null || echo "N/A")
    success "Node.js instalado: $NODE_VERSION"
}

setup_postgresql() {
    log "Configurando PostgreSQL..."
    
    systemctl start postgresql || error "Falha ao iniciar PostgreSQL"
    systemctl enable postgresql || warning "Falha ao habilitar PostgreSQL"
    
    local DB_PASS
    DB_PASS=$(openssl rand -hex 16)
    
    # Salvar senha em arquivo temporário PRIMEIRO
    echo "$DB_PASS" > /tmp/sbp_db_pass.txt
    
    # Criar banco (se não existir)
    sudo -u postgres psql -c "CREATE DATABASE socialbluepro;" 2>/dev/null || warning "Banco já existe"
    
    # Dropar usuário se existir (para garantir senha nova)
    sudo -u postgres psql -c "DROP USER IF EXISTS sbp_user;" 2>/dev/null || true
    
    # Criar usuário com senha nova
    sudo -u postgres psql -c "CREATE USER sbp_user WITH PASSWORD '$DB_PASS';" || error "Falha ao criar usuário PostgreSQL"
    
    # Conceder privilégios
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;" || error "Falha ao conceder privilégios"
    
    # Grant schema permissions for Prisma
    sudo -u postgres psql socialbluepro -c "GRANT ALL ON SCHEMA public TO sbp_user;" || warning "Falha ao conceder permissões no schema"
    
    success "PostgreSQL configurado"
}

# ============================================
# INSTALAÇÃO NOVA
# ============================================
install_new() {
    log "Iniciando instalação nova..."
    
    # Instalar dependências
    install_dependencies
    
    # Setup PostgreSQL
    setup_postgresql
    
    # Ler senha do arquivo temporário
    local DB_PASS
    DB_PASS=$(cat /tmp/sbp_db_pass.txt)
    rm -f /tmp/sbp_db_pass.txt
    
    # Criar diretório
    log "Baixando projeto..."
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR" || error "Não foi possível acessar $INSTALL_DIR"
    
    # Clone
    git clone --depth 1 "$REPO_URL" . || error "Falha ao clonar repositório"
    
    # Configurar ambiente
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
    
    # Instalar dependências npm
    log "Instalando dependências npm..."
    npm install --production || error "Falha ao instalar dependências npm"
    
    # Setup Prisma
    log "Configurando Prisma..."
    npx prisma generate || error "Falha ao gerar Prisma Client"
    npx prisma migrate deploy || error "Falha ao migrar banco de dados"
    
    # Criar usuário admin
    log "Criando usuário administrador..."
    local ADMIN_EMAIL="admin-$(openssl rand -hex 4)@local.system"
    local ADMIN_PASSWORD
    ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
    
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
    
    # Setup diretórios
    mkdir -p public/uploads
    chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
    
    # Criar serviço systemd
    create_systemd_service
    
    # Salvar credenciais
    save_credentials "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
    
    # Mostrar sucesso
    show_success "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
}

# ============================================
# ATUALIZAÇÃO
# ============================================
update_existing() {
    log "Atualizando instalação existente..."
    
    cd "$INSTALL_DIR" || error "Não foi possível acessar $INSTALL_DIR"
    
    # Backup
    log "Fazendo backup..."
    sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-backup-$(date +%Y%m%d-%H%M%S).sql" || warning "Falha no backup do banco"
    
    # Parar serviço
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Salvar .env
    cp .env /tmp/socialbluepro-env-backup 2>/dev/null || true
    
    # Atualizar código
    log "Atualizando código..."
    git fetch origin || warning "Falha ao fetch"
    git reset --hard origin/$SCRIPT_BRANCH || error "Falha ao atualizar código"
    
    # Restaurar .env
    cp /tmp/socialbluepro-env-backup .env 2>/dev/null || true
    
    # Atualizar dependências
    log "Atualizando dependências..."
    npm install --production || warning "Falha ao atualizar dependências"
    
    # Migrar banco
    log "Atualizando banco de dados..."
    npx prisma migrate deploy || warning "Falha na migração"
    
    # Rebuild
    log "Compilando..."
    npm run build || error "Falha no build"
    
    # Permissões
    chown -R www-data:www-data public/uploads 2>/dev/null || chown -R root:root public/uploads
    
    # Iniciar
    systemctl start "$SERVICE_NAME" || error "Falha ao iniciar serviço"
    
    sleep 3
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        success "Atualização concluída!"
        echo ""
        echo "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
        echo ""
    else
        error "Falha ao iniciar serviço"
    fi
}

# ============================================
# REINSTALAÇÃO (limpa tudo)
# ============================================
reinstall() {
    log "Preparando reinstalação LIMPA TOTAL..."
    echo ""
    warning "Isso removerá TUDO: banco de dados, usuário, serviço e arquivos!"
    echo ""
    
    # Parar e remover serviço systemd
    log "Parando serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload 2>/dev/null || true
    success "Serviço removido"
    
    # Backup do banco (última chance)
    if [[ -d "$INSTALL_DIR" ]]; then
        log "Fazendo backup final do banco..."
        sudo -u postgres pg_dump socialbluepro 2>/dev/null > "/tmp/sbp-final-backup-$(date +%Y%m%d-%H%M%S).sql" || warning "Não foi possível fazer backup"
    fi
    
    # Dropar banco de dados
    log "Removendo banco de dados..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS socialbluepro;" 2>/dev/null || warning "Erro ao dropar banco"
    success "Banco de dados removido"
    
    # Dropar usuário PostgreSQL
    log "Removendo usuário PostgreSQL..."
    sudo -u postgres psql -c "DROP USER IF EXISTS sbp_user;" 2>/dev/null || warning "Erro ao dropar usuário"
    success "Usuário PostgreSQL removido"
    
    # Remover diretório de instalação
    log "Removendo arquivos..."
    cd / || true
    rm -rf "$INSTALL_DIR"
    success "Arquivos removidos"
    
    # Limpar caches npm
    log "Limpando caches..."
    npm cache clean --force 2>/dev/null || true
    
    echo ""
    success "Limpeza completa! Iniciando instalação nova..."
    echo ""
    
    # Instalar do zero
    install_new
}

# ============================================
# FUNÇÕES AUXILIARES
# ============================================
create_systemd_service() {
    log "Criando serviço systemd..."
    
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
    
    systemctl daemon-reload || warning "Falha no daemon-reload"
    systemctl enable "$SERVICE_NAME" || warning "Falha ao habilitar serviço"
    systemctl start "$SERVICE_NAME" || error "Falha ao iniciar serviço"
}

save_credentials() {
    local email="$1"
    local password="$2"
    
    local CRED_FILE="/root/.socialbluepro-credentials"
    cat > "$CRED_FILE" << EOF
====================================
SocialBluePro - Credenciais de Acesso
Gerado em: $(date)
====================================

Email: $email
Senha: $password

IMPORTANTE:
- Este arquivo está em $CRED_FILE
- Apenas root pode ler este arquivo
- Altere a senha após o primeiro login
- Delete este arquivo após anotar as credenciais

Acesso: http://$(hostname -I | awk '{print $1}'):3000
====================================
EOF
    chmod 600 "$CRED_FILE"
}

show_success() {
    local email="$1"
    local password="$2"
    local IP
    IP=$(hostname -I | awk '{print $1}')
    
    sleep 3
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo ""
        echo "========================================"
        echo "${GREEN}SocialBluePro instalado com sucesso!${RESET}"
        echo "========================================"
        echo ""
        echo "${BOLD}Credenciais de Acesso:${RESET}"
        echo "  Email: ${GREEN}$email${RESET}"
        echo "  Senha: ${GREEN}$password${RESET}"
        echo ""
        echo "${YELLOW}IMPORTANTE:${RESET}"
        echo "  - Altere a senha após o primeiro login"
        echo "  - Credenciais salvas em: /root/.socialbluepro-credentials"
        echo ""
        echo "${BOLD}Acesso:${RESET}"
        echo "  Local: http://localhost:3000"
        echo "  Rede:  http://$IP:3000"
        echo ""
        echo "${BOLD}Comandos úteis:${RESET}"
        echo "  sudo systemctl start $SERVICE_NAME"
        echo "  sudo systemctl stop $SERVICE_NAME"
        echo "  sudo systemctl status $SERVICE_NAME"
        echo ""
    else
        error "Serviço não está rodando. Verifique: sudo systemctl status $SERVICE_NAME"
    fi
}

# ============================================
# MENU PRINCIPAL
# ============================================
show_menu() {
    echo ""
    echo "${BOLD}Escolha uma opção:${RESET}"
    echo ""
    echo "${GREEN}1${RESET} - Reinstalar (limpa tudo e instala do zero)"
    echo "${YELLOW}2${RESET} - Atualizar (mantém dados, atualiza código)"
    echo "${RED}3${RESET} - Cancelar"
    echo ""
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================
main() {
    # Verificações iniciais
    check_root
    check_system
    
    # Header
    echo ""
    echo "${BOLD}SocialBluePro - Instalador${RESET}"
    echo "=================================="
    echo ""
    
    # Verificar instalação existente
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        echo "${YELLOW}⚠ Instalação existente detectada em $INSTALL_DIR${RESET}"
        echo ""
        
        cd "$INSTALL_DIR" 2>/dev/null || true
        local CURRENT_VERSION
        CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "v2.0.0")
        
        echo "Versão atual: $CURRENT_VERSION"
        echo "Nova versão: $SCRIPT_BRANCH"
        echo ""
        
        # Mostrar menu
        show_menu
        
        # Obter escolha
        local choice
        get_input "Digite 1, 2 ou 3: " choice
        
        case "$choice" in
            1)
                echo ""
                reinstall
                ;;
            2)
                echo ""
                update_existing
                ;;
            3|*)
                echo ""
                echo "Operação cancelada."
                exit 0
                ;;
        esac
    else
        # Instalação nova
        install_new
    fi
}

# Executar
main "$@"
