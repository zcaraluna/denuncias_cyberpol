-- Migración para añadir columna de conteo de impresiones
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS cantidad_impresiones INTEGER DEFAULT 0;
