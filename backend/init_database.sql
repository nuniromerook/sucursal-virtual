-- DUMP COMPLETO Y CORREGIDO VALETTE_DB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SUCURSALES
CREATE TABLE IF NOT EXISTS sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    horario VARCHAR(100),
    abierta BOOLEAN DEFAULT TRUE,
    slug VARCHAR(100) UNIQUE,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMPLEADOS
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    pin_hash VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'cortador',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    telefono VARCHAR(50),
    usuario VARCHAR(50) UNIQUE,
    direccion_default VARCHAR(255),
    puntos_acumulados INTEGER DEFAULT 0,
    perfil_completo BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    referral_code VARCHAR(50) UNIQUE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CATALOGO
CREATE TABLE IF NOT EXISTS catalogo (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    especie VARCHAR(100),
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_anterior NUMERIC(10,2),
    unidad_medida VARCHAR(20) DEFAULT 'kg',
    stock NUMERIC(10,2) DEFAULT 100,
    activo BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    permite_fraccion BOOLEAN DEFAULT TRUE,
    incremento_fraccion NUMERIC(6,3) DEFAULT 0.5,
    fraccion_minima NUMERIC(6,3) DEFAULT 0.5,
    gana_puntos BOOLEAN DEFAULT FALSE,
    puntos INTEGER DEFAULT 0,
    en_oferta BOOLEAN DEFAULT FALSE,
    descuento_porcentaje INTEGER DEFAULT 0,
    promos JSONB DEFAULT '[]'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STOCK SUCURSAL
CREATE TABLE IF NOT EXISTS stock_sucursal (
    id SERIAL PRIMARY KEY,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES catalogo(id) ON DELETE CASCADE,
    stock NUMERIC(10,2) DEFAULT 100,
    disponible BOOLEAN DEFAULT TRUE,
    UNIQUE(sucursal_id, producto_id)
);

-- 6. PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    cortador_id INTEGER REFERENCES empleados(id) ON DELETE SET NULL,
    estado VARCHAR(50) DEFAULT 'recibido',
    estado_local VARCHAR(50) DEFAULT 'recibido',
    total_estimado NUMERIC(10,2) DEFAULT 0,
    monto_total_final NUMERIC(10,2),
    tipo_entrega VARCHAR(50) DEFAULT 'retiro',
    direccion_envio TEXT,
    notas TEXT,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    comprobante_url TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PEDIDO_ITEMS
CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES catalogo(id) ON DELETE SET NULL,
    nombre_producto VARCHAR(200),
    cantidad_solicitada NUMERIC(10,3) DEFAULT 1,
    cantidad_pesada NUMERIC(10,3),
    precio_unitario NUMERIC(10,2) DEFAULT 0,
    subtotal NUMERIC(10,2) DEFAULT 0,
    corte_personalizado TEXT
);

