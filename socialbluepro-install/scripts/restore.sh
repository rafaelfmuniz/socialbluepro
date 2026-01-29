#!/bin/bash

# SocialBluePro Restore Script
# Usage: ./restore.sh <backup_path>

set -e

APP_NAME="socialbluepro"
APP_DIR="/opt/${APP_NAME}"
BACKUP_PATH="${1}"

if [ -z "${BACKUP_PATH}" ]; then
    echo "Usage: $0 <backup_path>"
    echo ""
    echo "Available backups:"
    ls -lh /var/backups/${APP_NAME}/ 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -d "${BACKUP_PATH}" ]; then
    echo "Error: Backup directory not found: ${BACKUP_PATH}"
    exit 1
fi

echo "Restoring from backup: ${BACKUP_PATH}"
read -p "This will overwrite current data. Continue? [y/N]: " confirm
if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Stop service
echo "Stopping service..."
systemctl stop ${APP_NAME}

# Restore application files
if [ -f "${BACKUP_PATH}/app.tar.gz" ]; then
    echo "Restoring application files..."
    rm -rf "${APP_DIR}/.next" 2>/dev/null || true
    tar -xzf "${BACKUP_PATH}/app.tar.gz" -C "${APP_DIR}"
else
    echo "Warning: app.tar.gz not found, skipping application restore"
fi

# Restore configuration
if [ -f "${BACKUP_PATH}/.env" ]; then
    echo "Restoring configuration..."
    cp "${BACKUP_PATH}/.env" "${APP_DIR}/.env"
    chmod 600 "${APP_DIR}/.env"
else
    echo "Warning: .env not found, skipping configuration restore"
fi

# Restore database
if [ -f "${BACKUP_PATH}/database.sql.gz" ]; then
    echo "Restoring database..."
    source "${APP_DIR}/.env"
    
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\)?.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    # Drop and recreate database
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" postgres \
        -c "DROP DATABASE IF EXISTS ${DB_NAME};" || true
    
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" postgres \
        -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || true
    
    # Restore database
    gunzip -c "${BACKUP_PATH}/database.sql.gz" | \
        PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"
else
    echo "Warning: database.sql.gz not found, skipping database restore"
fi

# Rebuild application
echo "Rebuilding application..."
cd "${APP_DIR}"
npm ci --production=false
npm run build
npx prisma generate

# Start service
echo "Starting service..."
systemctl start ${APP_NAME}
sleep 3

# Check status
if systemctl is-active --quiet ${APP_NAME}; then
    echo "Restore completed successfully!"
    echo "Service is running"
else
    echo "Warning: Service may not have started correctly. Check logs: journalctl -u ${APP_NAME} -n 50"
fi

echo ""
echo "Restore complete from: ${BACKUP_PATH}"
