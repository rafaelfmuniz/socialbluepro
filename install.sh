#!/bin/bash
#
# SocialBluePro - Instalador Profissional v2.1.0
# Autor: SocialBluePro Team
# Licença: MIT
#
# Uso: curl -fsSL https://github.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
#
# Funcionalidades:
#   - Instalação limpa
#   - Reinstalação com backup automático
#   - Atualização incremental
#   - Desinstalação completa
#   - Validações de sistema
#   - Rollback automático
#   - Logging detalhado
#

set -euo pipefail

# ============================================
# CONFIGURAÇÕES GLOBAIS
# ============================================
readonly SCRIPT_VERSION="2.1.0"
readonly SCRIPT_DATE="2026-01-30"
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
INSTALL_MODE=""
BACKUP_DIR=""
ROLLBACK_POINT=""

# ============================================
# ESTRUTURA DE CORES E EMOJIS
# ============================================
setup_colors() {
    if [[ -t 2 ]] && [[ -z "${NO_COLOR:-}" ]] && [[ "${TERM:-}" != "dumb" ]]; then
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        YELLOW='\033[0;33m'
        BLUE='\033[0;34m'
        MAGENTA='\033[0;35m'
        CYAN='\033[0;36m'
        BOLD='\033[1m'
        DIM='\033[2m'
        NC='\033[0m'
    else
        RED='' GREEN='' YELLOW='' BLUE='' MAGENTA='' CYAN='' BOLD='' DIM='' NC=''
    fi
}

setup_colors

# ============================================
# SISTEMA DE LOGGING AVANÇADO
# ============================================
log_level=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE" >&2
}

log_debug() {
    [[ $log_level -ge 1 ]] && echo -e "${DIM}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_trace() {
    [[ $log_level -ge 2 ]] && echo -e "${DIM}[TRACE]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# ============================================
# PROGRESS INDICATOR
# ============================================
show_spinner() {
    local pid=$1
    local message=$2
    local spinstr='|/-\'
    local i=0
    
    echo -n -e "${BLUE}[INFO]${NC} $message "
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i + 1) % 4 ))
        printf "\r${BLUE}[INFO]${NC} $message ${spinstr:$i:1}        "
        sleep 0.1
    done
    
    printf "\r${BLUE}[INFO]${NC} $message ... done${NC}\n"
}

# ============================================
# TRATAMENTO DE ERROS COM STACK TRACE
# ============================================
error_handler() {
    local line_no=$1
    local bash_lineno=$2
    local exit_code=$3
    
    log_error "Erro fatal detectado!"
    log_error "  Linha: $line_no"
    log_error "  Comando: ${BASH_COMMAND}"
    log_error "  Exit code: $exit_code"
    
    echo -e "\n${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}ERRO FATAL DURANTE A INSTALAÇÃO${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "${BOLD}Detalhes do erro:${NC}"
    echo "  Linha:         $line_no"
    echo "  Comando:       ${BASH_COMMAND}"
    echo "  Exit code:     $exit_code"
    echo ""
    echo "${BOLD}Soluções sugeridas:${NC}"
    echo "  1. Verifique o log completo: ${CYAN}$LOG_FILE${NC}"
    echo "  2. Verifique se há recursos suficientes (RAM, disco)"
    echo "  3. Verifique a conectividade com a internet"
    echo "  4. Tente executar novamente com DEBUG:"
    echo "     ${CYAN}curl -fsSL $REPO_URL/raw/main/install.sh | sudo bash -s -- --debug${NC}"
    echo ""
    
    if [[ -n "$ROLLBACK_POINT" ]]; then
        echo "${YELLOW}Tentando rollback automático...${NC}"
        perform_rollback "$ROLLBACK_POINT" || log_warning "Rollback falhou"
    fi
    
    echo ""
    echo "${BOLD}Stack trace:${NC}"
    local frame=0
    while caller $frame; do
        ((frame++))
    done
    
    exit $exit_code
}

trap 'error_handler ${LINENO} ${BASH_LINENO} $?' ERR

