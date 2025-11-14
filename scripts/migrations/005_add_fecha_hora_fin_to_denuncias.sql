-- Agregar campos para rango de fechas/horas del hecho
ALTER TABLE denuncias
ADD COLUMN IF NOT EXISTS fecha_hecho_fin DATE,
ADD COLUMN IF NOT EXISTS hora_hecho_fin VARCHAR(10);

COMMENT ON COLUMN denuncias.fecha_hecho_fin IS 'Fecha de fin del hecho (para rangos de fechas)';
COMMENT ON COLUMN denuncias.hora_hecho_fin IS 'Hora de fin del hecho (para rangos de fechas)';

