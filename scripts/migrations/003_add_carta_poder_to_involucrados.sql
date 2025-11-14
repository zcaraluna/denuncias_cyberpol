-- Agregar campos de carta poder a la tabla denuncias_involucrados
ALTER TABLE denuncias_involucrados
ADD COLUMN IF NOT EXISTS con_carta_poder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS carta_poder_fecha DATE,
ADD COLUMN IF NOT EXISTS carta_poder_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS carta_poder_notario VARCHAR(255);

-- Crear índice para búsquedas por carta poder
CREATE INDEX IF NOT EXISTS idx_denuncias_involucrados_carta_poder ON denuncias_involucrados(con_carta_poder) WHERE con_carta_poder = TRUE;