# ============================================
# VALIDAÇÕES PRÉ-INSTALAÇÃO
# ============================================
validate_system() {
    log_info "Validando requisitos do sistema..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root (use sudo)"
        echo "Execute: ${CYAN}sudo bash install.sh${NC}"
        exit 1
    fi
    
    if [[ ! -f /etc/os-release ]]; then
        log_error "Não foi possível identificar o sistema operacional"
        exit 1
    fi
    
    source /etc/os-release
    log_info "Sistema detectado: $PRETTY_NAME"
    
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        log_warning "Sistema não oficialmente suportado: $ID"
        read -rp "Deseja continuar mesmo assim? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Instalação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    local total_mem_mb
    total_mem_mb=$(free -m | awk '/^Mem:/{print $2}')
    log_info "RAM disponível: ${total_mem_mb}MB"
    
    if [[ $total_mem_mb -lt 2048 ]]; then
        log_warning "RAM abaixo do recomendado (mínimo: 2GB, atual: ${total_mem_mb}MB)"
        read -rp "Deseja continuar mesmo assim? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Instalação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    local free_disk_gb
    free_disk_gb=$(df -BG /opt 2>/dev/null | awk 'NR==2{print $4}' | sed 's/G//')
    log_info "Espaço livre em disco: ${free_disk_gb}GB"
    
    if [[ $free_disk_gb -lt 5 ]]; then
        log_error "Espaço em disco insuficiente (mínimo: 5GB, atual: ${free_disk_gb}GB)"
        echo "Libere espaço em disco e tente novamente"
        exit 1
    fi
    
    check_port 3000 "Aplicação"
    check_port 5432 "PostgreSQL"
    check_connectivity
    
    log_success "Sistema validado com sucesso"
}

check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_warning "Porta $port já está em uso pelo processo $pid ($service)"
        read -rp "Deseja matar o processo e continuar? (s/N): " confirm
        if [[ "$confirm" =~ ^[Ss]$ ]]; then
            kill -9 $pid 2>/dev/null || log_warning "Não foi possível matar o processo $pid"
        else
            log_info "Instalação cancelada pelo usuário"
            exit 0
        fi
    fi
}

check_connectivity() {
    log_info "Verificando conectividade..."
    
    if ! ping -c 1 -W 2 github.com &>/dev/null; then
        log_error "Sem conexão com GitHub"
        echo "Verifique sua conexão com a internet"
        exit 1
    fi
    
    if ! ping -c 1 -W 2 deb.nodesource.com &>/dev/null; then
        log_error "Sem conexão com NodeSource"
        echo "Verifique sua conexão com a internet"
        exit 1
    fi
    
    log_success "Conectividade verificada"
}

# ============================================
# FUNÇÕES DE BACKUP
# ============================================
create_backup() {
    local backup_type=$1
    BACKUP_DIR="/tmp/socialbluepro-backup-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Criando backup ($backup_type) em $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw socialbluepro; then
        log_info "Fazendo backup do banco de dados..."
        sudo -u postgres pg_dump socialbluepro > "$BACKUP_DIR/database.sql" 2>/dev/null || \
            log_warning "Backup do banco falhou"
    fi
    
    if [[ -d "$INSTALL_DIR" ]]; then
        log_info "Fazendo backup dos arquivos..."
        cp -r "$INSTALL_DIR" "$BACKUP_DIR/installation" 2>/dev/null || \
            log_warning "Backup dos arquivos falhou"
    fi
    
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        cp "$INSTALL_DIR/.env" "$BACKUP_DIR/.env" 2>/dev/null || \
            log_warning "Backup do .env falhou"
    fi
    
    log_success "Backup criado em $BACKUP_DIR"
}

