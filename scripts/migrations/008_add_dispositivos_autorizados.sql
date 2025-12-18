-- Tabla de códigos de activación (códigos de un solo uso para autorizar dispositivos)
CREATE TABLE IF NOT EXISTS codigos_activacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_en TIMESTAMP NULL,
    dispositivo_fingerprint VARCHAR(255) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    expira_en TIMESTAMP NULL,
    CONSTRAINT codigo_no_vacio CHECK (LENGTH(codigo) > 0)
);

-- Tabla de dispositivos autorizados (computadoras que ya fueron autenticadas)
CREATE TABLE IF NOT EXISTS dispositivos_autorizados (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    codigo_activacion_id INTEGER REFERENCES codigos_activacion(id) ON DELETE SET NULL,
    autorizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fingerprint_no_vacio CHECK (LENGTH(fingerprint) > 0)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_codigos_activacion_codigo ON codigos_activacion(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_activacion_usado ON codigos_activacion(usado);
CREATE INDEX IF NOT EXISTS idx_dispositivos_fingerprint ON dispositivos_autorizados(fingerprint);
CREATE INDEX IF NOT EXISTS idx_dispositivos_activo ON dispositivos_autorizados(activo);
CREATE INDEX IF NOT EXISTS idx_dispositivos_ultimo_acceso ON dispositivos_autorizados(ultimo_acceso);

