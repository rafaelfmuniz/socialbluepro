#!/bin/bash

#================================================================================
# SocialBluePro - Installer Script
# Version: 1.0.0
# Description: Automated installer for baremetal Linux (Debian/Ubuntu)
#================================================================================

set -e

#================================================================================
# CONFIGURATION
#================================================================================
SCRIPT_VERSION="1.0.0"
APP_NAME="socialbluepro"
APP_USER="${APP_NAME}"
APP_GROUP="${APP_NAME}"
APP_DIR="/opt/${APP_NAME}"
INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/${APP_NAME}-installer.log"

# Detect repository directory - works with installer inside prod or outside
if [ -f "${INSTALLER_DIR}/../package.json" ]; then
    # Installer is inside prod folder
    REPO_DIR="${INSTALLER_DIR}/.."
elif [ -f "${INSTALLER_DIR}/../../prod/package.json" ]; then
    # Installer is outside prod folder
    REPO_DIR="${INSTALLER_DIR}/../prod"
elif [ -f "${INSTALLER_DIR}/../prod/package.json" ]; then
    # Alternative structure
    REPO_DIR="${INSTALLER_DIR}/../prod"
else
    # Fallback: try parent directory
    REPO_DIR="${INSTALLER_DIR}/.."
fi

# Default configurations (can be overridden via environment variables)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="${APP_NAME}"
DB_USER="${APP_NAME}"
DB_PASSWORD=""
NEXTAUTH_SECRET=""
ENCRYPTION_KEY=""
ADMIN_EMAIL="admin@socialbluepro.com"
ADMIN_PASSWORD=""

# Server configuration
SERVER_PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#================================================================================
# LOGGING FUNCTIONS
#================================================================================

log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $@" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $@" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $@" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@" | tee -a "${LOG_FILE}"
}

log_section() {
    local msg="$1"
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ${msg}${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════${NC}"
    echo "" | tee -a "${LOG_FILE}"
}

#================================================================================
# DETECTION FUNCTIONS
#================================================================================

detect_os() {
    log_info "Detecting operating system..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS="${ID}"
        OS_VERSION="${VERSION_ID}"
        
        case "${OS}" in
            ubuntu|debian)
                log_success "Detected ${OS} ${VERSION}"
                return 0
                ;;
            *)
                log_error "Unsupported OS: ${OS}. Only Debian/Ubuntu are supported."
                exit 1
                ;;
        esac
    else
        log_error "Cannot detect OS. /etc/os-release not found."
        exit 1
    fi
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root. Use: sudo ./install.sh"
        exit 1
    fi
}

check_source_directory() {
    log_info "Checking source directory..."
    log_info "Source directory: ${REPO_DIR}"
    
    if [ ! -d "${REPO_DIR}" ]; then
        log_error "Source directory not found: ${REPO_DIR}"
        echo ""
        echo -e "${YELLOW}ERROR: Application source directory missing!${NC}"
        echo ""
        echo -e "${BLUE}How to use this installer:${NC}"
        echo ""
        echo "1. Make sure you copied the entire 'prod' folder to the server:"
        echo "   scp -r prod/ user@server:/tmp/"
        echo ""
        echo "2. The installer is located INSIDE the prod folder:"
        echo "   /tmp/prod/socialbluepro-install/install.sh"
        echo ""
        echo "3. Expected structure on the server:"
        echo ""
        echo "   /tmp/prod/                     ← Application (everything here)"
        echo "   ├── src/                    ← Source code"
        echo "   ├── public/"
        echo "   ├── prisma/"
        echo "   ├── package.json"
        echo "   └── socialbluepro-install/    ← Installer"
        echo "       ├── install.sh"
        echo "       ├── scripts/"
        echo "       └── ..."
        echo ""
        echo "4. Verify on the server:"
        echo "   ls -la /tmp/prod/"
        echo ""
        exit 1
    fi
    
    if [ ! -f "${REPO_DIR}/package.json" ]; then
        log_error "package.json not found in ${REPO_DIR}"
        echo ""
        echo -e "${YELLOW}ERROR: Invalid source directory!${NC}"
        echo ""
        echo "The folder must contain package.json to be a valid SocialBluePro application."
        echo ""
        exit 1
    fi
    
    log_success "Source directory verified at ${REPO_DIR}"
    log_info "Files found: $(ls -1 ${REPO_DIR} | wc -l)"
}