perform_rollback() {
    local backup_dir=$1
    
    log_warning "Iniciando rollback de $backup_dir..."
    
    if [[ -f "$backup_dir/database.sql" ]]; then
        log_info "Restaurando banco de dados..."
        sudo -u postgres psql socialbluepro < "$backup_dir/database.sql" 2>/dev/null || \
            log_warning "Restauração do banco falhou"
    fi
    
    if [[ -d "$backup_dir/installation" ]]; then
        log_info "Restaurando arquivos..."
        rm -rf "$INSTALL_DIR"
        cp -r "$backup_dir/installation" "$INSTALL_DIR" 2>/dev/null || \
            log_warning "Restauração dos arquivos falhou"
    fi
    
    if [[ -f "$backup_dir/.env" ]]; then
        cp "$backup_dir/.env" "$INSTALL_DIR/.env" 2>/dev/null || \
            log_warning "Restauração do .env falhou"
    fi
    
    log_warning "Rollback concluído"
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log_info "Instalando dependências do sistema..."
    
    log_info "Atualizando repositórios apt..."
    apt-get update -qq || {
        log_error "Falha ao atualizar repositórios"
        echo "Solução: Verifique sua conexão com a internet"
        exit 1
    }
    
    log_info "Configurando Node.js 20.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
        log_error "Falha ao configurar NodeSource"
        echo "Solução: Verifique sua conexão com a internet"
        exit 1
    }
    
    log_info "Instalando pacotes..."
    apt-get install -y \
        nodejs \
        postgresql \
        postgresql-client \
        git \
        curl \
        openssl \
        build-essential \
        python3 \
        -qq || {
        log_error "Falha ao instalar pacotes"
        echo "Solução: Verifique o log completo para detalhes"
        exit 1
    }
    
    local node_version=$(node --version 2>/dev/null || echo "N/A")
    local psql_version=$(psql --version 2>/dev/null | awk '{print $3}' || echo "N/A")
    
    log_success "Node.js: $node_version"
    log_success "PostgreSQL: $psql_version"
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
            log_error "PostgreSQL não iniciou após $max_attempts tentativas"
            echo "Solução: Verifique os logs do PostgreSQL: sudo systemctl status postgresql"
            exit 1
        fi
        log_debug "Aguardando PostgreSQL... ($attempt/$max_attempts)"
        sleep 1
    done
    
    DB_PASSWORD=$(openssl rand -hex 24)
    
    mkdir -p "$TEMP_DIR"
    chmod 700 "$TEMP_DIR"
    
    echo "$DB_PASSWORD" > "$TEMP_DIR/db_password"
    chmod 600 "$TEMP_DIR/db_password"
    
    log_info "Criando banco de dados e usuário..."
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS socialbluepro;
DROP USER IF EXISTS sbp_user;
CREATE DATABASE socialbluepro;
CREATE USER sbp_user WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE socialbluepro TO sbp_user;
\c socialbluepro
GRANT ALL ON SCHEMA public TO sbp_user;
EOF
    
    if [[ $? -ne 0 ]]; then
        log_error "Falha ao configurar PostgreSQL"
        echo "Solução: Verifique os logs do PostgreSQL"
        exit 1
    fi
    
    log_success "Banco de dados configurado"
}

# ============================================
# DOWNLOAD E CONFIGURAÇÃO DA APLICAÇÃO
# ============================================
download_application() {
    log_info "Baixando aplicação do GitHub..."
    
    mkdir -p "$INSTALL_DIR"
    
    log_info "Clonando repositório..."
    git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR" || {
        log_error "Falha ao clonar repositório"
        echo "Solução: Verifique sua conexão com a internet e a URL do repositório"
        exit 1
    }
    
    cd "$INSTALL_DIR" || {
        log_error "Não foi possível acessar $INSTALL_DIR"
        exit 1
    }
    
    log_info "Configurando arquivo .env..."
    
    if [[ ! -f "$TEMP_DIR/db_password" ]]; then
        log_error "Senha do banco não encontrada em $TEMP_DIR/db_password"
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
    
    log_success "Aplicação baixada e configurada"
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS NPM
# ============================================
install_npm_dependencies() {
    log_info "Instalando dependências npm..."
    
    cd "$INSTALL_DIR" || {
        log_error "Diretório de instalação não encontrado"
        exit 1
    }
    
    log_info "Executando npm install --production..."
    npm install --production --silent || {
        log_error "Falha ao instalar dependências npm"
        echo "Solução: Verifique o log do npm e sua conexão com a internet"
        exit 1
    }
    
    log_info "Gerando Prisma Client..."
    npx prisma generate || {
        log_error "Falha ao gerar Prisma Client"
        echo "Solução: Verifique se o schema.prisma está correto"
        exit 1
    }
    
    log_info "Executando migrações do banco..."
    npx prisma migrate deploy || {
        log_error "Falha ao executar migrações"
        echo "Solução: Verifique as migrações e a conexão com o banco"
        exit 1
    }
    
    log_success "Dependências instaladas"
}

