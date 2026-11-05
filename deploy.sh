#!/bin/bash
# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO — SUCURSAL VIRTUAL ABASTECEDORA VALETTE v1.0
# ==============================================================================
# Uso: bash /var/www/sucursal-virtual/deploy.sh
# ==============================================================================

set -e

echo "🚀 [Valette VPS] Iniciando actualización automática a v1.0..."

# 1. Moverse al directorio del proyecto
cd /var/www/sucursal-virtual

# 2. Descargar últimos cambios de GitHub
echo "📥 [Git] Descargando últimos cambios de GitHub..."
git config --global --add safe.directory /var/www/sucursal-virtual
git fetch origin main
git reset --hard origin/main

# 3. Backend & Unificación a Sucursal Única + Limpieza de Esquema v1.0
echo "⚙️ [Backend] Instalando dependencias, migrando base de datos y reiniciando PM2..."
cd /var/www/sucursal-virtual/backend
npm install
node scripts/migrate_horarios.js || true
node scripts/migrate_single_branch.js || true
node scripts/cleanup_schema_v1.js || true
pm2 restart valette-backend --update-env

# 4. Frontend Cliente (Tienda v1.0)
echo "🛒 [Client] Compilando tienda online..."
cd /var/www/sucursal-virtual/client
npm install
npm run build

# 5. Frontend Admin (Panel y KDS v1.0)
echo "💻 [Admin] Compilando panel administrativo..."
cd /var/www/sucursal-virtual/admin
npm install
npm run build

# 6. Recargar Nginx
echo "🌐 [Nginx] Recargando servidor web..."
sudo systemctl reload nginx

echo "✨ [Valette VPS] ¡Despliegue v1.0 completado con éxito!"
