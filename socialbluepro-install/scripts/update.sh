#!/bin/bash

# SocialBluePro Standalone Update Script
# Usage: ./update.sh

set -e

APP_NAME="socialbluepro"
APP_DIR="/opt/${APP_NAME}"
INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting SocialBluePro update..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./update.sh"
    exit 1
fi

# Check if application is installed
if [ ! -d "${APP_DIR}" ]; then
    echo "Error: Application not found at ${APP_DIR}"
    echo "Please run install.sh first"
    exit 1
fi

# Stop service
echo "Stopping service..."
systemctl stop ${APP_NAME} || true

# Create backup
echo "Creating backup..."
BACKUP_PATH="/tmp/${APP_NAME}_update_${TIMESTAMP}"
mkdir -p "${BACKUP_PATH}"

# Backup application
tar -czf "${BACKUP_PATH}/app.tar.gz" \
    -C "${APP_DIR}" \
    . \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' || true

# Backup database
if [ -f "${APP_DIR}/.env" ]; then
    source "${APP_DIR}/.env"
    
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\)?.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" \
        | gzip > "${BACKUP_PATH}/database.sql.gz" || true
fi

echo "Backup created at: ${BACKUP_PATH}"

# Update application files
echo "Updating application..."
REPO_DIR="${INSTALLER_DIR}/../prod"

if [ -d "${REPO_DIR}" ]; then
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='.next' \
          --exclude='*.log' --exclude='.env' "${REPO_DIR}/" "${APP_DIR}/"
else
    echo "Warning: Source directory not found at ${REPO_DIR}"
    echo "Skipping application update"
fi

# Install dependencies
echo "Installing dependencies..."
cd "${APP_DIR}"
npm ci --production=false

# Build application
echo "Building application..."
npm run build

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start service
echo "Starting service..."
systemctl start ${APP_NAME}
sleep 3

# Check status
if systemctl is-active --quiet ${APP_NAME}; then
    echo "Update completed successfully!"
    echo "Service is running"
else
    echo "Warning: Service may not have started correctly"
    echo "Check logs: journalctl -u ${APP_NAME} -n 50"
    echo ""
    echo "You can restore from backup:"
    echo "  /opt/socialbluepro-install/scripts/restore.sh ${BACKUP_PATH}"
fi

echo ""
echo "Update complete"
echo "Backup: ${BACKUP_PATH}"