# ============================================
# CRIAÇÃO DE USUÁRIO ADMIN
# ============================================
create_admin_user() {
    log_info "Criando usuário administrador..."
    
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
    
    if [[ $? -ne 0 ]]; then
        log_warning "Falha ao criar usuário admin (pode já existir)"
    else
        log_success "Usuário administrador criado"
    fi
}

# ============================================
# BUILD E SERVIÇO SYSTEMD
# ============================================
build_and_start_service() {
    log_info "Compilando aplicação..."
    
    cd "$INSTALL_DIR" || {
        log_error "Diretório de instalação não encontrado"
        exit 1
    }
    
    npm run build || {
        log_error "Falha no build da aplicação"
        echo "Solução: Verifique os logs do build e os erros de compilação"
        exit 1
    }
    
    mkdir -p "$INSTALL_DIR/public/uploads"
    chown -R www-data:www-data "$INSTALL_DIR/public/uploads" 2>/dev/null || \
        chown -R root:root "$INSTALL_DIR/public/uploads"
    
    log_info "Criando serviço systemd..."
    
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<'EOF'
[Unit]
Description=SocialBluePro - Sistema de Gestão de Leads
Documentation=https://github.com/rafaelfmuniz/socialbluepro
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
SyslogIdentifier=socialbluepro

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    
    log_info "Iniciando serviço..."
    systemctl start "$SERVICE_NAME" || {
        log_error "Falha ao iniciar serviço"
        echo "Solução: Verifique os logs: sudo journalctl -u $SERVICE_NAME -n 50"
        exit 1
    }
    
    log_success "Serviço iniciado"
}

# ============================================
# VERIFICAÇÃO DE SAÚDE PÓS-INSTALAÇÃO
# ============================================
health_check() {
    log_info "Verificando saúde da aplicação..."
    
    local max_attempts=10
    local attempt=0
    local healthy=false
    
    while [[ $attempt -lt $max_attempts ]]; do
        ((attempt++))
        log_debug "Verificando serviço... ($attempt/$max_attempts)"
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            if curl -s http://localhost:3000 &>/dev/null; then
                healthy=true
                break
            fi
        fi
        
        sleep 2
    done
    
    if [[ "$healthy" == "true" ]]; then
        log_success "Aplicação está funcionando corretamente"
    else
        log_warning "Aplicação pode não estar funcionando corretamente"
        log_warning "Verifique os logs: sudo journalctl -u $SERVICE_NAME -f"
    fi
}

# ============================================
# SALVAR CREDENCIAIS
# ============================================
save_credentials() {
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    cat > "$CREDENTIALS_FILE" <<EOF
═══════════════════════════════════════════════════════════════
           SocialBluePro - Credenciais de Acesso
           Versão: ${SCRIPT_VERSION}
           Gerado em: $(date '+%Y-%m-%d %H:%M:%S')
═══════════════════════════════════════════════════════════════

🔐 CREDENCIAIS DE ADMINISTRAÇÃO:
   Email:    ${ADMIN_EMAIL}
   Senha:    ${ADMIN_PASSWORD}

🗄️  BANCO DE DADOS:
   Usuário:  sbp_user
   Senha:    ${DB_PASSWORD}

🌐 ACESSO:
   Local:    http://localhost:3000
   Rede:     http://${ip_address}:3000

⚠️  IMPORTANTE:
   • Altere a senha do admin após o primeiro login
   • Este arquivo está em: ${CREDENTIALS_FILE}
   • Apenas root pode ler este arquivo
   • Delete este arquivo após anotar as credenciais

📋 COMANDOS ÚTEIS:
   sudo systemctl start ${SERVICE_NAME}
   sudo systemctl stop ${SERVICE_NAME}
   sudo systemctl restart ${SERVICE_NAME}
   sudo systemctl status ${SERVICE_NAME}
   sudo journalctl -u ${SERVICE_NAME} -f   (logs em tempo real)

📝 LOG DE INSTALAÇÃO:
   ${LOG_FILE}

═══════════════════════════════════════════════════════════════
EOF
    
    chmod 600 "$CREDENTIALS_FILE"
    log_success "Credenciais salvas em $CREDENTIALS_FILE"
}

