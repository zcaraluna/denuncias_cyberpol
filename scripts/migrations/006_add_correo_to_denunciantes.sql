-- Agregar columna correo a la tabla denunciantes si no existe
ALTER TABLE denunciantes
ADD COLUMN IF NOT EXISTS correo VARCHAR(200);

-- Agregar comentario
COMMENT ON COLUMN denunciantes.correo IS 'Correo electrónico del denunciante';



