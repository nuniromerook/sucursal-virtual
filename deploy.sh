#!/bin/bash
# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO — SUCURSAL VIRTUAL ABASTECEDORA VALETTE
# ==============================================================================
# Uso: bash /var/www/sucursal-virtual/deploy.sh
# ==============================================================================

set -e

echo "🚀 [Valette VPS] Iniciando actualización automática..."

# 1. Moverse al directorio del proyecto
cd /var/www/sucursal-virtual

# 2. Descargar últimos cambios de GitHub
echo "📥 [Git] Descargando últimos cambios de GitHub..."
git config --global --add safe.directory /var/www/sucursal-virtual
git reset --hard origin/main
git pull origin main

# 3. Backend
echo "⚙️ [Backend] Instalando dependencias y reiniciando PM2..."
cd /var/www/sucursal-virtual/backend
npm install
pm2 restart valette-backend --update-env

# 4. Frontend Cliente (Tienda)
echo "🛒 [Frontend Cliente] Compilando tienda online..."
cd /var/www/sucursal-virtual/frontend-client
npm install
npm run build

# 5. Frontend Admin (Panel y KDS TV)
echo "💻 [Frontend Admin] Compilando panel administrativo..."
cd /var/www/sucursal-virtual/frontend-admin
npm install
npm run build

# 6. Recargar Nginx
echo "🌐 [Nginx] Recargando servidor web..."
sudo systemctl reload nginx

echo "✨ [Valette VPS] ¡Despliegue completado con éxito! Todo está en vivo y actualizado."
