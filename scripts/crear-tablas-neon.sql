-- Script completo para crear todas las tablas en Neon
-- Ejecutar en el SQL Editor de Neon

-- Limpiar todo primero (CUIDADO: esto borra todo)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;

-- Tabla de usuarios (operadores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    grado VARCHAR(50) NOT NULL,
    oficina VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'operador',
    activo BOOLEAN DEFAULT true,
    debe_cambiar_contraseña BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rol CHECK (rol IN ('superadmin', 'admin', 'operador', 'supervisor'))
);

-- Tabla de denunciantes
CREATE TABLE denunciantes (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(200) NOT NULL,
    cedula VARCHAR(50) UNIQUE NOT NULL,
    tipo_documento VARCHAR(100),
    domicilio TEXT,
    nacionalidad VARCHAR(100),
    estado_civil VARCHAR(50),
    edad INTEGER,
    fecha_nacimiento DATE,
    lugar_nacimiento VARCHAR(200),
    telefono VARCHAR(50),
    correo VARCHAR(200),
    profesion VARCHAR(200),
    matricula VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de denuncias
CREATE TABLE denuncias (
    id SERIAL PRIMARY KEY,
    denunciante_id INTEGER REFERENCES denunciantes(id) ON DELETE CASCADE,
    fecha_denuncia DATE,
    hora_denuncia VARCHAR(10),
    fecha_hecho DATE,
    hora_hecho VARCHAR(10),
    fecha_hecho_fin DATE,
    hora_hecho_fin VARCHAR(10),
    tipo_denuncia VARCHAR(200),
    otro_tipo VARCHAR(200),
    relato TEXT,
    lugar_hecho TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    orden INTEGER NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    oficina VARCHAR(100) NOT NULL,
    operador_grado VARCHAR(50) NOT NULL,
    operador_nombre VARCHAR(100) NOT NULL,
    operador_apellido VARCHAR(100) NOT NULL,
    monto_dano INTEGER,
    moneda VARCHAR(50),
    hash VARCHAR(50) UNIQUE NOT NULL,
    pdf BYTEA,
    estado VARCHAR(20) DEFAULT 'completada',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_estado CHECK (estado IN ('borrador', 'completada')),
    CONSTRAINT check_completada CHECK (
        (estado = 'completada' AND fecha_denuncia IS NOT NULL AND hora_denuncia IS NOT NULL AND 
         fecha_hecho IS NOT NULL AND hora_hecho IS NOT NULL AND tipo_denuncia IS NOT NULL AND 
         relato IS NOT NULL AND lugar_hecho IS NOT NULL) 
        OR estado = 'borrador'
    )
);

-- Tabla de supuestos autores
CREATE TABLE supuestos_autores (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    autor_conocido VARCHAR(20) NOT NULL DEFAULT 'Desconocido',
    nombre_autor VARCHAR(200),
    cedula_autor VARCHAR(50),
    domicilio_autor TEXT,
    nacionalidad_autor VARCHAR(100),
    estado_civil_autor VARCHAR(50),
    edad_autor INTEGER,
    fecha_nacimiento_autor DATE,
    lugar_nacimiento_autor VARCHAR(200),
    telefono_autor VARCHAR(50),
    profesion_autor VARCHAR(200),
    telefonos_involucrados VARCHAR(200),
    numero_cuenta_beneficiaria VARCHAR(200),
    nombre_cuenta_beneficiaria VARCHAR(200),
    entidad_bancaria VARCHAR(200),
    descripcion_fisica TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de denuncias
CREATE TABLE historial_denuncias (
    id SERIAL PRIMARY KEY,
    nombre_denunciante VARCHAR(200) NOT NULL,
    cedula_denunciante VARCHAR(50) NOT NULL,
    operador VARCHAR(200) NOT NULL,
    fecha_denuncia DATE NOT NULL,
    hora_denuncia VARCHAR(10) NOT NULL,
    numero_orden INTEGER NOT NULL,
    tipo_hecho VARCHAR(200) NOT NULL,
    hash_denuncia VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de visitas a denuncias
CREATE TABLE visitas_denuncias (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de denunciantes involucrados
CREATE TABLE denuncias_involucrados (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    denunciante_id INTEGER REFERENCES denunciantes(id) ON DELETE CASCADE,
    rol VARCHAR(30) NOT NULL,
    representa_denunciante_id INTEGER REFERENCES denunciantes(id) ON DELETE SET NULL,
    con_carta_poder BOOLEAN DEFAULT FALSE,
    carta_poder_fecha DATE,
    carta_poder_numero VARCHAR(100),
    carta_poder_notario VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rol_denuncia CHECK (rol IN ('principal', 'co-denunciante', 'abogado'))
);

-- Tabla de ampliaciones de denuncia
CREATE TABLE ampliaciones_denuncia (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
    numero_ampliacion INTEGER NOT NULL,
    relato TEXT NOT NULL,
    fecha_ampliacion DATE NOT NULL,
    hora_ampliacion VARCHAR(10) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    operador_grado VARCHAR(50) NOT NULL,
    operador_nombre VARCHAR(100) NOT NULL,
    operador_apellido VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de códigos de activación
CREATE TABLE codigos_activacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_en TIMESTAMP NULL,
    dispositivo_fingerprint VARCHAR(255) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    expira_en TIMESTAMP NULL,
    nombre VARCHAR(200) NULL,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT codigo_no_vacio CHECK (LENGTH(codigo) > 0)
);

-- Tabla de dispositivos autorizados
CREATE TABLE dispositivos_autorizados (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    codigo_activacion_id INTEGER REFERENCES codigos_activacion(id) ON DELETE SET NULL,
    autorizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    nombre VARCHAR(200) NULL,
    CONSTRAINT fingerprint_no_vacio CHECK (LENGTH(fingerprint) > 0)
);

-- Índices
CREATE INDEX idx_denuncias_fecha ON denuncias(fecha_denuncia);
CREATE INDEX idx_denuncias_orden ON denuncias(orden);
CREATE INDEX idx_denuncias_hash ON denuncias(hash);
CREATE INDEX idx_denunciantes_cedula ON denunciantes(cedula);
CREATE INDEX idx_denunciantes_matricula ON denunciantes(matricula);
CREATE INDEX idx_supuestos_autores_denuncia ON supuestos_autores(denuncia_id);
CREATE INDEX idx_visitas_denuncia ON visitas_denuncias(denuncia_id);
CREATE INDEX idx_visitas_usuario ON visitas_denuncias(usuario_id);
CREATE INDEX idx_denuncias_involucrados_denuncia ON denuncias_involucrados(denuncia_id);
CREATE INDEX idx_denuncias_involucrados_denunciante ON denuncias_involucrados(denunciante_id);
CREATE INDEX idx_codigos_activacion_codigo ON codigos_activacion(codigo);
CREATE INDEX idx_codigos_activacion_usado ON codigos_activacion(usado);
CREATE INDEX idx_codigos_activacion_activo ON codigos_activacion(activo);
CREATE INDEX idx_codigos_activacion_nombre ON codigos_activacion(nombre);
CREATE INDEX idx_dispositivos_fingerprint ON dispositivos_autorizados(fingerprint);
CREATE INDEX idx_dispositivos_activo ON dispositivos_autorizados(activo);
CREATE INDEX idx_dispositivos_ultimo_acceso ON dispositivos_autorizados(ultimo_acceso);

