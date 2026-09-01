-- ESQUEMA Y DATOS EXACTOS DE NEON.TECH
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS metricas_eventos CASCADE;
DROP TABLE IF EXISTS metricas_visitas CASCADE;
DROP TABLE IF EXISTS puntos_historial CASCADE;
DROP TABLE IF EXISTS banners_publicidad CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS cliente_favoritos CASCADE;
DROP TABLE IF EXISTS carrito_items CASCADE;
DROP TABLE IF EXISTS carritos CASCADE;
DROP TABLE IF EXISTS pedido_items CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS stock_sucursal CASCADE;
DROP TABLE IF EXISTS catalogo_promos CASCADE;
DROP TABLE IF EXISTS catalogo CASCADE;
DROP TABLE IF EXISTS catalogo_combos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS sucursales CASCADE;

CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    direccion text NOT NULL,
    ciudad VARCHAR(255) NOT NULL,
    latitud NUMERIC(10,6),
    longitud NUMERIC(10,6),
    telefono VARCHAR(255),
    horario_atencion text,
    horarios_apertura JSONB DEFAULT '{"lunes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "martes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "miercoles": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "jueves": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "viernes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "sabado": {"abierto": true, "apertura": "07:00", "cierre": "15:00"}, "domingo": {"abierto": false, "apertura": "", "cierre": ""}}'::jsonb,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(255) NOT NULL,
    sucursal_id integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    apodo VARCHAR(255),
    telefono VARCHAR(255),
    email VARCHAR(255),
    password text
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    direccion_default text,
    puntos_acumulados integer DEFAULT 0 NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    usuario VARCHAR(255),
    password VARCHAR(255),
    google_id VARCHAR(255),
    avatar_url text,
    perfil_completo boolean DEFAULT false,
    referral_code VARCHAR(255),
    referido_por integer,
    reset_token text,
    reset_token_expires timestamp without time zone
);

CREATE TABLE catalogo (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    descripcion text,
    especie VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    imagen_url text,
    unidad_medida VARCHAR(255) DEFAULT 'kg'::character varying NOT NULL,
    calorias integer,
    proteinas NUMERIC(10,2),
    grasas NUMERIC(10,2),
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    destacar boolean DEFAULT false NOT NULL,
    gana_puntos boolean DEFAULT false NOT NULL,
    puntos integer DEFAULT 0 NOT NULL,
    precio NUMERIC(10,2) DEFAULT 0 NOT NULL,
    precio_anterior NUMERIC(10,2) DEFAULT 0 NOT NULL
);

