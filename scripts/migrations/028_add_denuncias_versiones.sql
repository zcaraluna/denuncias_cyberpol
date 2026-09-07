-- Historial de versiones de denuncias: guarda un snapshot completo del estado
-- de la denuncia (más denunciantes/involucrados/supuestos autores) justo ANTES
-- de cada edición (período de gracia normal o edición extraordinaria), para
-- poder reconstruir y comparar (diff) cualquier versión anterior contra el
-- estado actual o contra otra versión.
CREATE TABLE IF NOT EXISTS denuncias_versiones (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
    version_numero INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    motivo VARCHAR(50) NOT NULL, -- 'EDICION_GRACIA' | 'EDICION_EXTRAORDINARIA'
    editado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    editor_nombre VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (denuncia_id, version_numero)
);

CREATE INDEX IF NOT EXISTS idx_denuncias_versiones_denuncia_id ON denuncias_versiones(denuncia_id);