# ============================================
# LIMPEZA
# ============================================
cleanup() {
    log_info "Limpando arquivos temporários..."
    
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
    
    log_success "Limpeza concluída"
}

# ============================================
# MENSAGEM FINAL DE SUCESSO
# ============================================
show_success() {
    local ip_address
    ip_address=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}SocialBluePro instalado com sucesso!${NC}                    ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "${BOLD}📦 Versão:${NC}    ${SCRIPT_VERSION}"
    echo "${BOLD}📅 Data:${NC}       $(date '+%d/%m/%Y %H:%M')"
    echo ""
    echo "${BOLD}🔐 Credenciais:${NC}"
    echo "   ${CYAN}Email:${NC}    ${ADMIN_EMAIL}"
    echo "   ${CYAN}Senha:${NC}    ${ADMIN_PASSWORD}"
    echo ""
    echo "${BOLD}🌐 Acesse:${NC}"
    echo "   ${CYAN}Local:${NC}    http://localhost:3000"
    echo "   ${CYAN}Rede:${NC}     http://${ip_address}:3000"
    echo ""
    echo "${BOLD}📝 Credenciais completas salvas em:${NC}"
    echo "   ${CYAN}${CREDENTIALS_FILE}${NC}"
    echo ""
    echo "${BOLD}📋 Log de instalação:${NC}"
    echo "   ${CYAN}${LOG_FILE}${NC}"
    echo ""
    echo "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   • Altere a senha do admin após o primeiro login"
    echo "   • Delete o arquivo de credenciais após anotá-las"
    echo ""
}

# ============================================
# INSTALAÇÃO COMPLETA
# ============================================
install_new() {
    INSTALL_MODE="new"
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
    health_check
    save_credentials
    cleanup
    
    show_success
}

