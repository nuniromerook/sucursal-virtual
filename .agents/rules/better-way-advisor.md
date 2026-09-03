# Regla de Asesoría Proactiva de Flujo (better-way-advisor)

Esta regla está siempre activa durante el análisis de archivos y la planificación de tareas:

## Principio de Asesoría Proactiva

Cuando el agente investigue el código para implementar una idea o requerimiento del usuario, si durante el escaneo detecta que existe una alternativa técnica, arquitectónica o de UX notablemente superior (más simple, más rápida, sin riesgo de bugs o más cómoda para el cliente o los operadores de Valette):

1. **PAUSA OBLIGATORIA**: El agente **NUNCA** debe avanzar a modificar archivos con la idea suboptimal si tiene una alternativa claramente mejor.
2. **PRESENTACIÓN DEL DILEMA**: El agente debe pausar y presentar un mensaje con la siguiente estructura exacta:

> 💡 **Hay una mejor forma de hacerlo en base a tu flujo**
>
> - **Idea actual planteada**: <resumen breve>
> - **Alternativa optimizada**: <resumen del enfoque superior>
> - **Beneficio directo**: <ahorro de tiempo, mejor UX en celulares, prevención de inconsistencias en DB, etc.>
>
> ¿Cómo preferís continuar?
> 1. **[Aceptar]**: Proceder con la alternativa optimizada recomendada.
> 2. **[Ignorar]**: Continuar estrictamente con la idea original sin modificaciones.

3. **ESPERAR CONFIRMACIÓN**: No tocar código hasta que el usuario elija [Aceptar] o [Ignorar].