CREATE TABLE catalogo_promos (
    id SERIAL PRIMARY KEY,
    catalogo_id integer NOT NULL,
    cantidad_kg NUMERIC(10,2) NOT NULL,
    precio_promocional NUMERIC(10,2) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE catalogo_combos (
    id SERIAL PRIMARY KEY,
    combo_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad_kg NUMERIC(10,2) DEFAULT 1 NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE stock_sucursal (
    id SERIAL PRIMARY KEY,
    catalogo_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    disponible_kg NUMERIC(10,2) DEFAULT 0 NOT NULL,
    en_stock boolean DEFAULT true NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    canal VARCHAR(255) DEFAULT 'web'::character varying NOT NULL,
    tipo_entrega VARCHAR(255) NOT NULL,
    fecha_entrega_programada timestamp without time zone,
    estado_local VARCHAR(255) DEFAULT 'solicitado'::character varying NOT NULL,
    estado_envio_pedidosya VARCHAR(255),
    medio_pago VARCHAR(255) NOT NULL,
    pago_confirmado boolean DEFAULT false NOT NULL,
    monto_total_estimado NUMERIC(10,2) DEFAULT 0 NOT NULL,
    monto_total_final NUMERIC(10,2),
    direccion_entrega text,
    notas text,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    cortador_id integer
);

CREATE TABLE pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id integer NOT NULL,
    catalogo_id integer NOT NULL,
    cantidad_kg_solicitada NUMERIC(10,2) NOT NULL,
    precio_por_kg_congelado NUMERIC(10,2) NOT NULL,
    precio_estimado NUMERIC(10,2) NOT NULL,
    peso_real NUMERIC(10,2),
    precio_final NUMERIC(10,2),
    estado_item VARCHAR(255) DEFAULT 'pendiente'::character varying NOT NULL,
    cortador_id integer,
    creado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE carritos (
    id SERIAL PRIMARY KEY,
    sesion_id VARCHAR(255) NOT NULL,
    cliente_id integer,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE carrito_items (
    id SERIAL PRIMARY KEY,
    carrito_id integer NOT NULL,
    catalogo_id integer NOT NULL,
    cantidad_kg NUMERIC(10,2) NOT NULL,
    precio_al_agregar NUMERIC(10,2) NOT NULL,
    promo_precio_al_agregar NUMERIC(10,2),
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE cliente_favoritos (
    id SERIAL PRIMARY KEY,
    cliente_id integer,
    catalogo_id integer,
    creado_en timestamp without time zone DEFAULT now()
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    cliente_id integer,
    sucursal_id integer,
    pedido_id integer,
    titulo VARCHAR(255) NOT NULL,
    mensaje text NOT NULL,
    tipo VARCHAR(255) DEFAULT 'sistema'::character varying NOT NULL,
    icono VARCHAR(255) DEFAULT 'bell'::character varying,
    enlace VARCHAR(255) DEFAULT '/'::character varying,
    leida boolean DEFAULT false,
    estado_pedido VARCHAR(255),
    creada_en timestamp with time zone DEFAULT now()
);

CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    cliente_id integer,
    endpoint text NOT NULL,
    keys jsonb NOT NULL,
    creada_en timestamp with time zone DEFAULT now()
);

CREATE TABLE banners_publicidad (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    imagen_desktop_url text NOT NULL,
    imagen_mobile_url text NOT NULL,
    enlace_url text,
    orden integer DEFAULT 0,
    activo boolean DEFAULT true,
    impresiones integer DEFAULT 0,
    clics integer DEFAULT 0,
    creado_en timestamp without time zone DEFAULT now(),
    subtitulo text DEFAULT ''::text,
    badge_texto VARCHAR(255) DEFAULT ''::character varying,
    badge_color VARCHAR(255) DEFAULT 'rojo'::character varying,
    boton_texto VARCHAR(255) DEFAULT 'Ver más'::character varying
);

CREATE TABLE puntos_historial (
    id SERIAL PRIMARY KEY,
    cliente_id integer NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    puntos integer NOT NULL,
    descripcion text,
    pedido_id integer,
    creado_en timestamp without time zone DEFAULT now()
);

CREATE TABLE metricas_visitas (
    id SERIAL PRIMARY KEY,
    ruta VARCHAR(255) NOT NULL,
    dispositivo VARCHAR(255) DEFAULT 'desktop'::character varying,
    sesion_id VARCHAR(255),
    creado_en timestamp without time zone DEFAULT now()
);

CREATE TABLE metricas_eventos (
    id SERIAL PRIMARY KEY,
    tipo_evento VARCHAR(255) NOT NULL,
    elemento_id VARCHAR(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    creado_en timestamp without time zone DEFAULT now()
);

-- DATA SUCURSALES
INSERT INTO sucursales (id, nombre, slug, direccion, ciudad, latitud, longitud, telefono, horario_atencion, activa, creado_en, actualizado_en) VALUES (1, 'Luis Guillon', 'luis-guillon', 'Av. Luciano Valette 1696', 'Luis Guillon', NULL, NULL, '1135534033', 'Lun a sáb 7 a 15hs', true, '"2026-08-30T14:35:11.718Z"'::jsonb, '"2026-08-30T14:35:11.718Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('sucursales', 'id'), (SELECT COALESCE(MAX(id), 1) FROM sucursales));

-- DATA EMPLEADOS
INSERT INTO empleados (id, nombre, rol, sucursal_id, activo, creado_en, apodo, telefono, email, password) VALUES (1, 'Juan Nuñez', 'admin', 1, true, '"2026-08-31T01:10:50.275Z"'::jsonb, 'Nuni', '1128353615', 'juancnunz.contacto@gmail.com', '587b18e1954ddd828fe0a5986987324a:10000:7a0f9bf6a73a223310af9793a0af4c8851d5b743cba7bae5c8f893d1cf3a691c63970ebea2b1fc5bfffd41c08a6ceb20f1155d4720174325260d8660434b0cec');
INSERT INTO empleados (id, nombre, rol, sucursal_id, activo, creado_en, apodo, telefono, email, password) VALUES (4, 'Juan Pablo Nahunek', 'encargado', 1, true, '"2026-08-31T06:42:46.157Z"'::jsonb, 'Juan', '1153079702', 'juanpn@gmail.com', 'cf7b35582a07b9ac9a664a0eb4d2e177:10000:e41aee953c3e01e21a1793b79355393a7667b920132dbc36aac8c784f37713e9ec9f1ac895dc08a1085ac4c9c551a18f3a813fcd21f782576be8fd0bad674a53');
INSERT INTO empleados (id, nombre, rol, sucursal_id, activo, creado_en, apodo, telefono, email, password) VALUES (5, 'Matias perez', 'cortador', 1, true, '"2026-08-31T06:49:18.754Z"'::jsonb, 'Mati', '1122334455', NULL, NULL);
SELECT setval(pg_get_serial_sequence('empleados', 'id'), (SELECT COALESCE(MAX(id), 1) FROM empleados));

-- DATA CLIENTES
INSERT INTO clientes (id, nombre, telefono, email, direccion_default, puntos_acumulados, creado_en, actualizado_en, usuario, password, google_id, avatar_url, perfil_completo, referral_code, referido_por, reset_token, reset_token_expires) VALUES (1, 'Juan Nuñez', '1128353615', 'juancnunz.contacto@gmail.com', 'J. Tarulli 1474, Luis Guillón, Provincia de Buenos Aires', 400, '"2026-08-30T14:32:56.659Z"'::jsonb, '"2026-08-31T17:58:11.673Z"'::jsonb, 'nuniromerook', 'a9079fe973f6e75d014cf1f54e935339:10000:54e8a623127bf5fef81b56f5da83aaf89d0a2fb4a8f4f94a97cfcfd103ff5b97a5383cf297c466de8a5f987d27b162c5b00eb13abd4ff6a014538e25b39596aa', NULL, NULL, true, '19243', NULL, NULL, NULL);
INSERT INTO clientes (id, nombre, telefono, email, direccion_default, puntos_acumulados, creado_en, actualizado_en, usuario, password, google_id, avatar_url, perfil_completo, referral_code, referido_por, reset_token, reset_token_expires) VALUES (2, 'Prueba', '1100000000', 'prueba@gmail.com', 'Av. del Libertador 3910, Moreno, Provincia de Buenos Aires', 115, '"2026-08-30T14:38:36.320Z"'::jsonb, '"2026-08-30T14:53:21.319Z"'::jsonb, 'prueba', 'ef3fce7927f1973989c5993c95c7d068:10000:ba8d35583710e197513742959abeb627fbe9cfa63f5504f5fa2acf5030120cf06761e6d35f905e5f79a1367257291fe53c7caba93cf2a89299b6b8a58155ee2b', NULL, NULL, true, '64428', 1, NULL, NULL);
SELECT setval(pg_get_serial_sequence('clientes', 'id'), (SELECT COALESCE(MAX(id), 1) FROM clientes));

-- DATA CATALOGO
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (1, 'Asado', 'asado', 'Nuestra tira de asado se destaca por su **excelente calidad**, ofreciendo el equilibrio perfecto entre carne y grasa para asegurar una terneza y un sabor inigualables a las brasas. Ideal para cocinar a fuego lento y compartir.

## Información de compra:
- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), tambien tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de la carne.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.
> 🔥 **Ideal para:** Parrilla, horno o plancha
> ❄️ Conservación: Mantener refrigerado entre 0° y 4°C. para consumir dentro de las 72hs o congelar inmediatamente.', 'vacuno', 'vacuno', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788090412/jt0xwnwpjv2nk2u9cidq.webp', 'kg', 350, '15', '32', '"2026-08-30T14:49:26.361Z"'::jsonb, '"2026-08-31T00:06:06.902Z"'::jsonb, true, true, true, 15, '12900', '0');
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (5, 'Tocino', 'tocino', 'Nuestro **tocino de cerdo** de primera calidad es el aliado perfecto para aportar un sabor intenso y una textura extra jugosa a todas tus preparaciones. Ya sea para mechar carnes más magras al horno, enriquecer guisos tradicionales o potenciar el blend de tus hamburguesas caseras, este tocino te garantiza un resultado increíble.

## Información de compra:

- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), también tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de la carne.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

> 🔥 **Ideal para:** Mechar carnes al horno, saborizar guisados o sumar jugosidad a preparaciones con carne picada.
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 72hs o congelar inmediatamente.', 'cerdo', 'cerdo', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788185623/mdajbcv0w8vap25qfffs.jpg', 'kg', 548, '8', '57', '"2026-08-31T17:13:52.785Z"'::jsonb, '"2026-08-31T17:13:52.785Z"'::jsonb, true, false, false, 0, '1500', '0');
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (4, 'Hamburguesas de Pollo', 'hamburguesas-de-pollo', 'Nuestras **hamburguesas de pollo** están elaboradas diariamente con carne seleccionada de la mejor calidad. Son la opción perfecta para una comida rápida, rica y más liviana. Súper prácticas para tener siempre a mano y disfrutar en familia, ya sea al plato con guarnición o en un buen sándwich.

## Información de compra:

- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), también tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de nuestros elaborados.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

> 🔥 **Ideal para:** Plancha, horno o parrilla. ¡Súper rápidas de cocinar!
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 72hs o guardar directamente en el freezer.', 'pollo', 'preparados', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788130352/fvopylgwjah9gcmikky0.jpg', 'kg', 165, '17', '9', '"2026-08-31T01:52:41.886Z"'::jsonb, '"2026-08-31T17:18:15.063Z"'::jsonb, true, true, true, 10, '6500', '0');
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (2, 'Matambre', 'matambre', 'Nuestro matambre de novillo se destaca por su **excelente calidad y frescura**. Es un corte clásico y súper versátil, ideal para prepararlo tiernizado a la parrilla (el clásico matambre a la pizza), al horno, o para armar el tradicional matambre arrollado. De sabor intenso y muy rendidor.

## Información de compra:

- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), también tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de la carne.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

> 🔥 **Ideal para:** Parrilla (a la pizza), horno o arrollado.
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 72hs o congelar inmediatamente.', 'vacuno', 'vacuno', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788129846/zvnnxetrjoi8boowdaih.jpg', 'kg', 245, '20', '18', '"2026-08-31T01:44:24.880Z"'::jsonb, '"2026-08-31T17:18:31.654Z"'::jsonb, true, true, true, 30, '14500', '0');
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (6, 'Bife Ancho', 'bife-ancho', 'Nuestro **bife ancho de novillo** es un corte premium que se destaca por su excelente marmoleo, lo que le aporta una terneza y un sabor inconfundibles. Ideal para los amantes de la buena carne, es el protagonista indiscutido de cualquier asado o comida especial.

## Información de compra:

- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), también tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de la carne.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

> 🔥 **Ideal para:** Hacer a la parrilla, a la plancha o a la sartén de hierro. Un buen sellado a fuego fuerte es clave para retener todos sus jugos.
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 72hs o congelar inmediatamente.', 'vacuno', 'vacuno', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788185742/xllryjpxjvfhgoblss5z.jpg', 'kg', 205, '20', '13', '"2026-08-31T17:17:19.802Z"'::jsonb, '"2026-08-31T17:44:15.879Z"'::jsonb, true, false, true, 25, '13700', '0');
INSERT INTO catalogo (id, nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, creado_en, actualizado_en, activo, destacar, gana_puntos, puntos, precio, precio_anterior) VALUES (3, 'Pollo Entero', 'pollo-entero', 'Nuestro pollo entero de primera calidad se destaca por su **frescura y excelente rinde**. Es el comodín perfecto para tus comidas familiares: ideal para hacerlo entero al horno con papas, a la parrilla, o para trozar y aprovechar en distintos platos. Carne tierna, jugosa y de origen rigurosamente seleccionado.

## Información de compra:

- **Formas de pago**: Aceptamos efectivo y transferencia bancaria (retirando en sucursal), también tarjetas de débito y billeteras virtuales.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura y la cadena de frío.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

> 🔥 **Ideal para:** Horno, parrilla, estofados o para trozar.
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 48hs o congelar inmediatamente.', 'pollo', 'pollo', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788130102/tiwz9f0kyuznopv59jqr.webp', 'u', 205, '20', '13', '"2026-08-31T01:48:27.175Z"'::jsonb, '"2026-08-31T17:18:53.276Z"'::jsonb, true, true, false, 0, '4500', '0');
SELECT setval(pg_get_serial_sequence('catalogo', 'id'), (SELECT COALESCE(MAX(id), 1) FROM catalogo));