check_existing_installation() {
    log_info "Checking for existing installation..."
    
    if [ -d "${APP_DIR}" ] && [ -f "${APP_DIR}/package.json" ]; then
        INSTALLED_VERSION=$(node -p "require('${APP_DIR}/package.json').version" 2>/dev/null || echo "unknown")
        log_warning "Existing installation found at ${APP_DIR}"
        log_info "Installed version: ${INSTALLED_VERSION}"
        return 0
    fi
    
    log_info "No existing installation found. Performing clean installation."
    return 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=()
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "Missing prerequisites: ${missing[*]}"
        log_info "Installing missing packages..."
        apt-get update -qq
        apt-get install -y ${missing[@]}
    fi
    
    log_success "All prerequisites met"
}

#================================================================================
# CONFIGURATION FUNCTIONS
#================================================================================

generate_secrets() {
    log_info "Generating secure secrets..."
    
    if [ -z "${DB_PASSWORD}" ]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        log_info "Generated database password"
    fi
    
    if [ -z "${NEXTAUTH_SECRET}" ]; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        log_info "Generated NextAuth secret"
    fi
    
    if [ -z "${ENCRYPTION_KEY}" ]; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        log_info "Generated encryption key"
    fi
    
    if [ -z "${ADMIN_PASSWORD}" ]; then
        ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
        log_info "Generated admin password"
    fi
}

save_configuration() {
    log_info "Saving configuration..."
    
    local env_file="${APP_DIR}/.env"
    
    cat > "${env_file}" << EOF
# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
DIRECT_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

# Application Configuration
NODE_ENV="${NODE_ENV:-production}"
PORT="${SERVER_PORT}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}"
EOF

    chmod 600 "${env_file}"
    log_success "Configuration saved to ${env_file}"
}

#================================================================================
# INSTALLATION FUNCTIONS
#================================================================================

install_dependencies() {
    log_section "Installing System Dependencies"
    
    apt-get update -qq
    
    # Install essential packages
    log_info "Installing essential packages..."
    apt-get install -y curl wget git software-properties-common \
        build-essential python3 python3-pip \
        ufw fail2ban
    
    # Install PostgreSQL
    log_info "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
    
    # Install Node.js (using NodeSource)
    log_info "Installing Node.js..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        log_info "Node.js already installed: $(node -v)"
    fi
    
    log_success "All dependencies installed"
}

setup_database() {
    log_section "Setting Up Database"
    
    log_info "Checking for existing database and user..."
    
    # Check and drop database if exists
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null)
    if [ "$DB_EXISTS" = "1" ]; then
        log_warning "Database ${DB_NAME} already exists, dropping..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" || log_warning "Could not drop database"
        
        # Terminate connections
        sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" 2>/dev/null || true
    fi
    
    # Check and drop user if exists
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null)
    if [ "$USER_EXISTS" = "1" ]; then
        log_warning "User ${DB_USER} already exists, dropping..."
        # Reassign objects and drop
        sudo -u postgres psql -c "DROP OWNED BY ${DB_USER} CASCADE;" 2>/dev/null || true
        sudo -u postgres psql -c "DROP ROLE IF EXISTS ${DB_USER};" || log_warning "Could not drop user"
    fi
    
    # Create user
    log_info "Creating database user..."
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" || {
        log_error "Failed to create database user"
        exit 1
    }
    
    # Create database
    log_info "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || {
        log_error "Failed to create database"
        exit 1
    }
    
    # Grant privileges
    log_info "Granting privileges..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" || {
        log_error "Failed to grant privileges"
        exit 1
    }
    
    # Grant schema privileges
    sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" || true
    
    log_success "Database setup complete"
}

