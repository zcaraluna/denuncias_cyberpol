-- Agregar columna de matrícula para abogados en la tabla de denunciantes
ALTER TABLE denunciantes
ADD COLUMN IF NOT EXISTS matricula VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_denunciantes_matricula ON denunciantes(matricula);