-- DATA CATALOGO_PROMOS
INSERT INTO catalogo_promos (id, catalogo_id, cantidad_kg, precio_promocional, activa, creado_en) VALUES (1, 6, '2', '16000', true, '"2026-08-31T17:44:10.375Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('catalogo_promos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM catalogo_promos));

-- DATA PEDIDOS
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (1, 2, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '12900', '12900', NULL, NULL, '"2026-08-30T14:53:21.319Z"'::jsonb, '"2026-08-30T14:55:11.658Z"'::jsonb, NULL);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (2, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '32900', '32900', NULL, NULL, '"2026-08-31T06:46:54.359Z"'::jsonb, '"2026-08-31T06:51:11.985Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (3, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '4500', '4500', NULL, NULL, '"2026-08-31T07:01:43.840Z"'::jsonb, '"2026-08-31T07:43:15.427Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (4, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '38400', '38400', NULL, NULL, '"2026-08-31T07:45:59.393Z"'::jsonb, '"2026-08-31T07:48:23.399Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (5, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '12900', '12900', NULL, NULL, '"2026-08-31T07:49:25.762Z"'::jsonb, '"2026-08-31T07:53:08.122Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (6, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '73900', '73900', NULL, NULL, '"2026-08-31T08:15:12.888Z"'::jsonb, '"2026-08-31T08:25:50.145Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (8, 1, 1, 'web', 'retiro_sucursal', NULL, 'entregado', NULL, 'efectivo', false, '27400', '27400', NULL, NULL, '"2026-08-31T17:58:11.673Z"'::jsonb, '"2026-08-31T18:01:00.923Z"'::jsonb, 5);
INSERT INTO pedidos (id, cliente_id, sucursal_id, canal, tipo_entrega, fecha_entrega_programada, estado_local, estado_envio_pedidosya, medio_pago, pago_confirmado, monto_total_estimado, monto_total_final, direccion_entrega, notas, creado_en, actualizado_en, cortador_id) VALUES (7, 1, 1, 'web', 'retiro_sucursal', NULL, 'en_corte', NULL, 'efectivo', false, '86800', NULL, NULL, NULL, '"2026-08-31T17:54:22.750Z"'::jsonb, '"2026-08-31T19:23:40.721Z"'::jsonb, 5);
SELECT setval(pg_get_serial_sequence('pedidos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM pedidos));

-- DATA PEDIDO_ITEMS
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (1, 1, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-30T14:53:21.319Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (2, 2, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-31T06:46:54.359Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (3, 2, 3, '3', '4500', '13500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T06:46:54.359Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (4, 2, 4, '1', '6500', '6500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T06:46:54.359Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (5, 3, 3, '1', '4500', '4500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:01:43.840Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (6, 4, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:45:59.393Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (7, 4, 4, '1', '6500', '6500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:45:59.393Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (8, 4, 3, '1', '4500', '4500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:45:59.393Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (9, 4, 2, '1', '14500', '14500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:45:59.393Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (10, 5, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-31T07:49:25.762Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (11, 6, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-31T08:15:12.888Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (12, 6, 4, '2', '6500', '13000', NULL, NULL, 'pendiente', NULL, '"2026-08-31T08:15:12.888Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (13, 6, 2, '3', '14500', '43500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T08:15:12.888Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (14, 6, 3, '1', '4500', '4500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T08:15:12.888Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (15, 7, 1, '2', '12900', '25800', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:54:22.750Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (16, 7, 4, '2', '6500', '13000', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:54:22.750Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (17, 7, 2, '3', '14500', '43500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:54:22.750Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (18, 7, 3, '1', '4500', '4500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:54:22.750Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (19, 8, 1, '1', '12900', '12900', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:58:11.673Z"'::jsonb);
INSERT INTO pedido_items (id, pedido_id, catalogo_id, cantidad_kg_solicitada, precio_por_kg_congelado, precio_estimado, peso_real, precio_final, estado_item, cortador_id, creado_en) VALUES (20, 8, 2, '1', '14500', '14500', NULL, NULL, 'pendiente', NULL, '"2026-08-31T17:58:11.673Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('pedido_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM pedido_items));

-- DATA CARRITOS
INSERT INTO carritos (id, sesion_id, cliente_id, creado_en, actualizado_en) VALUES (2, 'cliente_2', 2, '"2026-08-30T14:38:40.344Z"'::jsonb, '"2026-08-31T08:08:20.253Z"'::jsonb);
INSERT INTO carritos (id, sesion_id, cliente_id, creado_en, actualizado_en) VALUES (1, 'cliente_1', 1, '"2026-08-30T14:32:58.511Z"'::jsonb, '"2026-09-01T01:02:03.926Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('carritos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM carritos));

-- DATA CARRITO_ITEMS
INSERT INTO carrito_items (id, carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar, creado_en, actualizado_en) VALUES (95, 1, 1, '1', '12900', NULL, '"2026-09-01T01:02:03.926Z"'::jsonb, '"2026-09-01T01:02:03.926Z"'::jsonb);
INSERT INTO carrito_items (id, carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar, creado_en, actualizado_en) VALUES (96, 1, 4, '2', '6500', NULL, '"2026-09-01T01:02:03.926Z"'::jsonb, '"2026-09-01T01:02:03.926Z"'::jsonb);
INSERT INTO carrito_items (id, carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar, creado_en, actualizado_en) VALUES (97, 1, 2, '3', '14500', NULL, '"2026-09-01T01:02:03.926Z"'::jsonb, '"2026-09-01T01:02:03.926Z"'::jsonb);
INSERT INTO carrito_items (id, carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar, creado_en, actualizado_en) VALUES (98, 1, 3, '1', '4500', NULL, '"2026-09-01T01:02:03.926Z"'::jsonb, '"2026-09-01T01:02:03.926Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('carrito_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM carrito_items));

-- DATA CLIENTE_FAVORITOS
INSERT INTO cliente_favoritos (id, cliente_id, catalogo_id, creado_en) VALUES (6, 2, 1, '"2026-08-31T00:46:09.867Z"'::jsonb);
INSERT INTO cliente_favoritos (id, cliente_id, catalogo_id, creado_en) VALUES (15, 2, 2, '"2026-08-31T03:16:56.243Z"'::jsonb);
INSERT INTO cliente_favoritos (id, cliente_id, catalogo_id, creado_en) VALUES (24, 1, 2, '"2026-08-31T06:03:45.023Z"'::jsonb);
INSERT INTO cliente_favoritos (id, cliente_id, catalogo_id, creado_en) VALUES (78, 1, 1, '"2026-08-31T17:52:29.303Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('cliente_favoritos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM cliente_favoritos));

-- DATA NOTIFICACIONES
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (2, 2, 1, 1, '¡Pedido #1 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/1/confirmacion', true, 'entregado', '"2026-08-30T11:55:12.187Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (1, 2, NULL, 1, '¡Sumaste 15 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #1. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-30T11:53:24.022Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (4, NULL, 1, NULL, 'Puntos asegurados!', 'Decenas de productos con oportunidades!', 'sistema', 'megaphone', '/ofertas', false, NULL, '"2026-08-30T12:03:48.723Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (21, 1, 1, 8, '¡Pedido #8 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/8/confirmacion', true, 'entregado', '"2026-08-31T15:01:01.487Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (22, NULL, NULL, NULL, 'Hay promo para gonza', 'Holi gonza hay promo', 'sistema', 'megaphone', '/ofertas', true, NULL, '"2026-08-31T15:12:26.268Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (14, 1, 1, 5, '¡Pedido #5 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/5/confirmacion', true, 'entregado', '"2026-08-31T04:53:08.652Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (15, 1, NULL, 6, '¡Sumaste 55 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #6. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T05:15:14.999Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (9, 1, 1, 2, '¡Pedido #2 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/2/confirmacion', true, 'entregado', '"2026-08-31T03:51:12.518Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (10, 1, 1, 3, '¡Pedido #3 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/3/confirmacion', true, 'entregado', '"2026-08-31T04:43:15.957Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (11, 1, NULL, 4, '¡Sumaste 55 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #4. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T04:46:02.563Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (3, NULL, NULL, NULL, 'Ahora es mas fácil ganar puntos!', 'Tenemos mas de 50 productos disponibles con puntos de regalo, para que puedas canjearlo por emocionantes recompensas!', 'sistema', 'sparkles', '/', true, NULL, '"2026-08-30T12:01:17.877Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (5, NULL, NULL, NULL, 'Puntos asegurados!', 'Decenas de productos con oportunidades!', 'promocion', 'tag', '/ofertas', true, NULL, '"2026-08-30T12:04:49.417Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (6, NULL, NULL, NULL, 'Interesante', 'ajajajajaja', 'sistema', 'megaphone', '/ofertas', true, NULL, '"2026-08-30T12:06:10.236Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (7, NULL, NULL, NULL, 'Llego el asado fresco para el finde!', 'Aprovecha los cortes seleccionados por tiempo limitado!', 'sistema', 'megaphone', '/', true, NULL, '"2026-08-30T12:08:54.953Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (17, NULL, NULL, NULL, 'Gracias a todos por apoyarnos!', 'Por tu aporte estamos regalando 1 punto.', 'sistema', 'megaphone', '/ofertas', true, NULL, '"2026-08-31T05:40:42.462Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (18, 1, NULL, 7, '¡Sumaste 55 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #7. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T14:54:26.013Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (20, 1, NULL, 8, '¡Sumaste 45 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #8. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T14:58:14.618Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (19, 1, 1, 7, 'Pedido #7 en preparación 🔪', 'Nuestros cortadores están preparando y pesando tus cortes.', 'pedido', 'package', '/pedido/7/confirmacion', true, 'en_corte', '"2026-08-31T16:23:41.281Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (8, 1, NULL, 2, '¡Sumaste 25 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #2. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T03:46:56.288Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (12, 1, 1, 4, '¡Pedido #4 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/4/confirmacion', true, 'entregado', '"2026-08-31T04:48:23.931Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (13, 1, NULL, 5, '¡Sumaste 15 Puntos Valette! ⭐', 'Acreditamos tus puntos por la compra del pedido #5. Consultá tu saldo en tu perfil.', 'puntos', 'sparkles', '/perfil?tab=puntos', true, NULL, '"2026-08-31T04:49:27.336Z"'::jsonb);
INSERT INTO notificaciones (id, cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, leida, estado_pedido, creada_en) VALUES (16, 1, 1, 6, '¡Pedido #6 entregado! 🎉', '¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tu comida.', 'pedido', 'check', '/pedido/6/confirmacion', true, 'entregado', '"2026-08-31T05:25:50.675Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('notificaciones', 'id'), (SELECT COALESCE(MAX(id), 1) FROM notificaciones));

-- DATA PUSH_SUBSCRIPTIONS
INSERT INTO push_subscriptions (id, cliente_id, endpoint, keys, creada_en) VALUES (1, 1, 'https://web.push.apple.com/QBvbvxda1oKoOXjgR5g6yoSafTzIFbM-VGEaG50hasuQq52uka59Pk2kdaubovsbIvtavBdMygh8iaKT0CenCKFc0Lk-NvX6F4rq7p8dpV6n9bgHR3qkGEipC5gc3nrwmRpeKBpMJV33bjooN-f23e9hKs8pTHDeo6_EzXiUcs8', '{"auth":"OoV2InyxsC9saLNav33o2w","p256dh":"BOlm3_5oMUxzVWsCkS_mWVtYt0znBSUqGlwoBJ4Npy5Yztvyvuc1Av6q6JDidNjls3g2PWi6WzbqAppV6716S1k"}'::jsonb, '"2026-08-31T05:07:33.226Z"'::jsonb);
INSERT INTO push_subscriptions (id, cliente_id, endpoint, keys, creada_en) VALUES (5, 1, 'https://fcm.googleapis.com/fcm/send/ffgfYmLtu70:APA91bGgZqXM8kicNUwW-YI4cGUD7fZsoHRUfx_4AC6OAz9VcHtxAoarJ19QuAr-9gDhWRU1LwPKY0lJIlWTvM_V-nzDc8yHFmH-TTN9QlsImQrldSjBFcIwOu-O7-hgyacBfVDY8kRw', '{"auth":"ha7xDMvgEn2QA9jHjBhaHw","p256dh":"BPRzBwkziV_7z2zLoRdHpLU4VT0eatCKb-jxeKkWr-zc-s8jy2UwRKS5t5FIoQqu3YoWMGcgFaMVRHsxuifQ4D0"}'::jsonb, '"2026-08-31T05:14:04.810Z"'::jsonb);
INSERT INTO push_subscriptions (id, cliente_id, endpoint, keys, creada_en) VALUES (11, NULL, 'https://web.push.apple.com/QAZysuae_yzpe6CUrMA4BCU9sAK2_ZmIfgykLeesjTvdz4QXHujszcfAZFre7TpQfddfg19WnuhuwjVTYqdFmNTOocm2c2IfH-vsL5eGDS4b0N08fx8cadXuVrwkU7xB3qlx6Uzu8c8CUHPghHY6kkrPb2WhAN1N1Yo4Cjzdols', '{"auth":"jzVLgTovJdW0ht048yezdw","p256dh":"BOcH1JDcrq_kNG00bbmSK_Qj4SEfiUOqv-0sqNQPdnaINbpJXbDb6dHPI5uJJ1z6DAZDT3xpPkaCt1utd0w4Ag8"}'::jsonb, '"2026-08-31T22:06:22.993Z"'::jsonb);
INSERT INTO push_subscriptions (id, cliente_id, endpoint, keys, creada_en) VALUES (2, 1, 'https://web.push.apple.com/QAk3X28deXkBg0iMXIEwUZY2mB0kQxfhXtRr3mDBloDJWusYtWIeePGuLo-TXiAKAhprSiCa8IgfgqJiGTybGsx7KGiBxv9GhJYoqiy5FzkVQ767QfT_TqDSUMJUxOPkPOAp17z7IKl0Ev22ktJ1c4yCxNDFrOqIG3S2oM8ypEI', '{"auth":"0XZjWN8IQ0g9l9mi9z1l-w","p256dh":"BBmQvyLt4Fh1apbpvab8Vbd9LF1r5-iOD9LxuMKGUId8vJX2jsPIKjeGs0SHTTIguNgmwC89k36LKetfplZ_iR8"}'::jsonb, '"2026-08-31T05:26:13.555Z"'::jsonb);
INSERT INTO push_subscriptions (id, cliente_id, endpoint, keys, creada_en) VALUES (6, 1, 'https://fcm.googleapis.com/fcm/send/cKfQfFBGj-E:APA91bEUJEjky_f0Hls59EsGQaCnFbV7-66EYjoysdCKPvA5a1SN7bD3QB26sb8d8o3NS97JZsC42MBgteG4Fry95GHX1s8NxYVlDvcU4VSCpi_Idl-jqPZbg1yEcsm8otlKtF3tLmNy', '{"auth":"SA3TKr6edVpqQVUagOkiiQ","p256dh":"BA0gPYLOM6Y4BOpqxLM5gBfxOMJQ3lLnKhmltFrAgxNKzVS26hVLITW4EnKfzhNZ86KirFBH85JrrH09THk6wyI"}'::jsonb, '"2026-08-31T05:26:18.332Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('push_subscriptions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM push_subscriptions));

-- DATA BANNERS_PUBLICIDAD
INSERT INTO banners_publicidad (id, titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden, activo, impresiones, clics, creado_en, subtitulo, badge_texto, badge_color, boton_texto) VALUES (2, 'Cortes Seleccionados - 100% Calidad Premium', 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=3480&auto=format&fit=crop', 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1280&auto=format&fit=crop', '/vacuno', 2, true, 435, 11, '"2026-08-28T09:55:09.767Z"'::jsonb, '', '', 'rojo', 'Ver más');
INSERT INTO banners_publicidad (id, titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden, activo, impresiones, clics, creado_en, subtitulo, badge_texto, badge_color, boton_texto) VALUES (3, 'Club Valette: Acumulá puntos y canjeá descuentos', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=3480&auto=format&fit=crop', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1280&auto=format&fit=crop', '/productos', 3, true, 404, 9, '"2026-08-28T09:55:09.767Z"'::jsonb, '', '', 'rojo', 'Ver más');
INSERT INTO banners_publicidad (id, titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden, activo, impresiones, clics, creado_en, subtitulo, badge_texto, badge_color, boton_texto) VALUES (1, '¡Promo Asado Fin de Semana!', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=3480&auto=format&fit=crop', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1280&auto=format&fit=crop', '/productos?q=asado', 1, true, 466, 21, '"2026-08-28T09:55:09.767Z"'::jsonb, '', 'OFERTA EXCLUSIVA WEB', 'rojo', 'Ver promo');
SELECT setval(pg_get_serial_sequence('banners_publicidad', 'id'), (SELECT COALESCE(MAX(id), 1) FROM banners_publicidad));

-- DATA PUNTOS_HISTORIAL
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (1, 1, 'bienvenida', 50, 'Bono por completar el perfil al registrarse', NULL, '"2026-08-30T14:32:56.659Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (2, 2, 'bienvenida', 50, 'Bono por completar el perfil al registrarse', NULL, '"2026-08-30T14:38:36.320Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (3, 2, 'referido_recibido', 50, 'Bonus por usar el código de referido: 19243', NULL, '"2026-08-30T14:38:36.320Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (4, 1, 'referido_dado', 100, 'Tu referido @prueba se registró con tu código', NULL, '"2026-08-30T14:38:36.320Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (5, 2, 'compra', 15, 'Puntos ganados por el pedido #1', 1, '"2026-08-30T14:53:23.811Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (6, 1, 'compra', 25, 'Puntos ganados por el pedido #2', 2, '"2026-08-31T06:46:56.109Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (7, 1, 'compra', 55, 'Puntos ganados por el pedido #4', 4, '"2026-08-31T07:46:02.381Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (8, 1, 'compra', 15, 'Puntos ganados por el pedido #5', 5, '"2026-08-31T07:49:27.160Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (9, 1, 'compra', 55, 'Puntos ganados por el pedido #6', 6, '"2026-08-31T08:15:14.816Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (10, 1, 'compra', 55, 'Puntos ganados por el pedido #7', 7, '"2026-08-31T17:54:25.826Z"'::jsonb);
INSERT INTO puntos_historial (id, cliente_id, tipo, puntos, descripcion, pedido_id, creado_en) VALUES (11, 1, 'compra', 45, 'Puntos ganados por el pedido #8', 8, '"2026-08-31T17:58:14.432Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('puntos_historial', 'id'), (SELECT COALESCE(MAX(id), 1) FROM puntos_historial));

-- DATA METRICAS_VISITAS
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (1, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:23:14.332Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (2, '/ingresar', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:26:44.459Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (3, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:27:10.217Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (4, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:27:46.062Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (5, '/ingresar', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:28:21.981Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (6, '/perfil', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:33:00.706Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (7, '/perfil?tab=datos', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:33:06.812Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (8, '/perfil?tab=puntos', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:33:27.773Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (9, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:33:33.831Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (10, '/', 'mobile', 'ses_dcwptusuem', '"2026-08-30T14:35:52.553Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (11, '/ingresar', 'mobile', 'ses_dcwptusuem', '"2026-08-30T14:36:00.059Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (12, '/', 'mobile', 'ses_i75kra3ojb', '"2026-08-30T14:36:31.710Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (13, '/ingresar', 'mobile', 'ses_i75kra3ojb', '"2026-08-30T14:37:43.896Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (14, '/perfil', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:38:20.209Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (15, '/perfil?tab=puntos', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:38:23.361Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (16, '/perfil', 'mobile', 'ses_i75kra3ojb', '"2026-08-30T14:38:41.354Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (17, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:38:58.366Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (18, '/perfil', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:39:01.234Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (19, '/perfil?tab=puntos', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:39:03.461Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (20, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:49:43.791Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (21, '/vacuno/asado', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T14:49:51.392Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (22, '/', 'mobile', 'ses_mvno168kxl', '"2026-08-30T14:50:48.513Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (23, '/', 'mobile', 'ses_mvno168kxl', '"2026-08-30T14:50:50.473Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (24, '/perfil?tab=datos', 'mobile', 'ses_mvno168kxl', '"2026-08-30T14:50:52.391Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (25, '/', 'mobile', 'ses_mvno168kxl', '"2026-08-30T14:51:22.351Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (26, '/vacuno/asado', 'mobile', 'ses_mvno168kxl', '"2026-08-30T14:51:39.848Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (27, '/', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:52:23.975Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (28, '/ingresar', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:52:34.639Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (29, '/', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:52:52.602Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (30, '/checkout', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:53:15.583Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (31, '/pedido/1/confirmacion', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:53:25.219Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (32, '/', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:55:07.408Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (33, '/pedido/1/confirmacion', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:55:26.774Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (34, '/perfil', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:56:00.005Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (35, '/perfil?tab=datos', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:56:05.184Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (36, '/perfil?tab=puntos', 'mobile', 'ses_rrznt3b1mw', '"2026-08-30T14:56:06.035Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (37, '/', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T14:56:26.628Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (38, '/perfil?tab=puntos', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T14:56:33.998Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (39, '/', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T14:57:15.447Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (40, '/', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T14:59:58.523Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (41, '/ingresar', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T15:00:03.151Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (42, '/', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T15:00:24.836Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (43, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T15:02:12.430Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (44, '/ofertas', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T15:05:30.061Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (45, '/', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T15:05:41.603Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (46, '/ofertas', 'mobile', 'ses_hn7chv0cit', '"2026-08-30T15:05:44.248Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (47, '/ofertas', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T15:05:57.057Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (48, '/', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T15:06:29.914Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (49, '/ofertas', 'mobile', 'ses_2abpneg1e3', '"2026-08-30T15:06:31.328Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (50, '/', 'mobile', 'ses_a6kak0chu5', '"2026-08-30T15:06:39.572Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (51, '/', 'mobile', 'ses_hbem8fwqm', '"2026-08-30T15:07:28.147Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (52, '/', 'mobile', 'ses_ppjp0l2fnn', '"2026-08-30T15:07:51.944Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (53, '/ofertas', 'mobile', 'ses_a6kak0chu5', '"2026-08-30T15:10:03.032Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (54, '/', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:04.231Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (55, '/ofertas', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:15.987Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (56, '/', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:17.608Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (57, '/perfil', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:19.475Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (58, '/pedido/1/confirmacion', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:22.802Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (59, '/perfil', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:44.151Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (60, '/perfil?tab=datos', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:45.982Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (61, '/perfil?tab=puntos', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:11:57.644Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (62, '/', 'mobile', 'ses_zsy2v986ec', '"2026-08-30T15:12:35.539Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (63, '/', 'mobile', 'ses_hmwunx59d1', '"2026-08-30T15:13:18.553Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (64, '/perfil', 'mobile', 'ses_hmwunx59d1', '"2026-08-30T15:13:36.161Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (65, '/', 'mobile', 'ses_hmwunx59d1', '"2026-08-30T15:13:57.437Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (66, '/', 'mobile', 'ses_guh5xgerc7', '"2026-08-30T15:14:06.213Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (67, '/', 'desktop', 'ses_mcpjullfg3', '"2026-08-30T23:25:03.733Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (68, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:28:55.451Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (69, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:29:14.614Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (70, '/ingresar', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:29:16.481Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (71, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:29:44.644Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (72, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:29:52.192Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (73, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:32:24.245Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (74, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:32:25.152Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (75, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:32:27.941Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (76, '/perfil', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:33:59.227Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (77, '/perfil?tab=datos', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:01.260Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (78, '/perfil?tab=puntos', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:06.505Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (79, '/perfil?tab=pedidos', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:20.626Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (80, '/perfil?tab=puntos', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:21.625Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (81, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:23.329Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (82, '/vacuno', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:33.252Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (83, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:34:41.284Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (84, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-30T23:38:35.563Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (85, '/', 'desktop', 'ses_gsbihrjgie', '"2026-08-30T23:39:07.299Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (86, '/', 'mobile', 'ses_q7979o903z', '"2026-08-31T00:03:14.178Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (87, '/vacuno/asado', 'mobile', 'ses_q7979o903z', '"2026-08-31T00:03:16.761Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (88, '/', 'mobile', 'ses_q7979o903z', '"2026-08-31T00:04:26.628Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (89, '/vacuno/asado', 'mobile', 'ses_q7979o903z', '"2026-08-31T00:04:29.076Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (90, '/', 'mobile', 'ses_mkm36q0xyu', '"2026-08-31T00:08:42.984Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (91, '/vacuno/asado', 'mobile', 'ses_mkm36q0xyu', '"2026-08-31T00:08:45.505Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (92, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:11:29.097Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (93, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:11:30.100Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (94, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:19:18.082Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (95, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:19:43.741Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (96, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:19:48.278Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (97, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:19:53.191Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (98, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:19:57.211Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (99, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:20:03.359Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (100, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:20:05.228Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (101, '/', 'mobile', 'ses_mkm36q0xyu', '"2026-08-31T00:22:07.368Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (102, '/', 'mobile', 'ses_whofmnp0ja', '"2026-08-31T00:22:15.706Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (103, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:23:43.979Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (104, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:34:10.948Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (105, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:34:11.393Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (106, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:34:11.456Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (107, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:34:12.179Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (108, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:35:30.664Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (109, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:35:31.714Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (110, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:35:35.915Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (111, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:35:42.408Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (112, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:35:47.391Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (113, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:36:03.802Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (118, '/perfil', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:47:07.658Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (119, '/perfil', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:47:13.301Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (114, '/productos?q=asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:36:39.047Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (115, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:36:54.581Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (116, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:45:50.008Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (117, '/', 'mobile', 'ses_v79b64z7it', '"2026-08-31T00:46:09.840Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (120, '/perfil?tab=datos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:47:25.570Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (121, '/perfil?tab=puntos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:47:28.505Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (122, '/favoritos', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:47:50.015Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (123, '/', 'mobile', 'ses_5nqak4o93i', '"2026-08-31T00:48:22.215Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (124, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T00:49:57.960Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (125, '/productos', 'mobile', 'ses_3updd8nipj', '"2026-08-31T00:53:12.530Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (126, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T00:53:13.021Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (127, '/productos?q=asado', 'mobile', 'ses_3updd8nipj', '"2026-08-31T00:53:51.742Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (128, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T00:53:52.017Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (129, '/categorias', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:58:32.647Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (130, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T00:58:36.438Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (131, '/productos?q=asado', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:00:07.642Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (132, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:00:42.437Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (133, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:00:56.731Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (134, '/productos', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:01:15.802Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (135, '/favoritos', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:01:31.871Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (136, '/', 'mobile', 'ses_3updd8nipj', '"2026-08-31T01:01:40.226Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (137, '/vacuno/asado', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T01:40:13.460Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (138, '/vacuno/matambre', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T01:44:48.938Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (139, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T01:48:51.036Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (140, '/pollo/pollo-entero', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T01:48:58.084Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (141, '/', 'desktop', 'ses_5nqak4o93i', '"2026-08-31T01:53:12.304Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (142, '/', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:57:01.450Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (143, '/preparados/hamburguesas-de-pollo', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:57:07.823Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (144, '/pollo/pollo-entero', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:57:40.903Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (145, '/vacuno/asado', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:58:10.338Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (146, '/vacuno/matambre', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:58:30.740Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (147, '/perfil', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:58:44.715Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (148, '/perfil?tab=puntos', 'mobile', 'ses_pwn358zyy5', '"2026-08-31T01:58:49.935Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (149, '/', 'mobile', 'ses_3jiz0hrbw1', '"2026-08-31T02:09:30.360Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (150, '/', 'mobile', 'ses_g7qvl7okit', '"2026-08-31T02:12:10.666Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (151, '/', 'mobile', 'ses_7df3634yuu', '"2026-08-31T03:02:45.952Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (152, '/vacuno/asado', 'mobile', 'ses_7df3634yuu', '"2026-08-31T03:09:25.127Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (153, '/perfil', 'mobile', 'ses_7df3634yuu', '"2026-08-31T03:16:55.657Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (154, '/favoritos', 'mobile', 'ses_7df3634yuu', '"2026-08-31T03:17:15.574Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (155, '/', 'mobile', 'ses_7df3634yuu', '"2026-08-31T03:17:21.286Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (156, '/', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:15:47.356Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (157, '/', 'mobile', 'ses_7sg24ab3fi', '"2026-08-31T05:42:02.172Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (158, '/ingresar', 'mobile', 'ses_7sg24ab3fi', '"2026-08-31T05:42:07.733Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (159, '/', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:43:44.195Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (160, '/', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:46:53.521Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (161, '/', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T05:47:02.258Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (162, '/ingresar', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T05:47:04.955Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (163, '/ingresar', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:47:59.956Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (164, '/ingresar', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:48:01.956Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (165, '/ingresar', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:55:02.589Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (166, '/', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T05:59:06.586Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (167, '/ingresar', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T05:59:09.090Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (168, '/ingresar', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:59:31.668Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (169, '/', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:59:33.235Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (170, '/ingresar', 'desktop', 'ses_wsykeuyled', '"2026-08-31T05:59:33.290Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (171, '/restablecer-password?token=ad3bf877e455b482349dfa9c2e7d92d64c92c9e288ccd0337a1d8af6fe1439a8', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:01:10.643Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (172, '/perfil', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:01:41.101Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (173, '/perfil?tab=datos', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:01:50.580Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (174, '/perfil?tab=datos', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:02:00.285Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (175, '/', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:02:13.977Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (176, '/', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:03:01.206Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (177, '/favoritos', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:03:18.442Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (178, '/favoritos', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:03:20.646Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (179, '/', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:03:39.732Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (180, '/favoritos', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:03:47.885Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (181, '/productos?q=asado', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:04:14.844Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (182, '/productos', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:04:20.500Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (183, '/productos', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:18:00.903Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (184, '/vacuno', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T06:18:16.120Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (185, '/', 'desktop', 'ses_4njonl2xec', '"2026-08-31T06:39:19.719Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (186, '/preparados/hamburguesas-de-pollo', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:45:51.968Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (187, '/checkout', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:46:46.502Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (188, '/pedido/2/confirmacion', 'mobile', 'ses_k85fc9hktz', '"2026-08-31T06:46:57.922Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (189, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:51:31.500Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (190, '/pedido/2/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:51:49.765Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (191, '/perfil?tab=compras', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:52:18.905Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (192, '/perfil?tab=pedidos', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:52:24.417Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (193, '/perfil?tab=datos', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:52:30.047Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (194, '/perfil?tab=puntos', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T06:52:42.491Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (195, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:01:30.075Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (196, '/checkout', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:01:37.504Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (197, '/pedido/3/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:01:48.336Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (198, '/vacuno', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T07:41:38.599Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (199, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:42:50.731Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (200, '/pedido/3/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:43:11.377Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (201, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:44:34.198Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (202, '/pedido/3/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:44:35.684Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (203, '/vacuno', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T07:45:15.934Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (204, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:45:42.578Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (205, '/checkout', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:45:54.578Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (206, '/pedido/4/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:46:04.914Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (207, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:46:46.913Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (208, '/pedido/4/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:47:12.297Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (209, '/', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:48:35.741Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (210, '/checkout', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:49:23.287Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (211, '/pedido/5/confirmacion', 'mobile', 'ses_no5fvufj2n', '"2026-08-31T07:49:28.699Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (212, '/', 'mobile', 'ses_t74u96ugis', '"2026-08-31T07:50:12.679Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (213, '/', 'mobile', 'ses_rn1hbzxomw', '"2026-08-31T07:50:18.973Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (214, '/pedido/5/confirmacion', 'mobile', 'ses_rn1hbzxomw', '"2026-08-31T07:51:02.535Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (215, '/', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:52:01.702Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (216, '/', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:52:03.505Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (217, '/ingresar', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:52:14.220Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (218, '/', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:52:39.681Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (219, '/pedido/5/confirmacion', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:53:20.116Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (220, '/perfil?tab=compras', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:08.507Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (221, '/perfil?tab=pedidos', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:11.170Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (222, '/pedido/2/confirmacion', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:17.902Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (223, '/perfil?tab=pedidos', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:21.216Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (224, '/perfil?tab=puntos', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:25.748Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (225, '/favoritos', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:30.833Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (226, '/', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T07:56:36.497Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (227, '/', 'mobile', 'ses_8g1nyq133k', '"2026-08-31T08:07:32.961Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (228, '/vacuno/asado', 'mobile', 'ses_mf6hzr72tw', '"2026-08-31T08:08:14.863Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (229, '/', 'mobile', 'ses_mf6hzr72tw', '"2026-08-31T08:08:17.038Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (230, '/', 'mobile', 'ses_mf6hzr72tw', '"2026-08-31T08:08:19.187Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (231, '/vacuno', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T08:10:46.785Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (232, '/', 'mobile', 'ses_qovgksf8ba', '"2026-08-31T08:10:55.363Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (233, '/ingresar', 'mobile', 'ses_qovgksf8ba', '"2026-08-31T08:10:59.341Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (234, '/', 'mobile', 'ses_qovgksf8ba', '"2026-08-31T08:11:21.237Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (235, '/', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:12:25.336Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (236, '/ingresar', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:12:25.815Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (237, '/', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:12:51.094Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (238, '/checkout', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:13:20.237Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (239, '/', 'desktop', 'ses_zn8vfe0c4c', '"2026-08-31T08:14:03.706Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (240, '/vacuno', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T08:14:08.126Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (241, '/', 'desktop', 'ses_pd6b0vk1x3', '"2026-08-31T08:14:12.657Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (242, '/', 'desktop', 'ses_i1ck8pa4yz', '"2026-08-31T08:14:42.373Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (243, '/ingresar', 'desktop', 'ses_i1ck8pa4yz', '"2026-08-31T08:14:48.955Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (244, '/', 'desktop', 'ses_i1ck8pa4yz', '"2026-08-31T08:14:58.649Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (245, '/favoritos', 'desktop', 'ses_i1ck8pa4yz', '"2026-08-31T08:15:05.201Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (246, '/', 'desktop', 'ses_i1ck8pa4yz', '"2026-08-31T08:15:08.272Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (247, '/pedido/6/confirmacion', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:15:16.264Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (248, '/', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T08:15:41.824Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (249, '/pedido/6/confirmacion', 'mobile', 'ses_l0q38vgwro', '"2026-08-31T08:23:12.875Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (250, '/pedido/6/confirmacion', 'mobile', 'ses_9zdl989n01', '"2026-08-31T08:23:50.084Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (251, '/', 'mobile', 'ses_w8v6r4422d', '"2026-08-31T08:26:13.095Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (252, '/pedido/6/confirmacion', 'mobile', 'ses_gqj2zhvx9g', '"2026-08-31T08:26:18.210Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (253, '/', 'mobile', 'ses_ob5yh2oldy', '"2026-08-31T08:37:48.120Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (254, '/', 'mobile', 'ses_ob5yh2oldy', '"2026-08-31T08:37:50.594Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (255, '/', 'mobile', 'ses_ny70ka0fpj', '"2026-08-31T08:38:22.229Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (256, '/ingresar', 'mobile', 'ses_ny70ka0fpj', '"2026-08-31T08:38:26.005Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (257, '/', 'mobile', 'ses_ny70ka0fpj', '"2026-08-31T08:38:58.569Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (258, '/', 'mobile', 'ses_z6c2m8pxf3', '"2026-08-31T09:25:23.522Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (259, '/', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:41:29.896Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (260, '/favoritos', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:05.043Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (261, '/', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:21.436Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (262, '/productos', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:27.229Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (263, '/', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:28.697Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (264, '/productos?q=asado', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:30.563Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (265, '/', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:34.909Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (266, '/productos?q=hamb', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:43.001Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (267, '/', 'mobile', 'ses_8xqeitc4ds', '"2026-08-31T14:42:49.910Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (268, '/', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T16:27:06.733Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (269, '/', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T17:09:31.411Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (270, '/', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T17:17:29.918Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (271, '/', 'mobile', 'ses_pds1y6g5v8', '"2026-08-31T17:17:59.136Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (272, '/productos?q=hamb', 'mobile', 'ses_pds1y6g5v8', '"2026-08-31T17:30:33.710Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (273, '/', 'mobile', 'ses_pds1y6g5v8', '"2026-08-31T17:30:35.808Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (274, '/productos?q=Hamb', 'mobile', 'ses_pds1y6g5v8', '"2026-08-31T17:30:40.115Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (275, '/', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:30:45.607Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (276, '/productos?q=Hamburgue', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:30:49.475Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (277, '/', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:39:26.859Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (278, '/favoritos', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:40:16.275Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (279, '/', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:40:18.636Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (280, '/embutidos', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:40:52.405Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (281, '/', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:40:54.423Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (282, '/pollo', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:40:56.206Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (283, '/preparados/hamburguesas-de-pollo', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:41:11.707Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (284, '/pollo', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:42:46.557Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (285, '/', 'mobile', 'ses_0lbmtlfqcb', '"2026-08-31T17:42:47.087Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (286, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:44:39.899Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (287, '/vacuno/bife-ancho', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:44:54.210Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (288, '/vacuno', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:45:08.723Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (289, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:45:13.401Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (290, '/perfil?tab=datos', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:45:27.437Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (291, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:46:08.109Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (292, '/vacuno/asado', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:52:16.316Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (293, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:52:33.607Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (294, '/vacuno/asado', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:52:51.006Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (295, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:07.280Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (296, '/vacuno/bife-ancho', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:20.388Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (297, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:28.725Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (298, '/perfil?tab=datos', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:41.527Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (299, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:45.858Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (300, '/vacuno/asado', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:53:54.628Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (301, '/checkout', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:54:08.859Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (302, '/pedido/7/confirmacion', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:54:27.433Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (303, '/checkout', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:56:25.511Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (304, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:56:25.846Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (305, '/vacuno/asado', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:56:25.939Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (306, '/vacuno/asado', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:56:42.525Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (307, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:01.402Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (308, '/vacuno/matambre', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:04.507Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (309, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:10.311Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (310, '/productos?q=Asa', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:36.148Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (311, '/', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:42.646Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (312, '/productos?q=Asa', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:57:49.611Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (313, '/checkout', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:01.592Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (314, '/pedido/8/confirmacion', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:15.865Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (315, '/perfil', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:42.908Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (316, '/favoritos', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:45.111Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (317, '/perfil', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:48.510Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (318, '/pedido/8/confirmacion', 'mobile', 'ses_xr1rywhq74', '"2026-08-31T17:58:59.811Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (319, '/', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T18:14:42.373Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (320, '/perfil', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T18:14:56.790Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (321, '/perfil?tab=puntos', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T18:14:59.021Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (322, '/', 'mobile', 'ses_qox5ah3zj5', '"2026-08-31T18:59:25.849Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (323, '/vacuno/bife-ancho', 'mobile', 'ses_qox5ah3zj5', '"2026-08-31T19:00:05.360Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (324, '/perfil?tab=puntos', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T19:17:58.205Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (325, '/', 'desktop', 'ses_s698u0v7pt', '"2026-08-31T19:17:58.604Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (326, '/', 'mobile', 'ses_39ms0j4s6j', '"2026-08-31T19:42:01.752Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (327, '/', 'mobile', 'ses_tl6hhxgomi', '"2026-08-31T20:07:53.049Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (328, '/', 'mobile', 'ses_85rxfeut4f', '"2026-08-31T21:04:55.255Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (329, '/', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:02:04.017Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (330, '/vacuno/matambre', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:03:46.717Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (331, '/', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:03:47.955Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (332, '/pollo/pollo-entero', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:03:51.227Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (333, '/', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:04:07.144Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (334, '/ofertas', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:04:22.485Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (335, '/perfil', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:04:59.657Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (336, '/perfil?tab=puntos', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:05:35.770Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (337, '/perfil', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:06:10.686Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (338, '/', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:06:18.827Z"'::jsonb);
INSERT INTO metricas_visitas (id, ruta, dispositivo, sesion_id, creado_en) VALUES (339, '/ingresar', 'mobile', 'ses_1cediuof6p', '"2026-09-01T01:06:26.981Z"'::jsonb);
SELECT setval(pg_get_serial_sequence('metricas_visitas', 'id'), (SELECT COALESCE(MAX(id), 1) FROM metricas_visitas));

