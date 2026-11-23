# Regla de Despliegue Automático (git-pull / desplegar a producción)

Cuando el usuario escriba `git-pull`, `git pull`, `desplegar`, `desplegar a producción` o solicite subir los cambios y actualizar el servidor:

1. **Git Local**:
   - Verificar cambios pendientes con `git status`.
   - Realizar `git add .` si hay archivos modificados o creados.
   - Generar un commit explicativo: `git commit -m "<resumen de cambios>"`.
   - Subir la rama a GitHub: `git push origin main`.

2. **Despliegue VPS (onSuccess)**:
   - Al confirmarse el `push` exitoso, ejecutar el script de despliegue en el VPS vía SSH:
     ```bash
     ssh root@179.199.138.175 "bash /var/www/sucursal-virtual/deploy.sh"
     ```

3. **Verificación**:
   - Informar al usuario el estado de la compilación y reinicio de servicios en el servidor.
