---
name: code-audit
description: >-
  Escanear y auditar el proyecto completo (frontend cliente, frontend admin y backend) en búsqueda de mejoras, optimizaciones de rendimiento, cuellos de botella y posibles bugs o vulnerabilidades. Usar cuando el usuario pida "auditar", "escanear", "scan", "analizar código" o "buscar optimizaciones".
---

# Skill de Auditoría y Optimización de Código (code-audit)

Esta skill ejecuta un escaneo integral del proyecto para identificar oportunidades de mejora técnica, velocidad de carga y estabilidad.

## Procedimiento de Ejecución

1. **Auditoría de Frontend (Cliente y Admin)**:
   - Verificar tamaño y chunks generados mediante 
pm run build.
   - Detectar componentes que usan efectos costosos en GPU/CPU móvil (blur excesivo, animaciones pesadas).
   - Revisar gestión de estados y dependencias en hooks (useEffect, useCallback, useMemo).
   - Identificar llamadas duplicadas a la API o estados no sincronizados.

2. **Auditoría de Backend (Node.js & Express)**:
   - Revisar queries SQL: detectar consultas SELECT * innecesarias, joins pesados o falta de índices.
   - Validar manejo de errores con 	ry/catch y respuestas HTTP consistentes.
   - Revisar eventos de Socket.io y WebPush para evitar memory leaks o salas huérfanas.

3. **Presentación del Informe**:
   - Clasificar hallazgos en 3 categorías:
     - 🔴 **Crítico**: Riesgo de error en producción o caída de rendimiento evidente.
     - 🟡 **Mejora**: Optimización que mejorará la velocidad o legibilidad.
     - 🟢 **Sugerencia**: Buena práctica de arquitectura a futuro.
   - Presentar un plan de acción concreto con las soluciones propuestas.