create_database_only() {
    log_info "Creating database ${DB_NAME} with existing user ${DB_USER}..."
    
    # Terminate any existing connections
    sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" 2>/dev/null || true
    
    # Drop database if exists
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
    
    # Create database with existing user as owner
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || {
        log_error "Failed to create database"
        return 1
    }
    
    # Grant privileges
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" || true
    sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" || true
    
    log_success "Database ${DB_NAME} created successfully"
}

setup_system_user() {
    log_section "Setting Up System User"
    
    if ! id "${APP_USER}" &>/dev/null; then
        log_info "Creating system user: ${APP_USER}"
        useradd --system --home-dir "${APP_DIR}" --shell /bin/false "${APP_USER}"
    else
        log_info "System user ${APP_USER} already exists"
    fi
    
    # Create group if needed
    if ! getent group "${APP_GROUP}" &>/dev/null; then
        groupadd "${APP_GROUP}"
    fi
    
    # Add user to group
    usermod -a -G "${APP_GROUP}" "${APP_USER}"
    
    log_success "System user setup complete"
}

deploy_application() {
    log_section "Deploying Application"
    
    log_info "Creating application directory..."
    mkdir -p "${APP_DIR}"
    
    # Copy application files
    if [ -d "${REPO_DIR}" ]; then
    log_info "Copying application files from ${REPO_DIR}..."
    rsync -av \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.next \
        --exclude=dist \
        --exclude="*.log" \
        "${REPO_DIR}/" "${APP_DIR}/"
    else
        log_error "Source directory not found: ${REPO_DIR}"
        exit 1
    fi
    
    # Install dependencies
    log_info "Installing Node.js dependencies..."
    cd "${APP_DIR}"
    npm ci --production=false || {
        log_error "Failed to install dependencies"
        return 1
    }
    
    # Ensure next.config.ts has standalone output
    if [ -f "next.config.ts" ]; then
        if ! grep -q "output: 'standalone'" next.config.ts; then
            log_info "Updating next.config.ts for standalone build..."
            sed -i '/const nextConfig/a\  output: '"'"'standalone'"'"',' next.config.ts
        fi
    fi
    
    # Generate Prisma client (required before build)
    log_info "Generating Prisma client..."
    npx prisma generate || {
        log_error "Failed to generate Prisma client"
        return 1
    }
    
    # Build application
    log_info "Building application..."
    npm run build || {
        log_error "Failed to build application"
        log_info "Check build logs above for details"
        return 1
    }
    
    # Verify standalone build
    if [ ! -f "${APP_DIR}/.next/standalone/server.js" ]; then
        log_error "Standalone build not found"
        return 1
    fi
    
    log_success "Application deployed successfully"
}