# ============================================
# REINSTALAÇÃO
# ============================================
reinstall() {
    INSTALL_MODE="reinstall"
    log_warning "Iniciando reinstalação (limpa tudo)..."
    
    echo -e "\n${RED}⚠️  ATENÇÃO: Isso removerá TODOS os dados permanentemente!${NC}\n"
    read -rp "Digite 'SIM' para confirmar: " confirm
    
    if [[ "$confirm" != "SIM" ]]; then
        log_info "Reinstalação cancelada"
        exit 0
    fi
    
    create_backup "pre-reinstall"
    
    log_info "Parando e removendo serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload 2>/dev/null || true
    
    log_info "Removendo banco de dados e usuário..."
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
    INSTALL_MODE="update"
    log_info "Iniciando atualização incremental..."
    
    if [[ ! -d "$INSTALL_DIR" ]]; then
        log_error "Instalação não encontrada em $INSTALL_DIR"
        echo "Execute o script para instalar pela primeira vez"
        exit 1
    fi
    
    create_backup "pre-update"
    ROLLBACK_POINT="$BACKUP_DIR"
    
    cd "$INSTALL_DIR" || {
        log_error "Não foi possível acessar $INSTALL_DIR"
        exit 1
    }
    
    log_info "Parando serviço..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    log_info "Salvando configurações..."
    cp .env /tmp/sbp-env-backup 2>/dev/null || true
    
    log_info "Atualizando código do repositório..."
    git fetch origin || {
        log_error "Falha ao buscar atualizações do GitHub"
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
    npm install --production || {
        log_error "Falha ao atualizar dependências"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    log_info "Executando migrações..."
    npx prisma migrate deploy || {
        log_error "Falha nas migrações"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    log_info "Recompilando aplicação..."
    npm run build || {
        log_error "Falha no build"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    log_info "Iniciando serviço..."
    systemctl start "$SERVICE_NAME" || {
        log_error "Falha ao iniciar serviço"
        perform_rollback "$ROLLBACK_POINT"
        exit 1
    }
    
    health_check
    cleanup
    
    log_success "Atualização concluída com sucesso!"
    echo ""
    echo "Acesse: http://$(hostname -I | awk '{print $1}'):3000"
}

# ============================================
# DESINSTALAÇÃO
# ============================================
uninstall() {
    INSTALL_MODE="uninstall"
    
    echo -e "\n${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}            ${BOLD}DESINSTALAÇÃO DO SOCIALBLUEPRO${NC}               ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${YELLOW}Isso removerá:${NC}"
    echo "  • Banco de dados (todos os dados)"
    echo "  • Arquivos da aplicação"
    echo "  • Usuário do PostgreSQL"
    echo "  • Serviço systemd"
    echo ""
    
    read -rp "Deseja continuar? (Digite 'SIM' para confirmar): " confirm
    
    if [[ "$confirm" != "SIM" ]]; then
        log_info "Desinstalação cancelada"
        exit 0
    fi
    
    log_info "Criando backup de emergência..."
    create_backup "pre-uninstall" || true
    
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
    rm -f "$CREDENTIALS_FILE"
    npm cache clean --force 2>/dev/null || true
    
    cleanup
    
    echo ""
    echo -e "${GREEN}✓ SocialBluePro removido com sucesso!${NC}"
    echo ""
    echo "${BOLD}Backup de emergência:${NC} $BACKUP_DIR"
    echo ""
}

# ============================================
# MENU INTERATIVO
# ============================================
show_menu() {
    clear
    
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}         ${BOLD}SocialBluePro - Instalador v${SCRIPT_VERSION}${NC}         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}              ${DIM}Sistema de Gestão de Leads${NC}                 ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd "$INSTALL_DIR" 2>/dev/null || true
        local current
        current=$(git describe --tags 2>/dev/null || echo "unknown")
        
        echo "${BOLD}📦 Instalação detectada:${NC} $INSTALL_DIR"
        echo "${BOLD}🏷️  Versão atual:${NC}    $current"
        echo "${BOLD}🆕 Nova versão:${NC}     $REPO_BRANCH"
        echo ""
    fi
    
    echo "${BOLD}Selecione uma opção:${NC}"
    echo ""
    echo -e "  ${GREEN}1${NC}) Instalar (instalação limpa)"
    echo -e "  ${YELLOW}2${NC}) Reinstalar (remove tudo e reinstala)"
    echo -e "  ${BLUE}3${NC}) Atualizar (mantém dados)"
    echo -e "  ${RED}4${NC}) Desinstalar (remove tudo)"
    echo -e "  ${DIM}5${NC}) Sair"
    echo ""
}

get_choice() {
    local choice
    read -rp "Digite uma opção (1-5): " choice
    echo "$choice"
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
            if [[ -d "$INSTALL_DIR/.git" ]]; then
                log_warning "Instalação já existe em $INSTALL_DIR"
                echo "Use a opção 2 (Reinstalar) para limpar e reinstalar"
                exit 1
            fi
            install_new
            ;;
        2)
            echo ""
            if [[ ! -d "$INSTALL_DIR/.git" ]]; then
                log_warning "Nenhuma instalação encontrada"
                echo "Use a opção 1 (Instalar) para nova instalação"
                exit 1
            fi
            reinstall
            ;;
        3)
            echo ""
            if [[ ! -d "$INSTALL_DIR/.git" ]]; then
                log_warning "Nenhuma instalação encontrada"
                echo "Use a opção 1 (Instalar) para nova instalação"
                exit 1
            fi
            update
            ;;
        4)
            echo ""
            if [[ ! -d "$INSTALL_DIR/.git" ]]; then
                log_warning "Nenhuma instalação encontrada"
                exit 1
            fi
            uninstall
            ;;
        5)
            echo ""
            log_info "Instalação cancelada pelo usuário"
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
