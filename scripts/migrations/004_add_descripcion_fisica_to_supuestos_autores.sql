-- Agregar columna descripcion_fisica a la tabla supuestos_autores
-- Esta columna almacenará la descripción física del supuesto autor cuando es desconocido

ALTER TABLE supuestos_autores
ADD COLUMN IF NOT EXISTS descripcion_fisica TEXT;

-- Comentario para documentar la columna
COMMENT ON COLUMN supuestos_autores.descripcion_fisica IS 'Descripción física del supuesto autor cuando es desconocido (altura, complexión, características distintivas, etc.)';

