-- Tabla para almacenar los tokens de firma y las imágenes capturadas
CREATE TABLE IF NOT EXISTS denuncia_firmas (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    rol VARCHAR(30) NOT NULL, -- 'operador' o 'denunciante'
    firma_base64 TEXT, -- La imagen en formato data:image/png;base64,...
    usado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_uso TIMESTAMP,
    CONSTRAINT check_rol_firma CHECK (rol IN ('operador', 'denunciante'))
);

CREATE INDEX IF NOT EXISTS idx_denuncia_firmas_denuncia ON denuncia_firmas(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_denuncia_firmas_token ON denuncia_firmas(token);
