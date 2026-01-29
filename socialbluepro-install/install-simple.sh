#!/bin/bash

set -e

APP_NAME="socialbluepro"
APP_DIR="/opt/${APP_NAME}"
INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect source directory
if [ -f "${INSTALLER_DIR}/../package.json" ]; then
    REPO_DIR="${INSTALLER_DIR}/.."
elif [ -f "${INSTALLER_DIR}/../../prod/package.json" ]; then
    REPO_DIR="${INSTALLER_DIR}/../prod"
else
    # Try to find prod directory by looking at parent of installer
    if [ -f "/tmp/prod-socialbluepro/package.json" ]; then
        REPO_DIR="/tmp/prod-socialbluepro"
    else
        REPO_DIR="${INSTALLER_DIR}/../prod"
    fi
fi

echo "Source directory: ${REPO_DIR}"

echo "SocialBluePro Installer v2.0 (Simplified)"
echo "=========================================="
echo ""

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "ERROR: Run as root"
        exit 1
    fi
}

install_dependencies() {
    echo "[1/8] Installing system dependencies..."
    apt-get update -qq
    
    # Install Node.js 20 (required for Prisma 7)
    if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
        echo "Installing Node.js 20.x (required for Prisma 7)..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo "Node.js $(node -v) already installed"
    fi
    
    # Install other dependencies
    apt-get install -y curl wget git build-essential postgresql 2>/dev/null || true
    
    echo "✓ Dependencies installed (Node.js: $(node -v))"
}

setup_database() {
    echo "[2/8] Setting up database..."
    
    # Generate password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    
    # Drop existing if any
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${APP_NAME};" 2>/dev/null || true
    sudo -u postgres psql -c "DROP ROLE IF EXISTS ${APP_NAME};" 2>/dev/null || true
    
    # Create user and database
    sudo -u postgres psql -c "CREATE USER ${APP_NAME} WITH PASSWORD '${DB_PASSWORD}';"
    sudo -u postgres psql -c "CREATE DATABASE ${APP_NAME} OWNER ${APP_NAME};"
    sudo -u postgres psql -c "GRANT ALL ON DATABASE ${APP_NAME} TO ${APP_NAME};"
    
    echo "✓ Database configured: ${APP_NAME}"
}

create_env() {
    echo "[3/8] Creating .env file..."
    
    mkdir -p "${APP_DIR}"
    
    cat > "${APP_DIR}/.env" << EOF
DATABASE_URL="postgresql://${APP_NAME}:${DB_PASSWORD}@localhost:5432/${APP_NAME}?schema=public"
DIRECT_URL="postgresql://${APP_NAME}:${DB_PASSWORD}@localhost:5432/${APP_NAME}?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3000
ENCRYPTION_KEY="$(openssl rand -hex 32)"
EOF
    
    chmod 600 "${APP_DIR}/.env"
    echo "✓ .env created"
}

