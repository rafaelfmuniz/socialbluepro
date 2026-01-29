#!/bin/bash

# SocialBluePro Backup Script
# Usage: ./backup.sh [output_directory]

set -e

APP_NAME="socialbluepro"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="${1:-/var/backups/${APP_NAME}}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

echo "Creating backup at: ${BACKUP_PATH}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Backup application files (excluding node_modules and build artifacts)
echo "Backing up application files..."
tar -czf "${BACKUP_PATH}/app.tar.gz" \
    -C "${APP_DIR}" \
    . \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.git' || true

# Backup database
echo "Backing up database..."
if [ -f "${APP_DIR}/.env" ]; then
    source "${APP_DIR}/.env"
    
    # Parse DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\)?.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" \
        | gzip > "${BACKUP_PATH}/database.sql.gz" || echo "Warning: Database backup failed"
else
    echo "Warning: .env file not found, skipping database backup"
fi

# Backup configuration
echo "Backing up configuration..."
cp "${APP_DIR}/.env" "${BACKUP_PATH}/" 2>/dev/null || true

# Create backup info
cat > "${BACKUP_PATH}/backup_info.txt" << EOF
Backup Information
==================
Date: $(date)
Timestamp: ${TIMESTAMP}
Application: ${APP_NAME}
Version: $(node -p "require('${APP_DIR}/package.json').version" 2>/dev/null || echo "unknown")

Contents:
- app.tar.gz: Application files
- database.sql.gz: Database dump
- .env: Configuration file
EOF

# Set permissions
chmod -R 750 "${BACKUP_PATH}"

echo "Backup completed successfully!"
echo "Backup location: ${BACKUP_PATH}"
du -sh "${BACKUP_PATH}"
