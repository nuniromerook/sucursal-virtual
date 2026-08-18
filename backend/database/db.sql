CREATE DATABASE valette_db;

CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    telefono VARCHAR(20),
    horario_atencion VARCHAR(255),
    activa BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE catalogo (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    especie VARCHAR(20) NOT NULL,
    categoria VARCHAR(50),
    imagen_url TEXT,
    calorias INT,
    proteinas DECIMAL(5, 2),
    grasas_totales DECIMAL(5, 2),
    activo BOOLEAN NOT NULL DEFAULT true,
    destacado BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    catalogo_id INT NOT NULL REFERENCES catalogo(id),
    sucursal_id INT NOT NULL REFERENCES sucursales(id),
    precio INT NOT NULL,
    precio_anterior INT,
    cantidad INT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (catalogo_id, sucursal_id)
);
