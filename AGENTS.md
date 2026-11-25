# Reglas del Proyecto — Abastecedora Valette (Sucursal Virtual v1.0+)

## Criterio de Diseño Obligatorio (Siempre Activo)
Todas las generaciones de UI, pantallas, modales, formularios y recursos visuales deben cumplir estrictamente [design-criteria.md](.agents/rules/design-criteria.md):
- Estética joven (~25 años), fresca, limpia y ágil orientada a conversión (estilo Mercado Libre / PedidosYa).
- Conservar la base 10/10 aprobada (botones, sombras `shadow-native`/`shadow-2xs`, radios `rounded-2xl`/`rounded-3xl`, contadores/steppers).
- Prohibido usar cabeceras/heroes pesados con gradientes oscuros en lugar de fotos reales (`aspect-video`) o saturar con texto redundante.
- Prohibido usar `backdrop-blur` en cualquier componente.
- Prohibido usar datos mock o fallbacks silenciosos falsos (preferir skeleton, estado de error con reintentar u ocultar).

## Flujo de Trabajo y Despliegue
- Durante el desarrollo habitual, guardar cambios **solo en local**.
- Nunca ejecutar `git commit`, `git push` ni `deploy.sh` hasta que el usuario solicite explícitamente `git-pull` o desplegar (ver `.agents/rules/deployment.md`).
