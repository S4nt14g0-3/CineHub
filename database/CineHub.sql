-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: CineHub Sur
-- SGBD: PostgreSQL (Neon DB)
-- TABLAS: 15
-- Esquema canónico (coincide con el DER y el README del proyecto)
-- Ejecutar completo en Neon (SQL Editor) o con psql:
--   psql "$DATABASE_URL" -f database/CineHub.sql
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
    codigo_ticket VARCHAR(100) UNIQUE,
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

-- Roles (RBAC)
INSERT INTO roles (nombre, descripcion) VALUES
('Cliente', 'Usuario final que consulta cartelera y realiza reservas'),
('Empleado', 'Personal en sede que valida entradas y atiende punto de venta'),
('Administrador', 'Gestión general del sistema, salas, películas y reportes');

-- Clasificaciones
INSERT INTO clasificaciones (codigo, descripcion) VALUES
('TP', 'Todos los públicos'),
('+13', 'Mayores de 13 años'),
('+18', 'Exclusivo para mayores de 18 años');

-- Géneros
INSERT INTO generos (nombre) VALUES
('Acción'), ('Comedia'), ('Drama'), ('Ciencia Ficción'),
('Terror'), ('Aventura'), ('Animación'), ('Suspenso');

-- Cines (sedes)
INSERT INTO cines (nombre, direccion, ciudad) VALUES
('CineHub - Centro', 'Calle 5 #12-45', 'Cali'),
('CineHub - Norte', 'Av. 6N #23-45', 'Cali');

-- Salas (todas con 40 asientos: 5 filas x 8 columnas)
INSERT INTO salas (cine_id, nombre, capacidad, tipo_sala) VALUES
(1, 'Sala 1', 40, '2D'),
(1, 'Sala 2', 40, '3D'),
(2, 'Sala 3', 40, 'IMAX');

-- Asientos generados automáticamente para cada sala
INSERT INTO asientos (sala_id, fila, columna, tipo)
SELECT s.id, chr(64 + r.n), c.n,
       CASE WHEN r.n >= 4 THEN 'Preferencial' ELSE 'Estándar' END
FROM salas s
CROSS JOIN generate_series(1, 5) AS r(n)
CROSS JOIN generate_series(1, 8) AS c(n);

-- Películas (clasificacion_id: 1=TP, 2=+13, 3=+18)
INSERT INTO peliculas (clasificacion_id, titulo, duracion_minutos, sinopsis, poster_url) VALUES
(2, 'Interstellar 2', 165, 'Un viaje a través de un agujero de gusano para salvar a la humanidad.', 'https://picsum.photos/seed/interstellar2/400/600'),
(1, 'CineHub Chronicles', 120, 'Documental sobre la creación del mejor sistema de gestión de cine.', 'https://picsum.photos/seed/cinehub/400/600'),
(3, 'El Guardián del Sur', 105, 'Suspenso y misterio ambientados en el sur de Colombia.', 'https://picsum.photos/seed/guardian/400/600'),
(1, 'Aventura en el Amazonas', 98, 'Una familia explora la selva amazónica y descubre un mundo oculto.', 'https://picsum.photos/seed/amazonas/400/600'),
(1, 'Risa Total', 92, 'Comedia sobre un grupo de amigos que planea la boda más caótica.', 'https://picsum.photos/seed/risatotal/400/600'),
(3, 'Acción Sin Límites', 130, 'Un exagente debe detener una conspiración internacional.', 'https://picsum.photos/seed/accion/400/600'),
(2, 'Nope', 130, 'En la granja de la familia Wayne aparecen apariciones inquietantes en el cielo.', 'https://picsum.photos/seed/nope/400/600'),
(2, 'Oppenheimer', 180, 'La historia del físico J. Robert Oppenheimer y la creación de la bomba atómica.', 'https://picsum.photos/seed/oppenheimer/400/600'),
(1, 'El Abrazo del Lobo', 95, 'Una mujer regresa al pueblo natal para enfrentar un secreto familiar.', 'https://picsum.photos/seed/lobo/400/600'),
(3, 'Eclipse de Talento', 110, 'Competencia misteriosa donde los concursantes deben demostrar sus habilidades.', 'https://picsum.photos/seed/eclipse_talento/400/600'),
(2, 'La Última Estrella', 125, 'Un grupo de adolescentes y un monstruo vivían juntos en un planeta remoto.', 'https://picsum.photos/seed/ultima_estrella/400/600');

