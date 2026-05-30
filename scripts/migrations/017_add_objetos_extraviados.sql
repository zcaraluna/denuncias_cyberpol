-- Agregar columna para almacenar los objetos extraviados en formato JSON
ALTER TABLE denuncias ADD COLUMN objetos_extraviados TEXT DEFAULT NULL;
