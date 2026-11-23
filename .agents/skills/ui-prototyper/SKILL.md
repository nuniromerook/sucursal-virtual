---
name: ui-prototyper
description: >-
  Diseña y genera prototipos interactivos en HTML con Tailwind CSS para previsualizar componentes y vistas (product cards, banners, filtros, checkout, KDS) antes de tocarlos en React. Utiliza la identidad visual de Abastecedora Valette (#003366, #c53030), datos reales del catálogo e iconos SVG estilo Lucide. Usar cuando el usuario pida "generar variantes de diseño", "maquetar componente", "probar estilos de...", "hacer prototipo visual" o iterar interfaces en Antigravity.
---

# UI Prototyper — Abastecedora Valette

Skill especializada en diseñar, maquetar y prototipar interfaces de usuario interactivas en HTML para el proyecto **Sucursal Virtual** de Abastecedora Valette. Permite explorar múltiples propuestas visuales en el visor interactivo de Antigravity antes de comprometer cambios en el código de producción (React 19 / Tailwind v4).

---

## 1. Cuándo se activa esta Skill

Activar automáticamente cuando el usuario solicite:
- *"Generame X estilos / variantes de [componente]..."* (ej: product cards, banners publicitarios, barra de navegación, modal de carrito, checkout).
- *"Quiero mejorar el diseño de X pero primero mostrame opciones para comparar"*.
- *"Maquetá una propuesta más limpia, moderna o profesional de [pantalla]"*.
- *"Hagamos pruebas de diseño en HTML antes de pasarlo a React"*.

---

## 2. Principios de Diseño e Identidad de Marca (Valette)

Al generar prototipos, respetar la identidad visual de la carnicería:

- **Paleta de Colores de Marca:**
  - **Azul Institucional:** `#003366` (`bg-[#003366]`, `text-[#003366]`, azul marino sobrio y confiable).
  - **Rojo Carnicería / Ofertas:** `#c53030` o `#dc2626` (para badges de descuento `% OFF`, etiquetas de oferta o alertas de sin stock).
  - **Dorado / Puntos Club:** `#d97706` o `#f59e0b` (para recompensas de puntos y fidelidad).
  - **Superficies & Fondos:** `#ffffff` (tarjetas), `#f8fafc` o `#f1f5f9` (fondos de página/contenedor), `#e2e8f0` (bordes sutiles).
  - **Texto & Jerarquía:** `#0f172a` (título principal), `#334155` (precios/subtítulos), `#64748b` (unidad de medida, notas secundarias).
- **Tipografía & Bordes:** Fuentes limpias sans-serif (`font-sans`), bordes redondeados modernos (`rounded-xl` a `rounded-2xl`), sombras suaves (`shadow-xs` a `shadow-md`), estados hover con transiciones suaves (`transition-all duration-200`).
- **Datos Reales de Carnicería:** No usar texto genérico ("Lorem Ipsum"). Usar cortes reales (*Vacío, Asado Criollo, Bife de Chorizo, Milanesas de Peceto, Bola de Lomo*), unidades reales (*kg, unidad, bandeja*), precios en pesos argentinos (`$11.900/kg`) y promos de volumen (*"Llevando 3kg o más: \$10.500/kg"*).

---

## 3. Reglas Técnicas y Restricciones del Entorno Antigravity

1. **Tailwind CSS sin dependencias externas bloqueadas:**
   Debido a las políticas CSP de Antigravity, **no se deben cargar CDNs externos generales**. Se debe utilizar el script de Tailwind provisto por el entorno en el `<head>`:
   ```html
   <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
   ```

2. **Iconos Lucide (SVG Nativos Inline):**
   Para garantizar que los iconos de `lucide-react` se vean exactamente igual y no dependan de scripts externos, embeber los SVGs limpios con la estructura Lucide estándar:
   ```html
   <!-- Ejemplo: Icono Carrito Lucide -->
   <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
     <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
   </svg>

   <!-- Ejemplo: Icono Corazón / Favorito Lucide -->
   <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
   </svg>

   <!-- Ejemplo: Icono Destello / Sparkles Lucide -->
   <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
   </svg>
   ```

3. **Ubicación de los Artefactos:**
   Guardar siempre el archivo HTML generado en el directorio de artefactos de la conversación actual:
   `<appDataDir>\brain\<conversation-id>/<nombre_prototipo>.html` con `UserFacing: true`.

4. **Visualización:**
   - Para maquetas grandes o comparativas de variantes múltiples: Presentar el archivo HTML como artefacto directo para que el usuario pueda abrirlo en el visor lateral a pantalla completa.
   - Para componentes compactos (menos de 500px de altura): Opcionalmente embeber con `<agent-embed src="file:///<path>"></agent-embed>`.

---

## 4. Estructura Obligatoria de un Prototipo Multivariante (Sandbox)

Cada archivo de maqueta debe estar estructurado como un **Sandbox Interactivo de Comparación**:

1. **Toolbar Superior de Control:**
   - Selector de pestañas para ver una variante aislada o el modo **"Comparar Todas (Grid)"**.
   - Selector de simulación de dispositivo: **Móvil (375px)** vs **Escritorio / Tablet (Full width)**.
   - Switch interactivo de estados: Probar cómo se ve la tarjeta con:
     - *En oferta* (% OFF y precio anterior tachado).
     - *Con promo de volumen* (Llevando 3kg o más).
     - *Sin stock* (Botón deshabilitado y badge de agotado).
     - *Favorito activado*.
2. **Las Variantes de Diseño Bien Diferenciadas:**
   - Proponer entre 3 y 4 enfoques de diseño conceptualmente distintos:
     - **Variante A: Minimalista & Limpio:** Espacios en blanco generosos, bordes ultra finos, micro-detalles sutiles.
     - **Variante B: Comercial / Retail Impactante:** Énfasis fuerte en precios, descuentos, llamadas a la acción claras y badges llamativos.
     - **Variante C: Gourmet / Premium:** Fondo oscuro o contraste profundo, estética de carnicería boutique o asador experto.
     - **Variante D: Compacto / Mobile-First Ultra-Ágil:** Diseñado para pantallas de celular estrechas donde el cliente scrollea rápido y agrega con 1 tap.
3. **Ficha Técnica de cada Variante:**
   - Explicar qué problema resuelve cada propuesta, sus ventajas para conversión y qué micro-interacciones incluye.

---

## 5. Procedimiento de Ejecución Paso a Paso

```
1. Investigar Componente Existente
   └─ Leer el componente actual en el proyecto (ej: ProductCard.jsx) para no perder props ni lógica de negocio.

2. Diseñar el HTML Sandbox
   └─ Crear el archivo HTML autónomo con Tailwind y JavaScript vanilla interactivo.
   └─ Guardar en la carpeta de artefactos de Antigravity.

3. Presentar al Usuario
   └─ Resumir las diferencias clave entre cada variante.
   └─ Invitar a interactuar con los botones, probar los estados y elegir favoritos.

4. Iterar / Afinar
   └─ Recibir el feedback (ej: "Me gusta la tipografía de la B con el botón de la A").

5. Implementar en Producción
   └─ Una vez aprobado, traspasar el código limpio a React 19 / JSX respetando los contextos del proyecto (CartContext, AuthContext).
```