initialize_database() {
    log_section "Initializing Database"
    
    cd "${APP_DIR}"
    
    log_info "Running Prisma migrations..."
    npx prisma migrate deploy 2>/dev/null || npx prisma db push || {
        log_error "Failed to run migrations"
        return 1
    }
    
    log_info "Generating Prisma client..."
    npx prisma generate || {
        log_warning "Failed to regenerate Prisma client"
    }
    
    log_info "Creating default admin user..."
    npx ts-node -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: '${ADMIN_EMAIL}' }
    });
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash('${ADMIN_PASSWORD}', 10);
      await prisma.adminUser.create({
        data: {
          email: '${ADMIN_EMAIL}',
          password_hash: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          is_active: true,
          is_default_password: true
        }
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
" 2>/dev/null || log_warning "Could not create admin user with ts-node, trying alternative..."
    
    # Fallback: create admin user using SQL
    if ! PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1 FROM admin_users LIMIT 1" &>/dev/null; then
        log_info "Creating admin user using SQL..."
        ADMIN_PASSWORD_HASH=$(node -e "const bcrypt=require('bcryptjs');console.log(bcrypt.hashSync('${ADMIN_PASSWORD}',10));" 2>/dev/null)
        
        PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "
INSERT INTO admin_users (id, name, email, password_hash, role, is_active, is_default_password, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin User',
  '${ADMIN_EMAIL}',
  '\${ADMIN_PASSWORD_HASH}',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
" 2>/dev/null && log_info "Admin user created successfully" || log_warning "Failed to create admin user"
    fi
    
    log_success "Database initialized"
}

setup_systemd_service() {
    log_section "Setting Up Systemd Service"
    
    local service_file="/etc/systemd/system/${APP_NAME}.service"
    
    log_info "Creating systemd service..."
    cat > "${service_file}" << EOF
[Unit]
Description=SocialBluePro - Lead Management Platform
After=network.target postgresql.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${APP_DIR}
Environment="NODE_ENV=production"
EnvironmentFile=${APP_DIR}/.env
ExecStart=$(which node) ${APP_DIR}/.next/standalone/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ${APP_NAME}.service
    
    log_success "Systemd service created and enabled"
}

setup_firewall() {
    log_section "Configuring Firewall"
    
    log_info "Configuring UFW..."
    
    # Default policies
    ufw --force default deny incoming
    ufw --force default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp comment 'SSH'
    
    # Allow application port
    ufw allow ${SERVER_PORT}/tcp comment 'SocialBluePro'
    
    # Allow PostgreSQL (if remote access needed)
    if [ "${DB_HOST}" != "localhost" ]; then
        ufw allow 5432/tcp comment 'PostgreSQL'
    fi
    
    # Enable firewall
    ufw --force enable
    
    log_success "Firewall configured"
}

#================================================================================
# UPDATE FUNCTIONS
#================================================================================

create_backup() {
    log_section "Creating Backup Before Update"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="/tmp/${APP_NAME}_update_${timestamp}"
    
    mkdir -p "${backup_path}"
    
    log_info "Backing up application files..."
    tar -czf "${backup_path}/app.tar.gz" \
        -C "${APP_DIR}" . \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=dist \
        --exclude="*.log" \
        --exclude=.git \
        2>/dev/null || {
        log_warning "Failed to backup application files"
        # Try alternative method
        tar -czf "${backup_path}/app.tar.gz" -C "${APP_DIR}" . \
            --exclude=node_modules --exclude=.next --exclude=dist --exclude="*.log" --exclude=.git \
            2>/dev/null || true
    }
    
    log_info "Backing up database..."
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME} \
        | gzip > "${backup_path}/database.sql.gz" 2>/dev/null || {
        log_warning "Failed to backup database"
    }
    
    log_info "Backing up configuration..."
    cp "${APP_DIR}/.env" "${backup_path}/" 2>/dev/null || true
    
    log_success "Backup created at ${backup_path}"
    echo "${backup_path}"
}

update_application() {
    log_section "Updating Application"
    
    cd "${APP_DIR}"
    
    # Load existing credentials from .env if exists
    if [ -f ".env" ]; then
        log_info "Loading existing database credentials from .env..."
        
        # Read full DATABASE_URL
        DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
        
        if [ -n "$DATABASE_URL" ]; then
            # Parse DATABASE_URL: postgresql://user:password@host:port/database
            DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
            DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
            DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\)?.*/\1/p')
            
            # Set defaults if parsing failed
            DB_HOST=${DB_HOST:-localhost}
            DB_PORT=${DB_PORT:-5432}
            DB_USER=${DB_USER:-socialbluepro}
            DB_NAME=${DB_NAME:-socialbluepro}
            
            log_info "Using existing database: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        else
            log_warning "DATABASE_URL not found in .env"
        fi
    else
        log_warning "No existing .env found, will generate new credentials"
    fi
    
    # Stop service (ignore if not exists)
    log_info "Stopping service..."
    systemctl stop ${APP_NAME}.service 2>/dev/null || log_warning "Service not running or not installed"
    
    # Backup
    local backup_path=$(create_backup)
    
    # Pull latest changes (if git repo)
    if [ -d ".git" ]; then
        log_info "Pulling latest changes..."
        git pull origin main || git pull origin master || log_warning "Could not pull changes"
    else
         log_info "Updating application files..."
         rsync -av \
               --exclude=node_modules \
               --exclude=.git \
               --exclude=.next \
               --exclude=dist \
               --exclude="*.log" \
               --exclude=node_modules \
               "${REPO_DIR}/" "${APP_DIR}/" 2>/dev/null || {
             log_error "Failed to sync application files"
             return 1
         }
    fi
    
    # Install dependencies
    log_info "Updating dependencies..."
    npm ci --production=false || {
        log_error "Failed to install dependencies"
        return 1
    }
    
    # Generate Prisma client (required before build)
    log_info "Generating Prisma client..."
    npx prisma generate || {
        log_error "Failed to generate Prisma client"
        return 1
    }
    
    # Ensure next.config.ts has standalone output
    if [ -f "next.config.ts" ]; then
        if ! grep -q "output: 'standalone'" next.config.ts; then
            log_info "Updating next.config.ts for standalone build..."
            sed -i '/const nextConfig/a\  output: '"'"'standalone'"'"',' next.config.ts
        fi
    fi
    
    # Verify database connection and create if needed
    log_info "Verifying database connection..."
    
    # Check if user exists
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null || echo "")
    
    # Check if database exists
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "")
    
    if [ "$USER_EXISTS" != "1" ]; then
        log_warning "Database user ${DB_USER} does not exist, recreating full setup..."
        setup_database || {
            log_error "Failed to setup database"
            return 1
        }
    elif [ "$DB_EXISTS" != "1" ]; then
        log_info "Database ${DB_NAME} does not exist, creating with existing user..."
        create_database_only || {
            log_error "Failed to create database"
            return 1
        }
    fi
    
    # Test connection
    if ! PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1" &>/dev/null; then
        log_error "Cannot connect to database ${DB_NAME} with user ${DB_USER}"
        log_info "Please check your database credentials in ${APP_DIR}/.env"
        return 1
    fi
    
    log_success "Database connection verified"
    
    # Build application
    log_info "Building application..."
    npm run build || {
        log_error "Failed to build application"
        log_info "Check build logs above for details"
        return 1
    }
    
    # Verify standalone build
    if [ ! -f "${APP_DIR}/.next/standalone/server.js" ]; then
        log_error "Standalone build not found"
        return 1
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    npx prisma migrate deploy 2>/dev/null || npx prisma db push || {
        log_error "Failed to run migrations"
        return 1
    }
    
    # Regenerate Prisma client again after migrations
    npx prisma generate
    
    # Setup systemd service (ensure it exists)
    setup_systemd_service
    
    # Start service
    log_info "Starting service..."
    systemctl start ${APP_NAME}.service || {
        log_error "Failed to start service"
        log_info "Check logs: journalctl -u ${APP_NAME} -n 50"
        return 1
    }
    
    log_success "Application updated successfully"
    log_info "Backup saved at: ${backup_path}"
}

