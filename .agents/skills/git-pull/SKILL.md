---
name: git-pull
description: >-
  Subir todos los cambios locales a GitHub (git add, commit, push) y ejecutar el despliegue automático en el VPS (deploy.sh) vía SSH. Usar cuando el usuario pida "git-pull", "git pull", "desplegar", "deploy" o "desplegar a producción".
---

# Skill de Despliegue Automático (`git-pull`)

Permite empaquetar, enviar cambios a GitHub y desplegar automáticamente en el VPS Linux.

## Regla Estricta de Trabajo
**IMPORTANTE:** Durante el desarrollo normal, **SÓLO** guarda los cambios de forma local en los archivos del sistema. **NUNCA** ejecutes commits automáticos, pushes, ni despliegues en el VPS sin autorización explícita. El código sólo se subirá y desplegará cuando el usuario dé el "OK" definitivo o pida explícitamente ejecutar esta skill (`git-pull`, `deploy`, etc).

## Pasos de Ejecución

1. **Git Status & Commit**:
   - Ejecutar `git status` para revisar archivos modificados.
   - Ejecutar `git add .` para incluir todas las actualizaciones pendientes.
   - Crear el commit: `git commit -m "<mensaje explicativo>"`.

2. **Git Push**:
   - Ejecutar `git push origin main`.

3. **Ejecutar Despliegue en VPS**:
   - Al completar el push con éxito, ejecutar:
     ```bash
     ssh root@179.199.138.175 "bash /var/www/sucursal-virtual/deploy.sh"
     ```

4. **Reportar Resultado**:
   - Notificar el éxito de la compilación de `frontend-client`, `frontend-admin`, reinicio del backend en PM2 y reload de Nginx.
