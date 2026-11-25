---
trigger: always_on
description: Criterios obligatorios de diseño digital, estética y producto para todas las generaciones de UI, modales, formularios y recursos visuales de Abastecedora Valette.
---

# Criterios de Diseño Digital y Producto — Abastecedora Valette (v1.0+)

Esta regla está **siempre activa** y es obligatoria para **todas las generaciones** (código UI, pantallas, modales, formularios, drawers, componentes nuevos y maquetas/imágenes) en `client/` y `admin/`.

## 1. Identidad y Tono Visual
- **Público y liderazgo joven (~25 años):** Diseño fresco, contemporáneo, ágil y profesional (referencia: apps modernas de delivery/ecommerce nativas como Mercado Libre o PedidosYa, con vida, dinamismo, comodidad visual y estímulos medidos sin abrumar).
- **Base de UI aprobada (10/10):** Conservar el sistema visual actual de botones, sombras (`shadow-native`, `shadow-2xs`), radios (`rounded-2xl`, `rounded-3xl`, `rounded-t-4xl`) y contadores/steppers — no reinventar ni romper estos patrones.
- **PROHIBIDO el diseño antiguo en heroes y cabeceras:** Evitar bloques oscuros con gradientes pesados y cajitas recargadas en lugar de la fotografía real del producto/combo, subtítulos obvios o redundantes y saturación de información.
- **Cero emojis en la interfaz:** Reemplazar emojis (`🥩`, `🛵`, `🎉`, `⚠️`, etc.) por íconos vectoriales limpios (`lucide-react`) y badges tipográficos sobrios para mantener un nivel visual profesional y contemporáneo.
- **Menos es más (sin saturar):** Cada elemento debe existir por una razón clara de **estrategia, comodidad o flujo de compra**. Si un texto, ícono o caja no ayuda a decidir ni a comprar más cómodo, se elimina.

## 2. Consistencia de Medios y Modales
- **Imágenes protagonistas en `aspect-video`:** Cuando un combo o producto tiene foto real, mostrarla arriba con protagonismo en el mismo formato `aspect-video` que la card, evitando saltos de layout (CLS).
- **Modales apilables coherentes:** Usar `useModalBehavior`, header uniforme con botones circulares (`ChevronLeft` volver / `X` cerrar), altura con unidades dinámicas (`dvh`), `overscroll-contain` y CTA fijo orientado a conversión en la base.
- **Rendimiento móvil 60fps:** **NUNCA** usar `backdrop-blur` en ningún componente.

## 3. Datos Reales (Cero Fallbacks Falsos)
- **No inventar ni mostrar datos mock silenciosos** (como arreglos hardcodeados de combos o direcciones ficticias de la sucursal) cuando falla la API o no hay datos cargados.
- Preferir **skeleton limpio** mientras carga, **estado de error con botón de reintentar** si falla la red, u **ocultar la sección** si no hay ítems activos en PostgreSQL.