#================================================================================
# STARTUP FUNCTIONS
#================================================================================

start_services() {
    log_section "Starting Services"
    
    log_info "Starting ${APP_NAME} service..."
    systemctl start ${APP_NAME}.service
    sleep 3
    
    if systemctl is-active --quiet ${APP_NAME}.service; then
        log_success "Service started successfully"
    else
        log_error "Service failed to start. Check logs: journalctl -u ${APP_NAME} -n 50"
    fi
    
    log_info "Checking service status..."
    systemctl status ${APP_NAME}.service --no-pager || true
}

save_credentials() {
    log_info "Saving credentials securely..."
    
    local credentials_file="/root/${APP_NAME}-credentials.txt"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local access_url="$(hostname -I | awk '{print $1}'):${SERVER_PORT}"
    
    cat > "${credentials_file}" << EOF
# SocialBluePro Installation Credentials
# Generated: ${timestamp}
# ==============================================

ACCESS INFORMATION
-----------------
Application URL: http://${access_url}
Database URL:    postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}

ADMIN CREDENTIALS
-----------------
Email:    ${ADMIN_EMAIL}
Password: ${ADMIN_PASSWORD}

DATABASE CREDENTIALS
--------------------
Database Name:     ${DB_NAME}
Database User:     ${DB_USER}
Database Password: ${DB_PASSWORD}
Database Host:     ${DB_HOST}
Database Port:     ${DB_PORT}

