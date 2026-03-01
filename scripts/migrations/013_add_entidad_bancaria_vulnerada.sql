-- Migración para agregar el campo de entidad bancaria vulnerada
ALTER TABLE denuncias ADD COLUMN entidad_bancaria_vulnerada TEXT;
