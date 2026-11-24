---
name: git-pull
description: >-
  Subir todos los cambios locales a GitHub (git add, commit, push) y ejecutar el despliegue automático en el VPS (deploy.sh) vía SSH. Usar cuando el usuario pida "git-pull", "git pull", "desplegar", "deploy" o "desplegar a producción".
---

# Skill de Despliegue Automático (`git-pull`) — v1.0

Permite empaquetar, enviar cambios a GitHub y desplegar automáticamente **Sucursal Virtual v1.0** en el VPS Linux de Hostinger (`179.199.138.175`).

## Regla Estricta de Trabajo
**IMPORTANTE:** Durante el desarrollo normal, **SÓLO** guarda los cambios de forma local en los archivos del sistema. **NUNCA** ejecutes commits automáticos, pushes, ni despliegues en el VPS sin autorización explícita. El código sólo se subirá y desplegará cuando el usuario dé el "OK" definitivo o pida explícitamente ejecutar esta skill (`git-pull`, `deploy`, etc).

## Pasos de Ejecución

1. **Git Status & Commit**:
   - Ejecutar `git status` en la raíz del proyecto (`sucursal-virtual-v1.0`) para revisar archivos modificados.
   - Si hay cambios pendientes, ejecutar `git add -A` y crear el commit: `git commit -m "<mensaje explicativo>"`.

2. **Git Push**:
   - Ejecutar `git push origin main` (repositorio productivo que consume la VPS).
   - Si existe el remoto de respaldo `v2`, sincronizarlo también con `git push v2 main`.

3. **Ejecutar Despliegue en VPS**:
   - Al completar el push con éxito, ejecutar:
     ```bash
     ssh -o BatchMode=yes root@179.199.138.175 "bash /var/www/sucursal-virtual/deploy.sh"
     ```

4. **Reportar Resultado**:
   - Notificar el éxito de la sincronización de esquema/DB, reinicio de `valette-backend` en PM2, compilación de `client` y `admin` (v1.0) y reload de Nginx.