-- Relación Película - Género (N:M)
INSERT INTO pelicula_generos (pelicula_id, genero_id) VALUES
(1, 4), (1, 6),          -- Interstellar 2: Ciencia Ficción, Aventura
(2, 3),                  -- CineHub Chronicles: Drama
(3, 5), (3, 8),          -- El Guardián del Sur: Terror, Suspenso
(4, 6), (4, 7),          -- Aventura en el Amazonas: Aventura, Animación
(5, 2),                  -- Risa Total: Comedia
(6, 1), (6, 8),          -- Acción Sin Límites: Acción, Suspenso
(7, 4), (7, 5),          -- Nope: Ciencia Ficción, Terror
(8, 1), (8, 3), (8, 4),  -- Oppenheimer: Acción, Drama, Ciencia Ficción
(9, 3),                  -- El Abrazo del Lobo: Drama
(10, 4), (10, 5),         -- Eclipse de Talento: Ciencia Ficción, Terror
(11, 1), (11, 2), (11, 4); -- La Última Estrella: Acción, Comedia, Ciencia Ficción

-- Funciones (fechas futuras relativas a la fecha de ejecución)
INSERT INTO funciones (pelicula_id, sala_id, fecha_hora, precio_base) VALUES
(1, 1, NOW() + INTERVAL '1 day 18 hours',  15000),
(1, 1, NOW() + INTERVAL '1 day 21 hours',  15000),
(1, 2, NOW() + INTERVAL '2 days 19 hours', 18000),
(2, 3, NOW() + INTERVAL '1 day 16 hours',  12000),
(3, 2, NOW() + INTERVAL '2 days 22 hours', 16000),
(4, 1, NOW() + INTERVAL '3 days 15 hours', 12000),
(5, 3, NOW() + INTERVAL '3 days 20 hours', 14000),
(6, 2, NOW() + INTERVAL '4 days 21 hours', 16000),
(7, 1, NOW() + INTERVAL '2 days 12 hours', 15000),
(7, 2, NOW() + INTERVAL '2 days 18 hours', 18000),
(8, 3, NOW() + INTERVAL '3 days 12 hours', 20000),
(8, 3, NOW() + INTERVAL '3 days 17 hours', 20000),
(9, 1, NOW() + INTERVAL '1 day 12 hours', 12000),
(10, 2, NOW() + INTERVAL '4 days 12 hours', 16000),
(11, 2, NOW() + INTERVAL '4 days 18 hours', 17000),
(11, 1, NOW() + INTERVAL '5 days 15 hours', 14000);

-- Usuarios de prueba (password_hash generado con bcrypt, 10 rondas)
--   admin@cinehub.com    -> admin123    (Administrador)
--   empleado@cinehub.com -> empleado123 (Empleado)
--   cliente@cinehub.com  -> cliente123  (Cliente)
INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono) VALUES
(3, 'Admin CineHub',    'admin@cinehub.com',    '$2b$10$DE1gwsUjxPGFfpCN04dU5.SNcCWgYsUfLoZk8EaBu3KZtZLO5sc6m', '3001112233'),
(2, 'Empleado Taquilla','empleado@cinehub.com', '$2b$10$RYxHxmmKfeulZSMqQ4bkHunvEoYie1YXRpw91o8YNKU1jQZDTTbUe', '3002223344'),
(1, 'Cliente Pruebas',  'cliente@cinehub.com',  '$2b$10$k5ASHIiLH5CcGObibrHlH.Bcem/.4lZpfwZ10r21k/mbywpXxZVhO', '3003334455');

-- Productos de dulcería
INSERT INTO productos_dulceria (nombre, precio, stock) VALUES
('Combo Palomitas Grande', 25000, 50),
('Gaseosa Mediana',         8000, 100),
('Nachos con Queso',       12000, 40),
('Dulces Gummy',            6000, 80),
('Combo Pareja (2 bebidas + palomitas)', 38000, 25);
