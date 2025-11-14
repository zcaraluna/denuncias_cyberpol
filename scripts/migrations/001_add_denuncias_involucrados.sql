-- Crear tabla para relacionar múltiples denunciantes con una denuncia
CREATE TABLE IF NOT EXISTS denuncias_involucrados (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    denunciante_id INTEGER REFERENCES denunciantes(id) ON DELETE CASCADE,
    rol VARCHAR(30) NOT NULL,
    representa_denunciante_id INTEGER REFERENCES denunciantes(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rol_denuncia CHECK (rol IN ('principal', 'co-denunciante', 'abogado'))
);

CREATE INDEX IF NOT EXISTS idx_denuncias_involucrados_denuncia ON denuncias_involucrados(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_involucrados_denunciante ON denuncias_involucrados(denunciante_id);

