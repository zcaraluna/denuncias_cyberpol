-- Agregar columnas para denuncia escrita
ALTER TABLE denuncias
ADD COLUMN IF NOT EXISTS es_denuncia_escrita BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archivo_denuncia_url TEXT;

-- Crear índice para optimizar búsquedas de denuncias escritas
CREATE INDEX IF NOT EXISTS idx_denuncias_escritas ON denuncias(es_denuncia_escrita);