-- 8. CARRILLOS & ITEMS
CREATE TABLE IF NOT EXISTS carritos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carrito_items (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER REFERENCES carritos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES catalogo(id) ON DELETE CASCADE,
    cantidad NUMERIC(10,3) DEFAULT 1,
    corte_personalizado TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FAVORITOS
CREATE TABLE IF NOT EXISTS cliente_favoritos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES catalogo(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (cliente_id, producto_id)
);

-- 10. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'sistema',
    icono VARCHAR(50) DEFAULT 'bell',
    enlace TEXT DEFAULT '/',
    estado_pedido VARCHAR(50),
    leida BOOLEAN DEFAULT FALSE,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. BANNERS PUBLICIDAD
CREATE TABLE IF NOT EXISTS banners_publicidad (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150),
    subtitulo VARCHAR(255),
    imagen_url TEXT,
    enlace TEXT DEFAULT '/',
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 1,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. PUNTOS HISTORIAL
CREATE TABLE IF NOT EXISTS puntos_historial (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    puntos INTEGER NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. METRICAS VISITAS & EVENTOS
CREATE TABLE IF NOT EXISTS metricas_visitas (
    id SERIAL PRIMARY KEY,
    ip VARCHAR(50),
    user_agent TEXT,
    path VARCHAR(255),
    cliente_id INTEGER,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metricas_eventos (
    id SERIAL PRIMARY KEY,
    tipo_evento VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    cliente_id INTEGER,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DATA SUCURSALES
INSERT INTO sucursales (id, nombre, direccion, telefono, horario, abierta, slug) 
VALUES (1, 'Luis Guillon', 'Av. Luciano Valette 3910', '1135534033', 'Lun a Sáb 8:00 a 20:00', true, 'luis-guillon') 
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, abierta = true, slug = EXCLUDED.slug;

SELECT setval('sucursales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sucursales));

-- DATA CATALOGO
INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (10, 'Hamburguesas de Carne', 'hamburguesas artesanales de pura carne', 'preparados', 'vacuno', 10450.00, 12300.00, 'kg', 100, true, 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787865020/smv3jqaihner01b9s9ma.jpg', true, 0.5, 0.5, true, 20, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (11, 'Matambre', 'matambre tierno para la parrilla o arrollar', 'vacuno', 'vacuno', 13500.00, 14500.00, 'kg', 100, true, 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787865062/diejnvhkquijesu7uxss.png', true, 0.5, 0.5, true, 30, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (9, 'Osobuco', 'corte con hueso y caracú ideal para guisos', 'vacuno', 'vacuno', 10000.00, 12500.00, 'kg', 100, true, 'https://www.carniceriademadrid.es/wp-content/uploads/2021/04/osobuco-4.jpg', true, 0.5, 0.5, false, 0, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (12, 'Jamón s/hueso', 'pulpa de jamon fresca y magra', 'cerdo', 'cerdo', 7600.00, 0.00, 'kg', 100, true, 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787730523/zrhuld2zctmfgtz4mnes.jpg', true, 0.5, 0.5, false, 0, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (13, 'Chorizo', 'Chorizo parrillero puro cerdo tradicional', 'embutidos', 'cerdo', 1320.00, 0.00, 'u', 100, true, 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787730873/utaomrg2gtgcirlzfoxp.webp', true, 0.5, 0.5, true, 8, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

INSERT INTO catalogo (id, nombre_producto, descripcion, categoria, especie, precio, precio_anterior, unidad_medida, stock, activo, imagen_url, permite_fraccion, incremento_fraccion, fraccion_minima, gana_puntos, puntos, en_oferta, descuento_porcentaje, promos) 
VALUES (8, 'Bondiola', 'Bondiola de cerdo fresca de primera calidad', 'cerdo', 'cerdo', 7800.00, 8300.00, 'kg', 100, true, 'https://santelmomarket.com/cdn/shop/files/Bondiola-de-Cerdo-Kg-1-6025.jpg?v=1719522792&width=1400', true, 0.5, 0.5, true, 15, false, 0, '[]'::jsonb) 
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, imagen_url = EXCLUDED.imagen_url, activo = true;

SELECT setval('catalogo_id_seq', (SELECT COALESCE(MAX(id), 1) FROM catalogo));

-- DATA BANNERS
INSERT INTO banners_publicidad (id, titulo, subtitulo, imagen_url, enlace, activo, orden) 
VALUES (1, '¡Promo Asado Fin de Semana!', 'Los mejores cortes para tu parrilla con hasta 20% de descuento', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787865020/smv3jqaihner01b9s9ma.jpg', '/', true, 1) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO banners_publicidad (id, titulo, subtitulo, imagen_url, enlace, activo, orden) 
VALUES (2, 'Cortes Seleccionados - 100% Calidad Premium', 'Novillo pesado y ternera de primera selección garantizada', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787865062/diejnvhkquijesu7uxss.png', '/', true, 2) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO banners_publicidad (id, titulo, subtitulo, imagen_url, enlace, activo, orden) 
VALUES (3, 'Club Valette: Acumulá puntos y canjeá descuentos', 'Registrate y ganá puntos con cada pedido para canjear en tus compras', 'https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1787730523/zrhuld2zctmfgtz4mnes.jpg', '/club', true, 3) 
ON CONFLICT (id) DO NOTHING;

SELECT setval('banners_publicidad_id_seq', (SELECT COALESCE(MAX(id), 1) FROM banners_publicidad));

-- DATA EMPLEADOS
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (1, 1, 'Carlos Gómez', NULL, NULL, 'cortador', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (2, 1, 'Martín Benítez', NULL, NULL, 'cortador', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (3, 1, 'Lucía Fernández', NULL, NULL, 'cajero', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (4, 1, 'Esteban Romero', NULL, NULL, 'encargado', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (5, 1, 'Matias Rivarola', NULL, NULL, 'cortador', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO empleados (id, sucursal_id, nombre, apellido, pin_hash, rol, activo) VALUES (7, 1, 'Administrador Valette', NULL, NULL, 'admin', true) ON CONFLICT (id) DO NOTHING;

SELECT setval('empleados_id_seq', (SELECT COALESCE(MAX(id), 1) FROM empleados));
