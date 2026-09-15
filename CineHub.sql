-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: CineHub Sur
-- SGBD: PostgreSQL (Neon DB)
-- TABLAS: 15
-- ============================================================

-- Limpieza previa de tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS detalle_compras_dulceria CASCADE;
DROP TABLE IF EXISTS productos_dulceria CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS funciones CASCADE;
DROP TABLE IF EXISTS pelicula_generos CASCADE;
DROP TABLE IF EXISTS generos CASCADE;
DROP TABLE IF EXISTS peliculas CASCADE;
DROP TABLE IF EXISTS clasificaciones CASCADE;
DROP TABLE IF EXISTS asientos CASCADE;
DROP TABLE IF EXISTS salas CASCADE;
DROP TABLE IF EXISTS cines CASCADE;
DROP TABLE IF EXISTS auditoria_accesos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Tabla de Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Auditoría de Accesos
CREATE TABLE auditoria_accesos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(45),
    exitoso BOOLEAN DEFAULT TRUE
);

-- 4. Tabla de Cines (Sedes)
CREATE TABLE cines (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    ciudad VARCHAR(100) NOT NULL
);

-- 5. Tabla de Salas
CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    cine_id INT NOT NULL REFERENCES cines(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL CHECK (capacidad > 0),
    tipo_sala VARCHAR(20) DEFAULT '2D'
);

-- 6. Tabla de Asientos
CREATE TABLE asientos (
    id SERIAL PRIMARY KEY,
    sala_id INT NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    fila VARCHAR(5) NOT NULL,
    columna INT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'Estándar',
    CONSTRAINT uq_asiento_sala UNIQUE(sala_id, fila, columna)
);

-- 7. Tabla de Clasificaciones de Películas
CREATE TABLE clasificaciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 8. Tabla de Géneros
CREATE TABLE generos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 9. Tabla de Películas
CREATE TABLE peliculas (
    id SERIAL PRIMARY KEY,
    clasificacion_id INT NOT NULL REFERENCES clasificaciones(id) ON DELETE RESTRICT,
    titulo VARCHAR(150) NOT NULL,
    duracion_minutos INT NOT NULL CHECK (duracion_minutos > 0),
    sinopsis TEXT,
    poster_url VARCHAR(255)
);

-- 10. Tabla Intermedia Película - Géneros (N:M)
CREATE TABLE pelicula_generos (
    pelicula_id INT NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
    genero_id INT NOT NULL REFERENCES generos(id) ON DELETE CASCADE,
    PRIMARY KEY (pelicula_id, genero_id)
);

-- 11. Tabla de Funciones
CREATE TABLE funciones (
    id SERIAL PRIMARY KEY,
    pelicula_id INT NOT NULL REFERENCES peliculas(id) ON DELETE RESTRICT,
    sala_id INT NOT NULL REFERENCES salas(id) ON DELETE RESTRICT,
    fecha_hora TIMESTAMP NOT NULL,
    precio_base NUMERIC(10, 2) NOT NULL CHECK (precio_base >= 0)
);

-- 12. Tabla de Compras (Encabezado de Transacción)
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_total NUMERIC(10, 2) NOT NULL CHECK (monto_total >= 0),
    estado VARCHAR(20) DEFAULT 'Completada'
);

-- 13. Tabla de Tickets (Detalle de Funciones por Compra)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    compra_id INT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    funcion_id INT NOT NULL REFERENCES funciones(id) ON DELETE RESTRICT,
    asiento_id INT NOT NULL REFERENCES asientos(id) ON DELETE RESTRICT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    codigo_qr VARCHAR(100) UNIQUE,
    validado BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_funcion_asiento UNIQUE(funcion_id, asiento_id)
);

-- 14. Tabla de Productos de Dulcería
CREATE TABLE productos_dulceria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

-- 15. Tabla de Detalle de Compras de Dulcería
CREATE TABLE detalle_compras_dulceria (
    id SERIAL PRIMARY KEY,
    compra_id INT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos_dulceria(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);

-- ============================================================
-- DATOS SEMILLA INICIALES
-- ============================================================

INSERT INTO roles (nombre, descripcion) VALUES
('Cliente', 'Usuario final que consulta cartelera y realiza reservas'),
('Empleado', 'Personal en sede que valida entradas y atiende punto de venta'),
('Administrador', 'Gestión general del sistema, salas, películas y reportes');

INSERT INTO clasificaciones (codigo, descripcion) VALUES
('TP', 'Todos los públicos'),
('+13', 'Mayores de 13 años'),
('+18', 'Exclusivo para mayores de 18 años');

INSERT INTO generos (nombre) VALUES
('Acción'), ('Comedia'), ('Drama'), ('Ciencia Ficción'), ('Terror');