APPLICATION CONFIGURATION
--------------------------
App Directory:     ${APP_DIR}
Config File:       ${APP_DIR}/.env
Service Name:      ${APP_NAME}

USEFUL COMMANDS
--------------
Start service:     sudo systemctl start ${APP_NAME}
Stop service:      sudo systemctl stop ${APP_NAME}
Restart service:  sudo systemctl restart ${APP_NAME}
View logs:         sudo journalctl -u ${APP_NAME} -f
Status:            sudo systemctl status ${APP_NAME}
EOF
    
    chmod 600 "${credentials_file}"
    log_success "Credentials saved to: ${credentials_file}"
}

print_credentials() {
    log_section "Installation Complete!"
    
    # Save credentials to file
    save_credentials
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           SOCIALBLUEPRO INSTALLATION COMPLETE               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local access_url="$(hostname -I | awk '{print $1}'):${SERVER_PORT}"
    
    echo -e "${BLUE}Access Information:${NC}"
    echo "  URL:           http://${access_url}"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANT: Credentials saved to /root/${APP_NAME}-credentials.txt ⚠️${NC}"
    echo ""
    echo "  Admin Email:      ${ADMIN_EMAIL}"
    echo "  Admin Password:   ${ADMIN_PASSWORD}"
    echo ""
    echo "  Database Name:     ${DB_NAME}"
    echo "  Database User:     ${DB_USER}"
    echo "  Database Password: ${DB_PASSWORD}"
    echo ""
    
    if [ -f "${APP_DIR}/.env" ]; then
        echo "  Configuration:    ${APP_DIR}/.env"
    fi
    
    echo ""
    echo "  Credentials File: /root/${APP_NAME}-credentials.txt"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  Start service:    sudo systemctl start ${APP_NAME}"
    echo "  Stop service:     sudo systemctl stop ${APP_NAME}"
    echo "  Restart service:  sudo systemctl restart ${APP_NAME}"
    echo "  View logs:        sudo journalctl -u ${APP_NAME} -f"
    echo ""
    
    echo -e "${GREEN}Full installation log: ${LOG_FILE}${NC}"
    echo ""
}

#================================================================================
# ROLLBACK FUNCTIONS
#================================================================================

rollback_from_backup() {
    local backup_path="$1"
    
    if [ -z "${backup_path}" ] || [ ! -d "${backup_path}" ]; then
        log_error "Invalid backup path for rollback"
        return 1
    fi
    
    log_section "Rolling Back to Backup"
    
    log_info "Stopping service..."
    systemctl stop ${APP_NAME}.service 2>/dev/null || true
    
    if [ -f "${backup_path}/app.tar.gz" ]; then
        log_info "Restoring application files from backup..."
        rm -rf "${APP_DIR}/.next" 2>/dev/null || true
        tar -xzf "${backup_path}/app.tar.gz" -C "${APP_DIR}" 2>/dev/null || true
    fi
    
    if [ -f "${backup_path}/.env" ]; then
        log_info "Restoring configuration from backup..."
        cp "${backup_path}/.env" "${APP_DIR}/" 2>/dev/null || true
        chmod 600 "${APP_DIR}/.env" 2>/dev/null || true
    fi
    
    if [ -f "${backup_path}/database.sql.gz" ]; then
        log_info "Restoring database from backup..."
        gunzip -c "${backup_path}/database.sql.gz" 2>/dev/null | \
            PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" 2>/dev/null || true
    fi
    
    log_info "Attempting to rebuild application..."
    cd "${APP_DIR}" 2>/dev/null && {
        npm ci --production=false 2>/dev/null || true
        npx prisma generate 2>/dev/null || true
        npm run build 2>/dev/null || true
    }
    
    log_warning "Rollback completed. Please check the application manually."
    log_info "Backup location: ${backup_path}"
}

