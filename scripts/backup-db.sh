#!/usr/bin/env bash
# scripts/backup-db.sh
# Script automatizado de respaldo para la base de datos PostgreSQL de Abastecedora Valette

set -e

BACKUP_DIR="/var/backups/postgresql/valette"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="valette_db_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"

DB_NAME="valette_db"

mkdir -p "$BACKUP_DIR"

echo "📦 [$(date)] Iniciando respaldo de la base de datos '${DB_NAME}'..."

# Usar el usuario de sistema postgres (peer auth directo sobre socket unix local)
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_PATH"

# Verificar tamaño del archivo
FILESIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "✅ [$(date)] Respaldo completado exitosamente: ${BACKUP_PATH} (${FILESIZE})"

# Política de retención: Eliminar respaldos con más de 14 días de antigüedad
echo "🧹 [$(date)] Aplicando política de retención (14 días)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "valette_db_*.sql.gz" -mtime +14 -delete -print 2>/dev/null | wc -l)
echo "🗑️ [$(date)] Archivos antiguos eliminados: ${DELETED_COUNT}"
