---
name: code-cleanup
description: >-
  Detectar y limpiar código huérfano, imports en desuso, console.logs olvidados y archivos no utilizados. Muestra un resumen previo con las opciones y solicita confirmación antes de aplicar cualquier eliminación. Usar cuando el usuario pida "limpiar código", "code cleanup", "eliminar huérfanos", "purgar código" o "quitar imports en desuso".
---

# Skill de Limpieza de Código Huérfano y Purgado (code-cleanup)

Esta skill analiza el código para eliminar basura técnica, reducir el peso de los paquetes y mantener el proyecto prolijo y mantenible.

## Procedimiento de Ejecución

1. **Fase de Escaneo (Solo Lectura)**:
   - Identificar imports no utilizados en archivos .jsx, .js.
   - Identificar llamadas a console.log o debugger que hayan quedado tras etapas de debugging.
   - Identificar archivos de componentes o utilidades que no sean importados por ningún otro archivo (archivos huérfanos).
   - Identificar bloques grandes de código comentado en desuso.

2. **Fase de Consulta y Resumen al Usuario (OBLIGATORIA)**:
   - **NUNCA borrar directamente sin consultar.**
   - Mostrar un resumen conciso con métricas exactas:
     - 📦 Cantidad de imports sin usar encontrados.
     - 🪵 Cantidad de console.log de prueba detectados.
     - 📄 Archivos huérfanos detectados (si los hay).
   - Preguntar explícitamente al usuario qué desea eliminar antes de proceder (ej: "¿Deseas que proceda a remover los imports sin uso y limpiar los console.logs?").

3. **Fase de Ejecución (Tras Aprobación)**:
   - Aplicar las correcciones quirúrgicas en los archivos identificados.
   - Ejecutar 
pm run build tanto en rontend-client como en rontend-admin para certificar que no se rompieron dependencias ni compilaciones.
   - Si se requiere despliegue posterior, recordar al usuario que puede disparar git-pull.
