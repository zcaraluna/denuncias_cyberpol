-- 1. Agregar columnas a codigos_activacion
ALTER TABLE codigos_activacion ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'general' NOT NULL;
ALTER TABLE codigos_activacion ADD COLUMN IF NOT EXISTS oficina VARCHAR(100) NULL;

-- 2. Crear tabla intermedia para seriales especiales
CREATE TABLE IF NOT EXISTS codigo_usuarios_autorizados (
    id SERIAL PRIMARY KEY,
    codigo_activacion_id INTEGER NOT NULL REFERENCES codigos_activacion(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(codigo_activacion_id, usuario_id)
);

-- 3. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_codigo_usuarios_codigo ON codigo_usuarios_autorizados(codigo_activacion_id);
CREATE INDEX IF NOT EXISTS idx_codigo_usuarios_usuario ON codigo_usuarios_autorizados(usuario_id);
