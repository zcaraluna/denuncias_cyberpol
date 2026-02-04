-- Tabla de usuarios (operadores)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    grado VARCHAR(50) NOT NULL,
    oficina VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'operador',
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rol CHECK (rol IN ('superadmin', 'admin', 'operador', 'supervisor'))
);

-- Tabla de denunciantes
CREATE TABLE IF NOT EXISTS denunciantes (
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
CREATE TABLE IF NOT EXISTS denuncias (
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
    lugar_hecho_no_aplica BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'completada',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_estado CHECK (estado IN ('borrador', 'completada')),
    CONSTRAINT check_completada CHECK (
        (estado = 'completada' AND fecha_denuncia IS NOT NULL AND hora_denuncia IS NOT NULL AND 
         fecha_hecho IS NOT NULL AND hora_hecho IS NOT NULL AND tipo_denuncia IS NOT NULL AND 
         relato IS NOT NULL AND (lugar_hecho IS NOT NULL OR lugar_hecho_no_aplica = TRUE)) 
        OR estado = 'borrador'
    )
);

-- Tabla de supuestos autores
CREATE TABLE IF NOT EXISTS supuestos_autores (
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

-- Tabla de historial de denuncias (para consultas rápidas)
CREATE TABLE IF NOT EXISTS historial_denuncias (
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
CREATE TABLE IF NOT EXISTS visitas_denuncias (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de denunciantes involucrados (co-denunciantes, abogados, etc.)
CREATE TABLE IF NOT EXISTS denuncias_involucrados (
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

CREATE INDEX IF NOT EXISTS idx_denuncias_involucrados_denuncia ON denuncias_involucrados(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_involucrados_denunciante ON denuncias_involucrados(denunciante_id);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_denuncias_fecha ON denuncias(fecha_denuncia);
CREATE INDEX IF NOT EXISTS idx_denuncias_orden ON denuncias(orden);
CREATE INDEX IF NOT EXISTS idx_denuncias_hash ON denuncias(hash);
CREATE INDEX IF NOT EXISTS idx_denunciantes_cedula ON denunciantes(cedula);
CREATE INDEX IF NOT EXISTS idx_denunciantes_matricula ON denunciantes(matricula);
CREATE INDEX IF NOT EXISTS idx_supuestos_autores_denuncia ON supuestos_autores(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_visitas_denuncia ON visitas_denuncias(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_visitas_usuario ON visitas_denuncias(usuario_id);

