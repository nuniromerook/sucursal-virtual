---
trigger: always_on
description: Guía obligatoria de voz, comunicación, voseo argentino, puntuación y vocabulario real de Abastecedora Valette para toda la app (UI, modales, banners, notificaciones y copy comercial).
---

# Voz y Comunicación — Abastecedora Valette

Esta regla está **siempre activa** y aplica a todo texto visible para clientes o equipo en `client/`, `admin/`, `backend/` (mensajes de usuario) y piezas de comunicación/marketing.

## 1. Idioma y Voseo (100% Argentino Real)
- Escribir siempre en **español rioplatense real**, nunca en español neutro ni corporativo.
- Usar **voseo natural** en contextos reales (*"no te podés perder esto"*, *"podés dejar tu pedido para mañana"*, *"elegí el corte"*, *"avisame si necesitás..."*).
- **Nunca tratar de usted** (*"no se puede perder"*, *"su pedido ha sido procesado"*) ni usar verbos neutros (*"disfruta"*, *"añade"*, *"selecciona"*).

## 2. Puntuación Propia de Valette
- **NO abrir signos de interrogación ni exclamación (`¿`, `¡`)**: cerrarlos únicamente al final (`?`, `!`).
  - Bien: `"Cómo estás?"`, `"Qué vas a pedir hoy?"`, `"Nuevos Combos!"`, `"Buen día!"`.
  - Mal: `"¿Cómo estás?"`, `"¡Nuevos Combos!"`.
- **Sí abrir y cerrar** los signos estructurales obvios: comillas (`"..."`) y paréntesis (`(...)`).

## 3. Tono Natural, Tranqui y Útil (Sin Humo)
- **Juvenil pero para todos los públicos:** cercano, claro y cotidiano. Debe sonar creíble tanto para alguien que cocina todos los días en casa como para clientes exigentes o **carniceros profesionales**.
- **Sin sobre-actuar:** evitar frases melosas o forzadas (*"hacerte un rico asado"*, *"disfrutá una experiencia"*). De última algo natural y puntual (*"hacerte un asadazo"*), sin abusar de muletillas ni lunfardo artificial.
- **Hablar como la gente compra carne, no como un manual técnico ni una IA:**
  - Preferir el nombre cotidiano que entiende el cliente con un dato útil real.
  - **Ejemplo de referencia real:** decimos **"chorizo puro cerdo"** porque se elabora con la carne picada de cerdo más magra que trabajamos, pero en casa la gente dice *"puro cerdo"*, no *"magro"*.
- **Si una descripción no aporta un dato real e importante (rendimiento, preparación, composición, horario, ahorro), se acorta o se elimina.**

## 4. Lenguaje Inclusivo / Sin Asumir Género
- Nunca asumir género en saludos ni etiquetas automáticas.
- Prohibido: `"Hola invitado"`, `"Bienvenido"`, `"Estimado cliente"`.
- Usar siempre formas neutras y naturales: `"Buen día!"`, `"Buenas tardes!"`, `"Buenas noches!"`, `"Hola!"`, o con nombre cuando hay sesión (`"Buen día, {Nombre}!"`).

## 5. Lista Negra (Clichés de IA Prohibidos)
No usar bajo ninguna circunstancia:
- `"la grasa justa"` / `"el punto justo"` / `"sazón justa"`
- `"experiencia sensorial"` / `"manjar"` / `"delicia"` / `"explosión de sabor"`
- `"el rey del domingo"` / `"joya parrillera"` / `"sabor inigualable"` / `"irresistible"`
- `"hacerte un rico asado"` / `"elevá tu parrilla"`
- `"cortes seleccionados directo de frigorífico"` (salvo que comunique un dato operativo concreto)
- Cadenas repetitivas de adjetivos vacíos (*"fresco, tierno, jugoso y económico"*).

## 6. Emojis
- **En la interfaz (`client/` y `admin/`):** cero emojis (usar íconos limpios de `lucide-react`).
- **En WhatsApp o redes:** evitar emojis decorativos en exceso; priorizar texto claro y directo.

## 7. Referencia Aprobada por la Marca
- `"Nuevos Combos! — Los cortes de tu preferencia, en un solo click (y con descuento)"`
- `"Ahora estamos cerrados, pero podés dejar tu pedido para mañana."`
- `"Chorizo puro cerdo"`