#================================================================================
# MAIN INSTALLATION FLOW
#================================================================================

main() {
    log_section "SocialBluePro Installer v${SCRIPT_VERSION}"
    
    local BACKUP_PATH=""
    local ERROR_OCCURRED=false
    
    # Initial checks
    check_root
    detect_os
    check_prerequisites
    check_source_directory
    
    # Detect installation type
    if check_existing_installation; then
        UPDATE_MODE=true
        log_warning "Running in UPDATE mode"
        log_info "Existing installation will be updated"
        
        read -p "Continue with update? [y/N]: " confirm
        if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
            log_info "Update cancelled by user"
            exit 0
        fi
        
        # For updates, secrets are loaded from existing .env, not generated
        # generate_secrets is NOT called here
        
        # Update with error handling
        if ! update_application; then
            ERROR_OCCURRED=true
            log_error "Update failed! Check logs above."
            
            # Try rollback if backup exists
            if [ -n "${BACKUP_PATH}" ] && [ -d "${BACKUP_PATH}" ]; then
                read -p "Rollback to previous backup? [y/N]: " rollback_confirm
                if [[ "${rollback_confirm}" =~ ^[Yy]$ ]]; then
                    rollback_from_backup "${BACKUP_PATH}"
                fi
            fi
            
            exit 1
        fi
        
        start_services || {
            log_error "Service failed to start after update"
            exit 1
        }
        
        print_credentials
        
    else
        UPDATE_MODE=false
        log_info "Running in CLEAN INSTALL mode"
        
        # Generate secrets for clean install
        generate_secrets
        
        # Full installation with error handling
        install_dependencies || { log_error "Failed to install dependencies"; exit 1; }
        setup_database || { log_error "Failed to setup database"; exit 1; }
        setup_system_user || { log_error "Failed to setup system user"; exit 1; }
        deploy_application || { log_error "Failed to deploy application"; exit 1; }
        save_configuration || { log_error "Failed to save configuration"; exit 1; }
        
        # Create backup before database initialization for rollback
        BACKUP_PATH="/tmp/${APP_NAME}_install_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${BACKUP_PATH}"
        cp "${APP_DIR}/.env" "${BACKUP_PATH}/" 2>/dev/null || true
        
        initialize_database || {
            log_error "Failed to initialize database"
            read -p "Rollback installation? [y/N]: " rollback_confirm
            if [[ "${rollback_confirm}" =~ ^[Yy]$ ]]; then
                log_info "Cleaning up failed installation..."
                rm -rf "${APP_DIR}"
                systemctl stop ${APP_NAME}.service 2>/dev/null || true
                rm -f /etc/systemd/system/${APP_NAME}.service
                systemctl daemon-reload
            fi
            exit 1
        }
        
        setup_systemd_service || { log_error "Failed to setup systemd service"; exit 1; }
        setup_firewall || { log_warning "Failed to setup firewall, continuing..."; }
        
        start_services || {
            log_error "Service failed to start after installation"
            exit 1
        }
        
        print_credentials
    fi
    
    log_section "Installation/Update Complete"
    exit 0
}

# Trap errors
error_handler() {
    local line_number=$1
    log_error "Installation failed at line ${line_number}"
    
    if [ "${UPDATE_MODE}" = "true" ] && [ -n "${BACKUP_PATH}" ] && [ -d "${BACKUP_PATH}" ]; then
        log_error "Attempting automatic rollback..."
        rollback_from_backup "${BACKUP_PATH}"
    fi
}

trap 'error_handler $LINENO' ERR

# Run main function
main "$@"
