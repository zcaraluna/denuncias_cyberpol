-- Migración consolidada para corregir esquema de denuncias
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS monto_dano INTEGER;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS moneda VARCHAR(50);
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS bancos_relacionados TEXT;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS usar_rango BOOLEAN DEFAULT FALSE;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS es_denuncia_escrita BOOLEAN DEFAULT FALSE;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS archivo_denuncia_url TEXT;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS entidad_bancaria_vulnerada TEXT;
