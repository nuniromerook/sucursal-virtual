# Regla Centinela de Código y Detección de Anomalías (code-sentinel)

Esta regla está siempre activa durante el desarrollo para alertar proactivamente al usuario si se detectan anomalías o malas prácticas:

## Patrones a Detectar y Alertar Inmediatamente

1. **Seguridad y Base de Datos**:
   - Inyecciones SQL: Alerta si alguna consulta concatena strings en lugar de usar parámetros parametrizados (\, \).
   - Credenciales expuestas: Alerta si se escribe alguna API key, secreto o token fuera de los archivos .env.
   - Control de accesos: Alerta si un endpoint o vista sensible no verifica rol (dmin / encargado).

2. **Rendimiento en Frontend (React / Vite)**:
   - Loops de render: Alerta si un useEffect tiene dependencias faltantes o muta un estado que provoca re-renders continuos.
   - Props drilling excesivo o llamadas innecesarias a la API en bucles de componentes.
   - Uso de efectos visuales pesados (ackdrop-blur en componentes repetitivos) que ralentizan celulares de gama media/baja.

3. **Limpieza e Higiene de Código**:
   - Imports sin usar (unused imports) que inflan el tamaño del bundle.
   - console.log o debugger que hayan quedado olvidados para producción.
   - Código muerto o comentado en bloques grandes sin justificación.
