# Regla de Despliegue Automático (git-pull / desplegar a producción) — v1.0

Cuando el usuario escriba `git-pull`, `git pull`, `desplegar`, `desplegar a producción` o solicite subir los cambios y actualizar el servidor:

1. **Git Local**:
   - Verificar cambios pendientes con `git status`.
   - Realizar `git add -A` si hay archivos modificados o creados.
   - Generar un commit explicativo: `git commit -m "<resumen de cambios>"`.
   - Subir la rama a GitHub: `git push origin main` (y `git push v2 main` si el remoto de respaldo está configurado).

2. **Despliegue VPS (onSuccess)**:
   - Al confirmarse el `push` exitoso, ejecutar el script de despliegue en el VPS vía SSH:
     ```bash
     ssh -o BatchMode=yes root@179.199.138.175 "bash /var/www/sucursal-virtual/deploy.sh"
     ```

3. **Verificación**:
   - Informar al usuario el estado de la compilación de `client` y `admin`, el reinicio de `valette-backend` en PM2 y la recarga de Nginx.
