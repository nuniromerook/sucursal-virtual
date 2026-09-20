#!/usr/bin/env bash
# scripts/backup-db.sh
# Script automatizado de respaldo para la base de datos PostgreSQL de Abastecedora Valette

set -e

BACKUP_DIR="/var/backups/postgresql/valette"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="valette_db_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"

# Cargar variables de entorno si el archivo backend/.env existe
ENV_FILE="/var/www/sucursal-virtual/backend/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source <(grep -v '^#' "$ENV_FILE" | sed -e 's/\r$//')
  set +a
fi

DB_NAME="${DB_NAME:-valette_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "$BACKUP_DIR"

echo "📦 [$(date)] Iniciando respaldo de la base de datos '${DB_NAME}'..."

if [ -n "$DATABASE_URL" ]; then
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_PATH"
elif [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="${DB_PASSWORD}"
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_PATH"
  unset PGPASSWORD
else
  sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_PATH"
fi

# Verificar tamaño del archivo
FILESIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "✅ [$(date)] Respaldo completado exitosamente: ${BACKUP_PATH} (${FILESIZE})"

# Política de retención: Eliminar respaldos con más de 14 días de antigüedad
echo "🧹 [$(date)] Aplicando política de retención (14 días)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "valette_db_*.sql.gz" -mtime +14 -print -delete | wc -l)
echo "🗑️ [$(date)] Archivos antiguos eliminados: ${DELETED_COUNT}"