copy_app() {
    echo "[4/8] Copying application files..."
    
    rm -rf "${APP_DIR:?}"/*
    cp -r "${REPO_DIR}/"* "${APP_DIR}/"
    
    cd "${APP_DIR}"
    
    echo "✓ Files copied to ${APP_DIR}"
}

install_deps() {
    echo "[5/8] Installing Node dependencies..."
    
    cd "${APP_DIR}"
    npm ci --production=false
    
    echo "✓ Dependencies installed"
}

build_app() {
    echo "[6/8] Building application..."
    
    cd "${APP_DIR}"
    
    # Ensure next.config.ts has standalone output
    if [ -f "next.config.ts" ]; then
        if ! grep -q "output: 'standalone'" next.config.ts; then
            echo "  Updating next.config.ts for standalone build..."
            sed -i '/const nextConfig/a\  output: '"'"'standalone'"'"',' next.config.ts
        fi
    fi
    
    npx prisma generate
    npm run build
    
    # Verify build output
    if [ -d "${APP_DIR}/.next/standalone" ]; then
        echo "✓ Standalone build created"
    else
        echo "✗ Standalone build not found"
        echo "Listing .next directory:"
        ls -la "${APP_DIR}/.next/"
        exit 1
    fi
    
    if [ ! -f "${APP_DIR}/.next/standalone/server.js" ]; then
        echo "✗ server.js not found in standalone build"
        exit 1
    fi
    
    echo "✓ Application built successfully"
}

migrate_db() {
    echo "[7/8] Running database migrations..."
    
    cd "${APP_DIR}"
    
    npx prisma migrate deploy 2>/dev/null || npx prisma db push
    npx prisma generate
    
    echo "✓ Migrations completed"
}

create_admin_user() {
    echo "[7/8] Creating default admin user..."
    
    cd "${APP_DIR}"
    
    # Source DB_PASSWORD from .env if not already set
    if [ -z "${DB_PASSWORD}" ] && [ -f ".env" ]; then
        DB_PASSWORD=$(grep "DATABASE_URL" .env | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p' | head -1)
    fi
    
    npx tsx -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: 'admin@socialbluepro.com' }
    });
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.adminUser.create({
        data: {
          email: 'admin@socialbluepro.com',
          password_hash: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          is_active: true,
          is_default_password: true
        }
      });
      console.log('✓ Admin user created successfully');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
" 2>/dev/null || node -e "
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

try {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const dbPassword = '${DB_PASSWORD}';
  const psql = \`PGPASSWORD=\"\${dbPassword}\" psql -h localhost -U socialbluepro -d socialbluepro\`;
  const query = \`
    INSERT INTO admin_users (id, name, email, password_hash, role, is_active, is_default_password, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Admin User',
      'admin@socialbluepro.com',
      '\${hashedPassword}',
      'ADMIN',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;
  \`;
  execSync(\`echo \"\${query}\" | \${psql}\`, { stdio: 'inherit' });
  console.log('✓ Admin user created successfully');
} catch (error) {
  console.error('✗ Could not create admin user:', error.message);
}
"
    
    echo "  Email: admin@socialbluepro.com"
    echo "  Password: admin123"
    echo "  ⚠️  Please change the default password after first login!"
}

create_service() {
    echo "[8/8] Creating systemd service..."
    
    # Verify build output exists
    if [ ! -f "${APP_DIR}/.next/standalone/server.js" ]; then
        echo "✗ Build output not found: ${APP_DIR}/.next/standalone/server.js"
        echo "Trying alternative paths..."
        ls -la "${APP_DIR}/.next/" || true
        exit 1
    fi
    
    cat > "/etc/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=SocialBluePro
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
Environment="NODE_ENV=production"
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/node ${APP_DIR}/.next/standalone/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable ${APP_NAME}
    systemctl start ${APP_NAME}
    
    sleep 5
    
    if systemctl is-active --quiet ${APP_NAME}; then
        echo "✓ Service started successfully"
    else
        echo "✗ Service failed to start"
        echo ""
        echo "Service status:"
        systemctl status ${APP_NAME} --no-pager || true
        echo ""
        echo "Recent logs:"
        journalctl -u ${APP_NAME} -n 30 --no-pager || true
        echo ""
        echo "Try running manually:"
        echo "cd ${APP_DIR}"
        echo "NODE_ENV=production node .next/standalone/server.js"
        exit 1
    fi
}

print_info() {
    echo ""
    echo "=========================================="
    echo " INSTALLATION COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Database Password: ${DB_PASSWORD}"
    echo ""
    echo "Access URL: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "Useful commands:"
    echo "  Start:   systemctl start ${APP_NAME}"
    echo "  Stop:    systemctl stop ${APP_NAME}"
    echo "  Restart: systemctl restart ${APP_NAME}"
    echo "  Logs:    journalctl -u ${APP_NAME} -f"
    echo ""
}

main() {
    check_root
    
    if [ -d "${APP_DIR}" ] && [ -f "${APP_DIR}/package.json" ]; then
        echo "WARNING: Existing installation found at ${APP_DIR}"
        read -p "Continue? This will overwrite everything! [y/N]: " confirm
        if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
            echo "Aborted"
            exit 0
        fi
    fi
    
    install_dependencies
    setup_database
    create_env
    copy_app
    install_deps
    build_app
    migrate_db
    create_admin_user
    create_service
    print_info
}

main "$@"
